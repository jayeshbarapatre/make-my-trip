import { Router } from 'express'
import { createBooking, getUserBookings, getBooking, cancelBooking, checkHotelOverlap } from '../controllers/bookingController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/check-overlap', checkHotelOverlap)
router.post('/create', authenticate, createBooking)
router.get('/user/:userId', authenticate, getUserBookings)
router.get('/:id', authenticate, getBooking)
router.put('/cancel/:id', authenticate, cancelBooking)

// Type-specific booking endpoints
router.post('/flights', authenticate, createBooking)
router.post('/hotels', authenticate, createBooking)
router.post('/buses', authenticate, createBooking)
router.post('/trains', authenticate, createBooking)
router.post('/cabs', authenticate, createBooking)

// Generic endpoints
router.post('/', authenticate, createBooking)
router.delete('/:id', authenticate, cancelBooking)

export default router
