import { Router } from 'express'
import { createBooking, getUserBookings, getBooking, cancelBooking, checkHotelOverlap, getHotelBlockedDates } from '../controllers/bookingController.js'
import { authenticate } from '../middleware/auth.js'
import bookingService from '../services/bookingService.js'

const router = Router()

// Standard new endpoints
router.get('/hotel/:hotelName/blocked-dates', getHotelBlockedDates)
router.post('/check-overlap', checkHotelOverlap)
router.post('/create', authenticate, createBooking)
router.get('/user/:userId', authenticate, getUserBookings)
router.get('/:id', authenticate, getBooking)
router.put('/cancel/:id', authenticate, cancelBooking)

// OTA Flight booking endpoints
router.post('/flight', authenticate, async (req, res) => {
  try {
    const { flightId, passengers, fareClass, totalAmount, travellers } = req.body
    const result = await bookingService.createFlightBooking({
      userId: req.userId,
      flightId,
      passengers,
      fareClass,
      totalAmount,
      travellers
    })
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// OTA Train booking endpoints
router.post('/train', authenticate, async (req, res) => {
  try {
    const { trainId, passengers, class: fareClass, quota, totalAmount, travellers } = req.body
    const result = await bookingService.createTrainBooking({
      userId: req.userId,
      trainId,
      passengers,
      class: fareClass,
      quota,
      totalAmount,
      travellers
    })
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// Check PNR status
router.get('/pnr-status/:pnr', authenticate, async (req, res) => {
  try {
    const booking = await bookingService.getBookingByPNR(req.params.pnr)
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }
    res.json({ success: true, data: booking })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// Fallback legacy endpoints
router.post('/', authenticate, createBooking)
router.delete('/:id', authenticate, cancelBooking)

export default router
