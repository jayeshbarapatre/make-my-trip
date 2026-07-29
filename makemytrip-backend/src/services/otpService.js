import crypto from 'crypto'
import { db } from '../config/firebase.js'

const COLLECTION = 'otps'

const OTP_LENGTH = 6
const TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES, 10) || 5
const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5
const RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30
const MAX_SENDS_PER_WINDOW = parseInt(process.env.OTP_MAX_SENDS_PER_HOUR, 10) || 5
const SEND_WINDOW_MS = 60 * 60 * 1000

/**
 * OTPs are stored hashed so a leaked Firestore export cannot be replayed.
 * The pepper falls back to JWT_SECRET, which index.js already requires to exist.
 */
const pepper = () => process.env.OTP_PEPPER || process.env.JWT_SECRET || ''

const hashOtp = (otp, salt) =>
  crypto.createHash('sha256').update(`${salt}:${otp}:${pepper()}`).digest('hex')

const docKey = (purpose, channel, identifier) =>
  `${purpose}_${channel}_${String(identifier).toLowerCase().replace(/[^a-z0-9+@._-]/gi, '')}`

/** Cryptographically secure, uniformly distributed, always OTP_LENGTH digits. */
const generateOtp = () => {
  const max = 10 ** OTP_LENGTH
  const min = 10 ** (OTP_LENGTH - 1)
  return String(crypto.randomInt(min, max))
}

const nowIso = () => new Date().toISOString()

/**
 * Creates and stores a fresh OTP, enforcing the resend cooldown and hourly cap.
 * Returns the plaintext code once, for the caller to deliver — it is never stored.
 */
export const issueOtp = async ({ identifier, channel, purpose = 'login', meta = {} }) => {
  if (!identifier) throw new Error('identifier is required')

  const ref = db.collection(COLLECTION).doc(docKey(purpose, channel, identifier))
  const existing = await ref.get()
  const now = Date.now()

  if (existing.exists) {
    const prev = existing.data()
    const lastSent = prev.lastSentAt ? new Date(prev.lastSentAt).getTime() : 0
    const sinceLast = (now - lastSent) / 1000

    if (sinceLast < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - sinceLast)
      const err = new Error(`Please wait ${wait} second${wait === 1 ? '' : 's'} before requesting another code.`)
      err.code = 'EOTPCOOLDOWN'
      err.retryAfter = wait
      throw err
    }

    const windowStart = prev.windowStartedAt ? new Date(prev.windowStartedAt).getTime() : now
    const inWindow = now - windowStart < SEND_WINDOW_MS
    if (inWindow && (prev.sendsInWindow || 0) >= MAX_SENDS_PER_WINDOW) {
      const err = new Error('Too many verification codes requested. Please try again in an hour.')
      err.code = 'EOTPTHROTTLE'
      err.retryAfter = Math.ceil((windowStart + SEND_WINDOW_MS - now) / 1000)
      throw err
    }
  }

  const otp = generateOtp()
  const salt = crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(now + TTL_MINUTES * 60 * 1000)

  const prev = existing.exists ? existing.data() : {}
  const windowStart = prev.windowStartedAt && (now - new Date(prev.windowStartedAt).getTime() < SEND_WINDOW_MS)
    ? prev.windowStartedAt
    : nowIso()

  await ref.set({
    identifier: String(identifier).toLowerCase(),
    channel,
    purpose,
    salt,
    otpHash: hashOtp(otp, salt),
    expiresAt: expiresAt.toISOString(),
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    consumed: false,
    lastSentAt: nowIso(),
    windowStartedAt: windowStart,
    sendsInWindow: (windowStart === prev.windowStartedAt ? (prev.sendsInWindow || 0) : 0) + 1,
    createdAt: nowIso(),
    meta
  })

  return {
    otp,
    expiresAt,
    ttlMinutes: TTL_MINUTES,
    resendAfterSeconds: RESEND_COOLDOWN_SECONDS
  }
}

const FAILURES = {
  NOT_FOUND: { code: 'OTP_NOT_FOUND', message: 'No verification code was requested for this number. Please request a new one.' },
  EXPIRED: { code: 'OTP_EXPIRED', message: 'This verification code has expired. Please request a new one.' },
  CONSUMED: { code: 'OTP_ALREADY_USED', message: 'This verification code has already been used. Please request a new one.' },
  TOO_MANY: { code: 'OTP_TOO_MANY_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new code.' },
  INVALID: { code: 'OTP_INVALID', message: 'Incorrect verification code. Please check and try again.' }
}

/**
 * Verifies and atomically consumes an OTP. A code can succeed exactly once:
 * the consuming update runs inside a transaction, so concurrent requests
 * cannot both pass with the same code.
 */
export const verifyOtp = async ({ identifier, channel, purpose = 'login', otp }) => {
  if (!identifier || !otp) {
    return { ok: false, ...FAILURES.INVALID }
  }

  const ref = db.collection(COLLECTION).doc(docKey(purpose, channel, identifier))

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref)
    if (!doc.exists) return { ok: false, ...FAILURES.NOT_FOUND }

    const data = doc.data()

    if (data.consumed) return { ok: false, ...FAILURES.CONSUMED }

    if (new Date(data.expiresAt) < new Date()) {
      tx.delete(ref)
      return { ok: false, ...FAILURES.EXPIRED }
    }

    if ((data.attempts || 0) >= (data.maxAttempts || MAX_ATTEMPTS)) {
      tx.delete(ref)
      return { ok: false, ...FAILURES.TOO_MANY }
    }

    const candidate = hashOtp(String(otp).trim(), data.salt)
    const expected = data.otpHash || ''
    const match = candidate.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected))

    if (!match) {
      const attempts = (data.attempts || 0) + 1
      tx.update(ref, { attempts, updatedAt: nowIso() })
      const remaining = (data.maxAttempts || MAX_ATTEMPTS) - attempts
      return {
        ok: false,
        ...FAILURES.INVALID,
        attemptsRemaining: Math.max(0, remaining),
        message: remaining > 0
          ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : FAILURES.TOO_MANY.message
      }
    }

    // Consume immediately so the same code cannot be replayed.
    tx.delete(ref)
    return { ok: true, meta: data.meta || {}, purpose, channel, identifier: data.identifier }
  })
}

export const clearOtp = async ({ identifier, channel, purpose = 'login' }) => {
  try {
    await db.collection(COLLECTION).doc(docKey(purpose, channel, identifier)).delete()
  } catch { /* nothing to clear */ }
}

export const otpConfig = () => ({
  length: OTP_LENGTH,
  ttlMinutes: TTL_MINUTES,
  maxAttempts: MAX_ATTEMPTS,
  resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
  maxSendsPerHour: MAX_SENDS_PER_WINDOW
})

export default { issueOtp, verifyOtp, clearOtp, otpConfig }
