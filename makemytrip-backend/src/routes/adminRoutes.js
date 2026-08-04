import express from 'express'
import { upload } from '../middleware/uploadMiddleware.js'
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
  createTrain, getAllTraines, getTrainById as getAdminTrainById, updateTrain, deleteTrain, toggleTrainStatus
} from '../controllers/trainAdminController.js'
import {
  getDashboardStats, getRevenueData, getRecentBookings, getAvailabilityStats
} from '../controllers/dashboardController.js'
import { authenticateAdmin, adminOnly } from '../middleware/adminAuth.js'
import { requireRole } from '../middleware/rbac.js'
import { Role } from '../config/roles.js'
import { authLimiter, generalLimiter, uploadLimiter } from '../middleware/rateLimiter.js'
import { getPendingHotels, approveHotel, rejectHotel } from '../controllers/adminHotelApprovalController.js'
import { getPendingBuses, approveBus, rejectBus } from '../controllers/adminBusApprovalController.js'
import { getPendingCabs, approveCab, rejectCab } from '../controllers/adminCabApprovalController.js'
import { getAllVendors, createVendor, deleteVendor, toggleVendorStatus, getVendorHotels } from '../controllers/adminVendorController.js'
import { getAllBookings } from '../controllers/firebaseBookingController.js'
import { getAllUsers, deleteUser, getUserDetails } from '../controllers/adminUserController.js'
import { getApiHealth, flushCache } from '../controllers/apiHealthController.js'
import {
  listCmsPages, createCmsPage, updateCmsPage, deleteCmsPage, getPageBySlug
} from '../controllers/cmsController.js'
import {
  getFooter, listSections, createSection, updateSection, deleteSection,
  createLink, updateLink, deleteLink
} from '../controllers/footerController.js'
import {
  submitInquiry, listInquiries, getInquiry, updateInquiryStatus, deleteInquiry
} from '../controllers/contactController.js'
import {
  getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification
} from '../controllers/notificationController.js'
import {
  listJobs, getJob, applyJob, listAllJobs, createJob, updateJob, deleteJob,
  listApplications, updateApplicationStatus
} from '../controllers/careersController.js'
import {
  listFaqs, listAllFaqs, createFaq, updateFaq, deleteFaq
} from '../controllers/faqController.js'
import {
  getSettings, updateSettings
} from '../controllers/settingsController.js'
import {
  uploadMedia, listMedia, getMediaById, deleteMedia
} from '../controllers/mediaController.js'
import {
  listTemplates, getTemplate, createTemplate, updateTemplate, toggleTemplate, deleteTemplate, previewTemplate
} from '../controllers/emailTemplateAdminController.js'
import {
  listLogs, getLog, resendLog, getStats, cleanupOldLogs
} from '../controllers/emailLogAdminController.js'

const router = express.Router()

// Admin creation is an escalation path, not a signup form: only an
// authenticated super admin may reach it. The first admin is bootstrapped
// server-side via `npm run admin:create`.
// Credential operations carry the auth policy: creating an admin and changing a
// password are as sensitive as signing in.
router.post('/register', authLimiter, authenticateAdmin, requireRole(Role.SUPER_ADMIN), adminRegister)
router.post('/login', authLimiter, adminLogin)
router.get('/profile', authenticateAdmin, getAdminProfile)
router.post('/logout', authenticateAdmin, adminLogout)
router.put('/change-password', authLimiter, authenticateAdmin, changePassword)

// Everything below inherits the general policy. Registered here rather than at
// the top of the file so the credential routes above keep the auth policy alone
// and are not also consuming a general-purpose budget.
router.use(generalLimiter)

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

router.post('/trains', authenticateAdmin, adminOnly, createTrain)
router.get('/trains', authenticateAdmin, adminOnly, getAllTraines)
router.get('/trains/:id', authenticateAdmin, adminOnly, getAdminTrainById)
router.put('/trains/:id', authenticateAdmin, adminOnly, updateTrain)
router.delete('/trains/:id', authenticateAdmin, adminOnly, deleteTrain)
router.patch('/trains/:id/toggle', authenticateAdmin, adminOnly, toggleTrainStatus)

router.get('/approvals/hotels', authenticateAdmin, adminOnly, getPendingHotels)
router.patch('/approvals/hotels/:id/approve', authenticateAdmin, adminOnly, approveHotel)
router.patch('/approvals/hotels/:id/reject', authenticateAdmin, adminOnly, rejectHotel)

router.get('/approvals/buses', authenticateAdmin, adminOnly, getPendingBuses)
router.patch('/approvals/buses/:id/approve', authenticateAdmin, adminOnly, approveBus)
router.patch('/approvals/buses/:id/reject', authenticateAdmin, adminOnly, rejectBus)

router.get('/approvals/cabs', authenticateAdmin, adminOnly, getPendingCabs)
router.patch('/approvals/cabs/:id/approve', authenticateAdmin, adminOnly, approveCab)
router.patch('/approvals/cabs/:id/reject', authenticateAdmin, adminOnly, rejectCab)

router.get('/vendors', authenticateAdmin, adminOnly, getAllVendors)
router.post('/vendors', authenticateAdmin, adminOnly, createVendor)
router.get('/vendors/:id/hotels', authenticateAdmin, adminOnly, getVendorHotels)
router.delete('/vendors/:id', authenticateAdmin, adminOnly, deleteVendor)
router.patch('/vendors/:id/toggle', authenticateAdmin, adminOnly, toggleVendorStatus)

router.get('/bookings', authenticateAdmin, adminOnly, getAllBookings)

router.get('/users', authenticateAdmin, adminOnly, getAllUsers)
router.get('/users/:id', authenticateAdmin, adminOnly, getUserDetails)
router.delete('/users/:id', authenticateAdmin, adminOnly, deleteUser)

router.get('/api-health', authenticateAdmin, adminOnly, getApiHealth)
router.post('/cache/flush', authenticateAdmin, adminOnly, flushCache)

// CMS Routes
router.get('/cms', authenticateAdmin, adminOnly, listCmsPages)
router.post('/cms', authenticateAdmin, adminOnly, createCmsPage)
router.put('/cms/:id', authenticateAdmin, adminOnly, updateCmsPage)
router.delete('/cms/:id', authenticateAdmin, adminOnly, deleteCmsPage)

// Footer Routes
router.get('/footer/sections', authenticateAdmin, adminOnly, listSections)
router.post('/footer/sections', authenticateAdmin, adminOnly, createSection)
router.put('/footer/sections/:id', authenticateAdmin, adminOnly, updateSection)
router.delete('/footer/sections/:id', authenticateAdmin, adminOnly, deleteSection)
router.post('/footer/links', authenticateAdmin, adminOnly, createLink)
router.put('/footer/links/:id', authenticateAdmin, adminOnly, updateLink)
router.delete('/footer/links/:id', authenticateAdmin, adminOnly, deleteLink)

// Contact Inquiry Routes
router.get('/inquiries', authenticateAdmin, adminOnly, listInquiries)
router.get('/inquiries/:id', authenticateAdmin, adminOnly, getInquiry)
router.patch('/inquiries/:id/status', authenticateAdmin, adminOnly, updateInquiryStatus)
router.delete('/inquiries/:id', authenticateAdmin, adminOnly, deleteInquiry)

// Notification Routes
router.get('/notifications', authenticateAdmin, adminOnly, getNotifications)
router.get('/notifications/unread-count', authenticateAdmin, adminOnly, getUnreadCount)
router.patch('/notifications/:id/read', authenticateAdmin, adminOnly, markAsRead)
router.patch('/notifications/mark-all-read', authenticateAdmin, adminOnly, markAllAsRead)
router.delete('/notifications/:id', authenticateAdmin, adminOnly, deleteNotification)

// Career Routes
router.get('/jobs', authenticateAdmin, adminOnly, listAllJobs)
router.post('/jobs', authenticateAdmin, adminOnly, createJob)
router.put('/jobs/:id', authenticateAdmin, adminOnly, updateJob)
router.delete('/jobs/:id', authenticateAdmin, adminOnly, deleteJob)
router.get('/jobs/:jobId/applications', authenticateAdmin, adminOnly, listApplications)
router.patch('/applications/:id/status', authenticateAdmin, adminOnly, updateApplicationStatus)

// FAQ Routes
router.get('/faqs', authenticateAdmin, adminOnly, listAllFaqs)
router.post('/faqs', authenticateAdmin, adminOnly, createFaq)
router.put('/faqs/:id', authenticateAdmin, adminOnly, updateFaq)
router.delete('/faqs/:id', authenticateAdmin, adminOnly, deleteFaq)

// Settings Routes
router.get('/settings', authenticateAdmin, adminOnly, getSettings)
router.put('/settings', authenticateAdmin, adminOnly, updateSettings)

// Media Routes
// uploadLimiter runs before multer so a flood is rejected before 10 MB of body
// is streamed to disk.
router.post('/media/upload', uploadLimiter, authenticateAdmin, adminOnly, upload.single('file'), uploadMedia)
router.get('/media', authenticateAdmin, adminOnly, listMedia)
router.get('/media/:id', authenticateAdmin, adminOnly, getMediaById)
router.delete('/media/:id', authenticateAdmin, adminOnly, deleteMedia)

// Email Template Routes
router.get('/email-templates', authenticateAdmin, adminOnly, listTemplates)
router.get('/email-templates/:key', authenticateAdmin, adminOnly, getTemplate)
router.post('/email-templates', authenticateAdmin, adminOnly, createTemplate)
router.put('/email-templates/:key', authenticateAdmin, adminOnly, updateTemplate)
router.patch('/email-templates/:key/toggle', authenticateAdmin, adminOnly, toggleTemplate)
router.delete('/email-templates/:key', authenticateAdmin, adminOnly, deleteTemplate)
router.post('/email-templates/:key/preview', authenticateAdmin, adminOnly, previewTemplate)

// Email Log Routes
router.get('/email-logs', authenticateAdmin, adminOnly, listLogs)
router.get('/email-logs/stats', authenticateAdmin, adminOnly, getStats)
router.get('/email-logs/:id', authenticateAdmin, adminOnly, getLog)
router.post('/email-logs/:id/resend', authenticateAdmin, adminOnly, resendLog)
router.delete('/email-logs/cleanup', authenticateAdmin, adminOnly, cleanupOldLogs)

export default router
