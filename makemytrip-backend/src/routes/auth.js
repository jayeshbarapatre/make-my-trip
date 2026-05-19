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
// import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js'  // DISABLED FOR TESTING

const router = Router()

// Direct standard auth endpoints
// TEMPORARILY DISABLED FOR TESTING - uncomment authLimiter when deploying to production
router.post('/signup', register)  // authLimiter disabled
router.post('/register', register)  // authLimiter disabled
router.post('/login', login)  // authLimiter disabled
router.post('/forgot-password', forgotPassword)  // otpLimiter disabled

// Dual-purpose verify-otp (handles both Forgot Password & Mobile OTP)
router.post('/verify-otp', verifyOtp)  // otpLimiter disabled
router.post('/reset-password', resetPassword)  // otpLimiter disabled
router.get('/profile', authenticate, getProfile)
router.post('/logout', authenticate, logout)

// Razorpay-style Mobile OTP Login endpoints
router.post('/send-otp', sendMobileOtp)  // otpLimiter disabled

// Admin promotion endpoint
router.post('/promote-admin', authenticate, promoteToAdmin)

export default router
