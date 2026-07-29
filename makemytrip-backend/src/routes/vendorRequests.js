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

const router = Router()

router.use(authenticate, loadPrincipal)

// Any signed-in customer may apply.
router.post('/apply', requirePermission(Permission.BOOKING_READ_OWN), applyAsVendor)
router.get('/mine', requirePermission(Permission.BOOKING_READ_OWN), getMyVendorRequest)

router.get('/', requireAdmin, listVendorRequests)
router.patch('/:id/:decision', requirePermission(Permission.VENDOR_APPROVE), decideVendorRequest)

export default router
