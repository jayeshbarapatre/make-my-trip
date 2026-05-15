import { Router } from 'express'
import { createRazorpayOrder } from '../controllers/paymentController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/create-order', authenticate, createRazorpayOrder)

export default router
