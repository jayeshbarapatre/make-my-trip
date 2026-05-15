import { Router } from 'express'
import { createBooking, getUserBookings, getBooking, cancelBooking } from '../controllers/bookingController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/create', authenticate, createBooking)
router.get('/user/:userId', authenticate, getUserBookings)
router.get('/:id', authenticate, getBooking)
router.put('/cancel/:id', authenticate, cancelBooking)

router.post('/', authenticate, createBooking)
router.delete('/:id', authenticate, cancelBooking)

export default router
