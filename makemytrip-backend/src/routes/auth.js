import { Router } from 'express'
import {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getProfile,
  logout,
  sendMobileOtp
} from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Direct standard auth endpoints
router.post('/signup', register)
router.post('/register', register) 
router.post('/login', login)
router.post('/forgot-password', forgotPassword)

// Dual-purpose verify-otp (handles both Forgot Password & Mobile OTP)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)
router.get('/profile', authenticate, getProfile)
router.post('/logout', logout)

// Razorpay-style Mobile OTP Login endpoints
router.post('/send-otp', sendMobileOtp)

export default router
