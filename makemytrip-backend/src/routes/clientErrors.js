import { Router } from 'express'
import { reportError } from '../services/errorReporter.js'
import { generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

/**
 * Sink for render-time crashes caught by the frontend ErrorBoundary.
 *
 * Deliberately unauthenticated: a crash on the login or search page happens
 * with no session, and those are exactly the crashes worth knowing about. No
 * attempt is made to attribute the report to a user — running `authenticate`
 * here would let an expired token turn a crash report into a 401, losing the
 * very signal the endpoint exists to collect.
 *
 * Public means abusable, so it is bounded three ways: the rate limiter here,
 * the 256kb body cap in index.js, and fingerprint throttling in the reporter,
 * which collapses repeated reports onto one document instead of one write per
 * occurrence. That last one matters — this project has exhausted its Firestore
 * daily quota once already.
 */
router.post('/', generalLimiter, async (req, res) => {
  const { message, stack, path, componentStack } = req.body ?? {}

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'A message is required' })
  }

  // The reporter redacts, truncates and never throws.
  const { recorded, fingerprint } = await reportError({
    error: { message, stack: [stack, componentStack].filter(Boolean).join('\n') },
    source: 'browser',
    severity: 'error',
    context: { method: 'CLIENT', path }
  })

  res.json({ success: true, recorded, fingerprint })
})

export default router
