import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
import { getReport, getSummary } from '../controllers/reportController.js'
import { generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.use(authenticate, loadPrincipal)

// Report generation aggregates over the booking set, so it is the most
// expensive read in the platform. Bucketed per account.
router.use(generalLimiter)

// REPORT_READ_OWN is held by vendors and admins. The service narrows every
// query to the caller's own scope, and reportController additionally blocks the
// cross-account reports for non-admins.
router.get('/summary', requirePermission(Permission.REPORT_READ_OWN), getSummary)
router.get('/:kind', requirePermission(Permission.REPORT_READ_OWN), getReport)

export default router
