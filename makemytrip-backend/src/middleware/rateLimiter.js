import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

// Every rate-limit policy in the platform. Routes pick one of these; none of
// them build their own, so a limit is changed in exactly one place.
//
// Limits are configurable so a test run can widen them explicitly.
// There is deliberately no NODE_ENV escape hatch: a single stray env value
// must never be able to switch brute-force protection off wholesale.
const num = (value, fallback) => {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * Buckets an authenticated caller by identity and everyone else by address.
 *
 * Keying purely on IP punishes shared egress: a corporate NAT or a mobile
 * carrier's CGNAT puts thousands of unrelated customers behind one address, so
 * one user's activity would exhaust the bucket for all of them. Once a request
 * is authenticated the account is the accurate subject.
 *
 * Anonymous traffic still falls back to the address, which is what protects the
 * credential endpoints — the limiter runs before authentication there, so a
 * brute-force attempt is always IP-bucketed.
 *
 * ipKeyGenerator normalises IPv6 to its /56 prefix; without it a single
 * allocation could rotate addresses to mint unlimited buckets.
 */
const keyGenerator = (req) => {
  const identity = req.user?.id ?? req.userId ?? req.adminId ?? req.principal?.uid
  return identity ? `u:${identity}` : `ip:${ipKeyGenerator(req.ip)}`
}

/**
 * One response shape for every limiter.
 *
 * `Retry-After` is set by express-rate-limit itself; the same figure is
 * repeated in the body so a browser client does not have to read headers.
 * Nothing about the policy, the bucket key or the caller's position in the
 * window is disclosed.
 */
const handlerFor = (policyName) => (req, res, _next, options) => {
  // Prefer the bucket's real reset time so the body agrees with the
  // Retry-After header; fall back to the window length if the store did not
  // supply one.
  const resetTime = req.rateLimit?.resetTime
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.max(1, Math.ceil(options.windowMs / 1000))

  console.warn(`⛔ Rate limit hit: ${req.method} ${req.originalUrl} (policy: ${policyName})`)

  res.status(options.statusCode).json({
    success: false,
    code: 'RATE_LIMITED',
    message: options.message.message,
    retryAfter: retryAfterSeconds
  })
}

const limiter = ({ windowMs, max, message, policyName }) => rateLimit({
  windowMs,
  max,
  message: { success: false, code: 'RATE_LIMITED', message },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  // The policy name is closed over rather than passed as an option: v8 rejects
  // unknown option keys (ERR_ERL_UNKNOWN_OPTION).
  handler: handlerFor(policyName)
})

/**
 * Global flood guard, mounted once in index.js ahead of every route.
 *
 * The per-route policies below mostly sit *after* their authentication
 * middleware, which is what allows them to bucket by account instead of by
 * address. The side effect is that a request with a missing or invalid token is
 * rejected with 401 before it ever reaches one, so those endpoints would
 * otherwise absorb unlimited traffic — cheap per request, but unbounded.
 *
 * This layer closes that hole. It is deliberately generous: it is a ceiling on
 * abuse, not a usage policy, and must never be the limit a legitimate session
 * meets first (inventory search alone allows 60/min).
 */
export const baselineLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_BASELINE_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_BASELINE_MAX, 300),
  message: 'Too many requests. Please slow down.',
  policyName: 'baseline'
})

/** Credential endpoints: login, registration, password reset, admin sign-in. */
export const authLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000),
  max: num(process.env.RATE_LIMIT_AUTH_MAX, 10),
  message: 'Too many login attempts. Please try again later.',
  policyName: 'auth'
})

/** One-time-code issuance and verification. */
export const otpLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_OTP_WINDOW_MS, 15 * 60 * 1000),
  max: num(process.env.RATE_LIMIT_OTP_MAX, 5),
  message: 'Too many verification code requests. Please try again later.',
  policyName: 'otp'
})

/** Ordinary reads: profiles, listings, dashboards, documents, admin panel. */
export const generalLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_GENERAL_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_GENERAL_MAX, 100),
  message: 'Too many requests. Please slow down.',
  policyName: 'general'
})

/** Writes that create or mutate records: bookings, payments, tickets, reviews. */
export const createLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_CREATE_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_CREATE_MAX, 30),
  message: 'Creating too many items. Please slow down.',
  policyName: 'create'
})

/** Inventory search and autocomplete — cheap per call, but heavily automated. */
export const searchLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_SEARCH_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_SEARCH_MAX, 60),
  message: 'Too many search requests. Please slow down.',
  policyName: 'search'
})

/**
 * Multipart uploads. Separate from createLimiter because the cost is bandwidth
 * and disk rather than a Firestore write: at the 10 MB cap enforced by
 * uploadMiddleware, createLimiter's 30/min would admit 300 MB per minute per
 * caller.
 */
export const uploadLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_UPLOAD_MAX, 10),
  message: 'Too many uploads. Please wait before uploading again.',
  policyName: 'upload'
})
