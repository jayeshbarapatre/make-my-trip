import express from 'express'
import { adminRegister, adminLogin, getAdminProfile, adminLogout, changePassword } from '../controllers/adminAuthController.js'
import {
  createFlight, getAllFlights, getFlightById, updateFlight, deleteFlight, toggleFlightStatus
} from '../controllers/flightAdminController.js'
import {
  createHotel, getAllHotels, getHotelById, updateHotel, deleteHotel, toggleHotelStatus, updateHotelImages, getHotelImages
} from '../controllers/hotelAdminController.js'
import {
  createBus, getAllBuses, getBusById, updateBus, deleteBus, toggleBusStatus
} from '../controllers/busAdminController.js'
import {
  createCab, getAllCabs, getCabById, updateCab, deleteCab, toggleCabStatus
} from '../controllers/cabAdminController.js'
import {
  getDashboardStats, getRevenueData, getRecentBookings, getAvailabilityStats
} from '../controllers/dashboardController.js'
import { authenticateAdmin, adminOnly } from '../middleware/adminAuth.js'
import { getPendingHotels, approveHotel, rejectHotel } from '../controllers/adminHotelApprovalController.js'
import { getAllVendors, createVendor, deleteVendor, toggleVendorStatus, getVendorHotels } from '../controllers/adminVendorController.js'

const router = express.Router()

router.post('/register', adminRegister)
router.post('/login', adminLogin)
router.get('/profile', authenticateAdmin, getAdminProfile)
router.post('/logout', authenticateAdmin, adminLogout)
router.put('/change-password', authenticateAdmin, changePassword)

router.get('/dashboard/stats', authenticateAdmin, adminOnly, getDashboardStats)
router.get('/dashboard/revenue', authenticateAdmin, adminOnly, getRevenueData)
router.get('/dashboard/recent-bookings', authenticateAdmin, adminOnly, getRecentBookings)
router.get('/dashboard/availability', authenticateAdmin, adminOnly, getAvailabilityStats)

router.post('/flights', authenticateAdmin, adminOnly, createFlight)
router.get('/flights', authenticateAdmin, adminOnly, getAllFlights)
router.get('/flights/:id', authenticateAdmin, adminOnly, getFlightById)
router.put('/flights/:id', authenticateAdmin, adminOnly, updateFlight)
router.delete('/flights/:id', authenticateAdmin, adminOnly, deleteFlight)
router.patch('/flights/:id/toggle', authenticateAdmin, adminOnly, toggleFlightStatus)

router.post('/hotels', authenticateAdmin, adminOnly, createHotel)
router.get('/hotels', authenticateAdmin, adminOnly, getAllHotels)
router.get('/hotels/:id', authenticateAdmin, adminOnly, getHotelById)
router.put('/hotels/:id', authenticateAdmin, adminOnly, updateHotel)
router.delete('/hotels/:id', authenticateAdmin, adminOnly, deleteHotel)
router.patch('/hotels/:id/toggle', authenticateAdmin, adminOnly, toggleHotelStatus)
router.put('/hotels/:id/images', authenticateAdmin, adminOnly, updateHotelImages)
router.get('/hotels/:id/images', getHotelImages)

router.post('/buses', authenticateAdmin, adminOnly, createBus)
router.get('/buses', authenticateAdmin, adminOnly, getAllBuses)
router.get('/buses/:id', authenticateAdmin, adminOnly, getBusById)
router.put('/buses/:id', authenticateAdmin, adminOnly, updateBus)
router.delete('/buses/:id', authenticateAdmin, adminOnly, deleteBus)
router.patch('/buses/:id/toggle', authenticateAdmin, adminOnly, toggleBusStatus)

router.post('/cabs', authenticateAdmin, adminOnly, createCab)
router.get('/cabs', authenticateAdmin, adminOnly, getAllCabs)
router.get('/cabs/:id', authenticateAdmin, adminOnly, getCabById)
router.put('/cabs/:id', authenticateAdmin, adminOnly, updateCab)
router.delete('/cabs/:id', authenticateAdmin, adminOnly, deleteCab)
router.patch('/cabs/:id/toggle', authenticateAdmin, adminOnly, toggleCabStatus)

router.get('/approvals/hotels', authenticateAdmin, adminOnly, getPendingHotels)
router.patch('/approvals/hotels/:id/approve', authenticateAdmin, adminOnly, approveHotel)
router.patch('/approvals/hotels/:id/reject', authenticateAdmin, adminOnly, rejectHotel)

router.get('/vendors', authenticateAdmin, adminOnly, getAllVendors)
router.post('/vendors', authenticateAdmin, adminOnly, createVendor)
router.get('/vendors/:id/hotels', authenticateAdmin, adminOnly, getVendorHotels)
router.delete('/vendors/:id', authenticateAdmin, adminOnly, deleteVendor)
router.patch('/vendors/:id/toggle', authenticateAdmin, adminOnly, toggleVendorStatus)

export default router
