import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission, requireAdmin } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
import {
  previewRefund,
  listMyRefunds,
  getRefund,
  listAllRefunds,
  updateRefundStatus
} from '../controllers/refundController.js'

const router = Router()

router.use(authenticate, loadPrincipal)

// Customer
router.get('/preview/:bookingId', requirePermission(Permission.BOOKING_READ_OWN), previewRefund)
router.get('/mine', requirePermission(Permission.BOOKING_READ_OWN), listMyRefunds)

// Admin — registered before /:id so "all" is not swallowed as an id
router.get('/all', requireAdmin, listAllRefunds)
router.patch('/:id/:action', requirePermission(Permission.REFUND_APPROVE), updateRefundStatus)

router.get('/:id', requirePermission(Permission.BOOKING_READ_OWN), getRefund)

export default router
