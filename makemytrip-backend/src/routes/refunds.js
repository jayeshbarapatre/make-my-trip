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
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.use(authenticate, loadPrincipal)

// Reads are bucketed per account; the state-changing decision route below adds
// the tighter create policy on top.
router.use(generalLimiter)

// Customer
router.get('/preview/:bookingId', requirePermission(Permission.BOOKING_READ_OWN), previewRefund)
router.get('/mine', requirePermission(Permission.BOOKING_READ_OWN), listMyRefunds)

// Admin — registered before /:id so "all" is not swallowed as an id
router.get('/all', requireAdmin, listAllRefunds)
router.patch('/:id/:action', createLimiter, requirePermission(Permission.REFUND_APPROVE), updateRefundStatus)

router.get('/:id', requirePermission(Permission.BOOKING_READ_OWN), getRefund)

export default router
