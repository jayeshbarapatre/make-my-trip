import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
import { getTicket, getInvoice, getRefundReceipt } from '../controllers/documentController.js'
import { generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Documents carry names, itineraries and amounts, so they are never public —
// ownership is checked inside each handler against the stored record.
router.use(authenticate, loadPrincipal)

// Each request renders a PDF, which is CPU-bound. Applied after loadPrincipal
// so the bucket is the account.
router.use(generalLimiter)

const canReadOwn = requirePermission(Permission.BOOKING_READ_OWN)

router.get('/bookings/:id/ticket', canReadOwn, getTicket)
router.get('/bookings/:id/invoice', canReadOwn, getInvoice)
router.get('/refunds/:id/receipt', canReadOwn, getRefundReceipt)

export default router
