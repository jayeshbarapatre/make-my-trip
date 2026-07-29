import { Router } from 'express'
import { createRazorpayOrder, verifyPayment } from '../controllers/paymentController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/create-order', authenticate, createRazorpayOrder)
// Verification attributes a payment (and any booking) to a user, so it must
// never run unauthenticated.
router.post('/verify', authenticate, verifyPayment)

export default router
