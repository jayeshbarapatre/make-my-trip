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
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'

export const supportRouter = Router()
supportRouter.use(authenticate, loadPrincipal)
supportRouter.use(generalLimiter)

const anyAuthenticated = requirePermission(Permission.BOOKING_READ_OWN)

// "all" is registered before "/:id" so it is not captured as a ticket id.
supportRouter.get('/tickets/all', requireAdmin, listAllTickets)
supportRouter.post('/tickets', createLimiter, anyAuthenticated, createTicket)
supportRouter.get('/tickets', anyAuthenticated, listMyTickets)
supportRouter.get('/tickets/:id', anyAuthenticated, getTicket)
supportRouter.post('/tickets/:id/reply', createLimiter, anyAuthenticated, replyToTicket)
supportRouter.patch('/tickets/:id/status', createLimiter, requireAdmin, updateTicketStatus)

export const couponRouter = Router()
couponRouter.use(authenticate, loadPrincipal)
couponRouter.use(generalLimiter)

// Coupon validation is an oracle: unthrottled, it lets a signed-in caller
// enumerate unlisted promo codes by brute force. Held to the create policy
// even though it writes nothing.
couponRouter.post('/validate', createLimiter, anyAuthenticated, validateCoupon)
couponRouter.get('/', requireAdmin, listCoupons)
couponRouter.post('/', createLimiter, requireAdmin, upsertCoupon)
couponRouter.delete('/:code', createLimiter, requireAdmin, deleteCoupon)
