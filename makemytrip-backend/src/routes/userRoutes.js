import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/userController.js'
import { getUserBookings } from '../controllers/bookingController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/profile', authenticate, getProfile)
router.put('/update', authenticate, updateProfile)
router.get('/bookings', authenticate, getUserBookings)

export default router
