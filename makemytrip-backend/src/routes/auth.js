import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js'
import {
  firebaseRegister,
  firebaseLogin,
  firebaseGetProfile,
  firebaseLogout,
  firebaseForgotPassword,
  firebaseResetPassword,
  firebaseVerifyOtp,
  firebaseSendMobileOtp,
  firebaseSendEmailOtp,
  otpChannelStatus
} from '../controllers/firebaseAuthController.js'

const router = Router()

router.post('/signup', authLimiter, firebaseRegister)
router.post('/register', authLimiter, firebaseRegister)
router.post('/login', authLimiter, firebaseLogin)

// Password reset
router.post('/forgot-password', otpLimiter, firebaseForgotPassword)
router.post('/reset-password', authLimiter, firebaseResetPassword)

// OTP delivery — mobile and email. Resend reuses the send handler; the
// per-number cooldown lives in otpService, not in a separate endpoint.
router.post('/send-otp', otpLimiter, firebaseSendMobileOtp)
router.post('/resend-otp', otpLimiter, firebaseSendMobileOtp)
router.post('/send-email-otp', otpLimiter, firebaseSendEmailOtp)
router.post('/resend-email-otp', otpLimiter, firebaseSendEmailOtp)

// Verification (mobile OTP, email OTP, and password-reset pre-check)
router.post('/verify-otp', otpLimiter, firebaseVerifyOtp)

router.get('/otp-status', otpChannelStatus)
router.get('/profile', authenticate, firebaseGetProfile)
router.post('/logout', authenticate, firebaseLogout)

export default router
