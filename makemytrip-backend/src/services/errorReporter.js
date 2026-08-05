import crypto from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'

// Production error capture.
//
// Before this, an unhandled error reached `console.error` and nothing else. On
// Render that means it scrolls past in a log stream nobody is watching, so the
// first report of an outage is a customer email. For a platform that takes
// money that is not an acceptable feedback loop.
//
// Errors are grouped by fingerprint into `errorReports`, one document per
// distinct failure with an occurrence count, so the admin dashboard can rank by
// what is actually breaking rather than by what happened most recently.
//
// This deliberately writes to Firestore rather than adding a third-party SDK:
// the platform already runs Firestore, and a new external service would be one
// more credential to provision before launch. `forwardHook` is the seam for
// bolting on Sentry later without touching any call site.

const COLLECTION = 'errorReports'

/** Minimum seconds between writes for the same fingerprint. */
const THROTTLE_SECONDS = Number(process.env.ERROR_REPORT_THROTTLE_SECONDS) || 60

/** Guards against one hot loop writing a document per iteration. */
const lastWrittenAt = new Map()

let forwardHook = null

/** Register an external sink (Sentry, etc). Failures here are swallowed. */
export const onErrorReported = (fn) => { forwardHook = fn }

/**
 * Strips anything that must never reach the datastore.
 *
 * Stack traces and error messages routinely carry the value that caused the
 * failure, which on this platform means tokens, emails and card-shaped numbers.
 * The security checklist forbids logging them, and a crash report is still a
 * log.
 */
export const redact = (text) => {
  if (!text) return ''
  return String(text)
    .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g, '[jwt]')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/g, '[email]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[card]')
    .replace(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/g, '[phone]')
    .replace(/\b(rzp_(?:test|live)_[A-Za-z0-9]+)\b/g, '[key]')
    .slice(0, 4000)
}

/**
 * Groups occurrences of the same failure.
 *
 * Ids, uuids and numbers are normalised out of the message so "Booking BK123
 * not found" and "Booking BK998 not found" are one problem rather than two
 * hundred documents.
 */
export const fingerprintOf = ({ source, message, stack }) => {
  const normalisedMessage = redact(message)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b\d+\b/g, '<n>')
    .replace(/\b[A-Z]{2,}[0-9A-Z]{6,}\b/g, '<id>')

  const topFrame = redact(stack).split('\n').find((l) => l.trim().startsWith('at ')) ?? ''

  return crypto
    .createHash('sha1')
    .update(`${source}|${normalisedMessage}|${topFrame.trim()}`)
    .digest('hex')
    .slice(0, 16)
}

/**
 * Records an error. Never throws and never rejects — a failing reporter must
 * not turn a handled error into an unhandled one.
 *
 * @returns {Promise<{recorded: boolean, fingerprint: string, reason?: string}>}
 */
export const reportError = async ({
  error,
  source = 'server',
  severity = 'error',
  context = {}
} = {}) => {
  const message = redact(error?.message ?? String(error ?? 'Unknown error'))
  const stack = redact(error?.stack ?? '')
  const fingerprint = fingerprintOf({ source, message, stack })

  try {
    if (forwardHook) {
      try {
        await forwardHook({ fingerprint, source, severity, message, stack, context })
      } catch { /* an external sink must never break the local one */ }
    }

    const now = Date.now()
    const previous = lastWrittenAt.get(fingerprint)
    if (previous && now - previous < THROTTLE_SECONDS * 1000) {
      return { recorded: false, fingerprint, reason: 'throttled' }
    }
    lastWrittenAt.set(fingerprint, now)

    await db.collection(COLLECTION).doc(fingerprint).set(
      {
        fingerprint,
        source,
        severity,
        message,
        stack,
        // Route and method only. Never the body — it carries passwords, tokens
        // and traveller PII.
        context: {
          method: context.method ?? null,
          path: redact(context.path ?? null) || null,
          statusCode: context.statusCode ?? null,
          userId: context.userId ?? null,
          release: process.env.RENDER_GIT_COMMIT ?? null
        },
        occurrences: FieldValue.increment(1),
        lastSeenAt: FieldValue.serverTimestamp(),
        resolved: false
      },
      { merge: true }
    )

    return { recorded: true, fingerprint }
  } catch (err) {
    console.error('⚠️ Error reporter failed (original error still logged above):', err.message)
    return { recorded: false, fingerprint, reason: 'reporter_failed' }
  }
}

/** Test seam — the throttle is process-global otherwise. */
export const resetThrottle = () => lastWrittenAt.clear()

export default { reportError, fingerprintOf, redact, onErrorReported, resetThrottle }
