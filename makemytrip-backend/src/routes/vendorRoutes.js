import express from 'express'
import { vendorRegister, vendorLogin, getVendorProfile, vendorLogout, changePassword } from '../controllers/vendorAuthController.js'
import {
  getMyHotels, createHotel, getMyHotelById, updateHotel, deleteHotel, submitForApproval, toggleHotelStatus
} from '../controllers/vendorHotelController.js'
import {
  getRoomsByHotel, createRoom, updateRoom, deleteRoom, toggleRoomStatus
} from '../controllers/vendorRoomController.js'
import {
  getMyBuses, createBus, updateBus, deleteBus, submitBusForApproval
} from '../controllers/vendorBusController.js'
import {
  getMyCabs, createCab, getMyCabById, updateCab, deleteCab, submitCabForApproval,
  toggleCabStatus, getCabStats
} from '../controllers/vendorCabController.js'
import {
  listDrivers, createDriver, updateDriver, deleteDriver
} from '../controllers/vendorDriverController.js'
import { authenticateVendor, vendorOnly } from '../middleware/vendorAuth.js'
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Vendor sign-up and sign-in are unauthenticated credential endpoints, so they
// take the auth policy and are bucketed by address.
router.post('/register', authLimiter, vendorRegister)
router.post('/login', authLimiter, vendorLogin)
router.get('/profile', authenticateVendor, getVendorProfile)
router.post('/logout', authenticateVendor, vendorLogout)
router.put('/change-password', authLimiter, authenticateVendor, changePassword)

// All vendor inventory management below inherits the general policy.
router.use(generalLimiter)

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


router.post('/buses', authenticateVendor, vendorOnly, createBus)
router.get('/buses', authenticateVendor, vendorOnly, getMyBuses)
router.put('/buses/:id', authenticateVendor, vendorOnly, updateBus)
router.delete('/buses/:id', authenticateVendor, vendorOnly, deleteBus)
router.patch('/buses/:id/submit', authenticateVendor, vendorOnly, submitBusForApproval)

// The driver roster is mounted before /cabs/:id so "drivers" is never captured
// as a cab id.
router.get('/cab-drivers', authenticateVendor, vendorOnly, listDrivers)
router.post('/cab-drivers', authenticateVendor, vendorOnly, createDriver)
router.put('/cab-drivers/:id', authenticateVendor, vendorOnly, updateDriver)
router.delete('/cab-drivers/:id', authenticateVendor, vendorOnly, deleteDriver)

router.get('/cabs/stats', authenticateVendor, vendorOnly, getCabStats)
router.post('/cabs', authenticateVendor, vendorOnly, createCab)
router.get('/cabs', authenticateVendor, vendorOnly, getMyCabs)
router.get('/cabs/:id', authenticateVendor, vendorOnly, getMyCabById)
router.put('/cabs/:id', authenticateVendor, vendorOnly, updateCab)
router.delete('/cabs/:id', authenticateVendor, vendorOnly, deleteCab)
router.patch('/cabs/:id/submit', authenticateVendor, vendorOnly, submitCabForApproval)
router.patch('/cabs/:id/toggle', authenticateVendor, vendorOnly, toggleCabStatus)


export default router
