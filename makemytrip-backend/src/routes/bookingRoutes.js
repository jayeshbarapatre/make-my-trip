import { Router } from 'express'
import { createBooking, getUserBookings, getBooking, cancelBooking, checkHotelOverlap, getHotelBlockedDates } from '../controllers/bookingController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Standard new endpoints
router.get('/hotel/:hotelName/blocked-dates', getHotelBlockedDates)
router.post('/check-overlap', checkHotelOverlap)
router.post('/create', authenticate, createBooking)
router.get('/user/:userId', authenticate, getUserBookings)
router.get('/:id', authenticate, getBooking)
router.put('/cancel/:id', authenticate, cancelBooking)

// Fallback legacy endpoints
router.post('/', authenticate, createBooking)
router.delete('/:id', authenticate, cancelBooking)

export default router
