import express from 'express'
import { vendorRegister, vendorLogin, getVendorProfile, vendorLogout, changePassword } from '../controllers/vendorAuthController.js'
import {
  getMyHotels, createHotel, getMyHotelById, updateHotel, deleteHotel, submitForApproval, toggleHotelStatus
} from '../controllers/vendorHotelController.js'
import {
  getRoomsByHotel, createRoom, updateRoom, deleteRoom, toggleRoomStatus
} from '../controllers/vendorRoomController.js'
import {
  getMyFlights, createFlight, getMyFlightById, updateFlight, deleteFlight, submitForApproval as submitFlightForApproval, toggleFlightStatus
} from '../controllers/vendorFlightController.js'
import { authenticateVendor, vendorOnly } from '../middleware/vendorAuth.js'

const router = express.Router()

router.post('/register', vendorRegister)
router.post('/login', vendorLogin)
router.get('/profile', authenticateVendor, getVendorProfile)
router.post('/logout', authenticateVendor, vendorLogout)
router.put('/change-password', authenticateVendor, changePassword)

router.post('/hotels', authenticateVendor, vendorOnly, createHotel)
router.get('/hotels', authenticateVendor, vendorOnly, getMyHotels)
router.get('/hotels/:id', authenticateVendor, vendorOnly, getMyHotelById)
router.put('/hotels/:id', authenticateVendor, vendorOnly, updateHotel)
router.delete('/hotels/:id', authenticateVendor, vendorOnly, deleteHotel)
router.patch('/hotels/:id/submit', authenticateVendor, vendorOnly, submitForApproval)
router.patch('/hotels/:id/toggle', authenticateVendor, vendorOnly, toggleHotelStatus)

router.get('/hotels/:hotelId/rooms', authenticateVendor, vendorOnly, getRoomsByHotel)
router.post('/hotels/:hotelId/rooms', authenticateVendor, vendorOnly, createRoom)
router.put('/hotels/:hotelId/rooms/:roomId', authenticateVendor, vendorOnly, updateRoom)
router.delete('/hotels/:hotelId/rooms/:roomId', authenticateVendor, vendorOnly, deleteRoom)
router.patch('/hotels/:hotelId/rooms/:roomId/toggle', authenticateVendor, vendorOnly, toggleRoomStatus)

router.post('/flights', authenticateVendor, vendorOnly, createFlight)
router.get('/flights', authenticateVendor, vendorOnly, getMyFlights)
router.get('/flights/:id', authenticateVendor, vendorOnly, getMyFlightById)
router.put('/flights/:id', authenticateVendor, vendorOnly, updateFlight)
router.delete('/flights/:id', authenticateVendor, vendorOnly, deleteFlight)
router.patch('/flights/:id/submit', authenticateVendor, vendorOnly, submitFlightForApproval)
router.patch('/flights/:id/toggle', authenticateVendor, vendorOnly, toggleFlightStatus)

export default router
