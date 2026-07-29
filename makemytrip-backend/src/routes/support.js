import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission, requireAdmin } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
import {
  createTicket,
  listMyTickets,
  getTicket,
  replyToTicket,
  listAllTickets,
  updateTicketStatus
} from '../controllers/supportController.js'
import {
  validateCoupon,
  listCoupons,
  upsertCoupon,
  deleteCoupon
} from '../controllers/couponController.js'

export const supportRouter = Router()
supportRouter.use(authenticate, loadPrincipal)

const anyAuthenticated = requirePermission(Permission.BOOKING_READ_OWN)

// "all" is registered before "/:id" so it is not captured as a ticket id.
supportRouter.get('/tickets/all', requireAdmin, listAllTickets)
supportRouter.post('/tickets', anyAuthenticated, createTicket)
supportRouter.get('/tickets', anyAuthenticated, listMyTickets)
supportRouter.get('/tickets/:id', anyAuthenticated, getTicket)
supportRouter.post('/tickets/:id/reply', anyAuthenticated, replyToTicket)
supportRouter.patch('/tickets/:id/status', requireAdmin, updateTicketStatus)

export const couponRouter = Router()
couponRouter.use(authenticate, loadPrincipal)

couponRouter.post('/validate', anyAuthenticated, validateCoupon)
couponRouter.get('/', requireAdmin, listCoupons)
couponRouter.post('/', requireAdmin, upsertCoupon)
couponRouter.delete('/:code', requireAdmin, deleteCoupon)
