import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission, requireAdmin } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
import {
  applyAsVendor,
  getMyVendorRequest,
  listVendorRequests,
  decideVendorRequest
} from '../controllers/vendorRequestController.js'
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.use(authenticate, loadPrincipal)
router.use(generalLimiter)

// Any signed-in customer may apply. Applications and decisions are writes, so
// they carry the tighter create policy on top of the general one.
router.post('/apply', createLimiter, requirePermission(Permission.BOOKING_READ_OWN), applyAsVendor)
router.get('/mine', requirePermission(Permission.BOOKING_READ_OWN), getMyVendorRequest)

router.get('/', requireAdmin, listVendorRequests)
router.patch('/:id/:decision', createLimiter, requirePermission(Permission.VENDOR_APPROVE), decideVendorRequest)

export default router
