import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/firebaseUserController.js'
import { getUserBookings } from '../controllers/firebaseBookingController.js'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal } from '../middleware/rbac.js'
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Account status and session validity are re-read from Firestore rather than
// trusted from the token, matching every other authenticated router. Without
// this a suspended account could still read and edit its profile.
router.use(authenticate, loadPrincipal)

// Limiters run after authenticate so the bucket is the account, not the address.
router.get('/profile', generalLimiter, getProfile)
router.put('/update', createLimiter, updateProfile)
router.get('/bookings', generalLimiter, getUserBookings)

export default router
