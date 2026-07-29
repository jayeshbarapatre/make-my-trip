import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
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

router.post('/create', canCreate, createBooking)
router.get('/user/:userId', canReadOwn, getUserBookings)
router.get('/:id', canReadOwn, getBooking)
router.put('/cancel/:id', canCancelOwn, cancelBooking)

// Type-specific booking endpoints
router.post('/flights', canCreate, createBooking)
router.post('/hotels', canCreate, createBooking)
router.post('/buses', canCreate, createBooking)
router.post('/trains', canCreate, createBooking)
router.post('/cabs', canCreate, createBooking)

// Generic endpoints
router.post('/', canCreate, createBooking)
router.delete('/:id', canCancelOwn, cancelBooking)

export default router
