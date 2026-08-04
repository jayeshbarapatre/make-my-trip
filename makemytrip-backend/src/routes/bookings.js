import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'
import {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking
} from '../controllers/firebaseBookingController.js'

const router = Router()

// Every booking route resolves the caller's live role and account status before
// the handler runs, so a suspended account cannot act on a still-valid token.
router.use(authenticate, loadPrincipal)

const canCreate = requirePermission(Permission.BOOKING_CREATE)
const canReadOwn = requirePermission(Permission.BOOKING_READ_OWN)
const canCancelOwn = requirePermission(Permission.BOOKING_CANCEL_OWN)

// Limiters sit after loadPrincipal, so every bucket here is keyed on the
// account rather than the address. Writes get the tighter create policy;
// reads get the general one.
router.post('/create', createLimiter, canCreate, createBooking)
router.get('/user/:userId', generalLimiter, canReadOwn, getUserBookings)
router.get('/:id', generalLimiter, canReadOwn, getBooking)
router.put('/cancel/:id', createLimiter, canCancelOwn, cancelBooking)

// Type-specific booking endpoints
router.post('/flights', createLimiter, canCreate, createBooking)
router.post('/hotels', createLimiter, canCreate, createBooking)
router.post('/buses', createLimiter, canCreate, createBooking)
router.post('/trains', createLimiter, canCreate, createBooking)
router.post('/cabs', createLimiter, canCreate, createBooking)

// Generic endpoints
router.post('/', createLimiter, canCreate, createBooking)
router.delete('/:id', createLimiter, canCancelOwn, cancelBooking)

export default router
