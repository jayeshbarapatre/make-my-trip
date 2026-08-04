import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal } from '../middleware/rbac.js'
import { authLimiter, otpLimiter, generalLimiter } from '../middleware/rateLimiter.js'
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
  firebaseRefresh,
  firebaseListSessions,
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

// Not credential operations, so they take the general policy rather than the
// auth one. otp-status is unauthenticated and therefore bucketed by address;
// the other two run after authenticate and are bucketed by account.
router.get('/otp-status', generalLimiter, otpChannelStatus)

// `loadPrincipal` is what enforces revocation, so these must run it.
// /profile especially: the frontend restores a session by calling it on page
// load, so without the check a logged-out user who refreshed the page was
// presented as signed in again for the remaining life of the token.
router.get('/profile', authenticate, loadPrincipal, generalLimiter, firebaseGetProfile)
router.get('/sessions', authenticate, loadPrincipal, generalLimiter, firebaseListSessions)

// Logout deliberately does NOT run loadPrincipal: a suspended or already
// half-revoked account must still be able to end its own session rather than
// be refused and leave the session alive.
router.post('/logout', authenticate, generalLimiter, firebaseLogout)

// Unauthenticated by design: it is called precisely when the access token has
// expired. The refresh token is the credential, so it takes the auth limiter.
router.post('/refresh', authLimiter, firebaseRefresh)

export default router
