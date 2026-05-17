import { Router } from 'express'
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getProfile,
  logout,
  sendMobileOtp,
  promoteToAdmin
} from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Direct standard auth endpoints
router.post('/signup', authLimiter, register)
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/forgot-password', otpLimiter, forgotPassword)

// Dual-purpose verify-otp (handles both Forgot Password & Mobile OTP)
router.post('/verify-otp', otpLimiter, verifyOtp)
router.post('/reset-password', otpLimiter, resetPassword)
router.get('/profile', authenticate, getProfile)
router.post('/logout', authenticate, logout)

// Razorpay-style Mobile OTP Login endpoints
router.post('/send-otp', otpLimiter, sendMobileOtp)

// Admin promotion endpoint
router.post('/promote-admin', authenticate, promoteToAdmin)

export default router
