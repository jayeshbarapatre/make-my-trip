import rateLimit from 'express-rate-limit'

// Limits are configurable so a test run can widen them explicitly.
// There is deliberately no NODE_ENV escape hatch: a single stray env value
// must never be able to switch brute-force protection off wholesale.
const num = (value, fallback) => {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const limiter = ({ windowMs, max, message }) => rateLimit({
  windowMs,
  max,
  message: { success: false, code: 'RATE_LIMITED', message },
  standardHeaders: true,
  legacyHeaders: false
})

export const authLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000),
  max: num(process.env.RATE_LIMIT_AUTH_MAX, 5),
  message: 'Too many login attempts. Please try again later.'
})

export const otpLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_OTP_WINDOW_MS, 15 * 60 * 1000),
  max: num(process.env.RATE_LIMIT_OTP_MAX, 5),
  message: 'Too many verification code requests. Please try again later.'
})

export const generalLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_GENERAL_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_GENERAL_MAX, 100),
  message: 'Too many requests. Please slow down.'
})

export const createLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_CREATE_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_CREATE_MAX, 30),
  message: 'Creating too many items. Please slow down.'
})

export const searchLimiter = limiter({
  windowMs: num(process.env.RATE_LIMIT_SEARCH_WINDOW_MS, 60 * 1000),
  max: num(process.env.RATE_LIMIT_SEARCH_MAX, 60),
  message: 'Too many search requests. Please slow down.'
})
