import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

export const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Creating too many items, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many search requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
})
