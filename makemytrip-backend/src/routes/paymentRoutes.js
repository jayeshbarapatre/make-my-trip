import { Router } from 'express'
import { createRazorpayOrder, getQuote, verifyPayment, handleWebhook } from '../controllers/paymentController.js'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal } from '../middleware/rbac.js'
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Razorpay holds no session, so this route cannot sit behind `authenticate`.
// It must therefore be declared BEFORE the router-level auth middleware below.
// The HMAC over the raw body is what authenticates the caller; an unsigned or
// mis-signed payload is rejected before any Firestore work happens.
//
// Rate limited because it is public: a flood of unsigned bodies should cost an
// attacker more than it costs us.
router.post('/webhook', generalLimiter, handleWebhook)

// `loadPrincipal` re-reads role, account status and session validity from
// Firestore. Without it these routes trusted the token alone, so a suspended
// account — or one whose session had been revoked — could still price a trip,
// open a Razorpay order and have a booking written for it. Every other
// money-touching route already ran this check; payment did not.
router.use(authenticate, loadPrincipal)

// Applied after authenticate on each route below, so the bucket is the account
// rather than the address — a shared corporate NAT must not stop one customer
// paying because another already did.
//
// This throttles request volume only. It does not touch signature
// verification, quote redemption or booking creation.

// Authoritative pricing. The frontend renders this breakdown and passes the
// returned quoteToken to /create-order, so the amount charged is always the
// amount the server calculated from its own inventory.
router.post('/quote', createLimiter, getQuote)
router.post('/create-order', createLimiter, createRazorpayOrder)
// Verification attributes a payment (and any booking) to a user, so it must
// never run unauthenticated.
router.post('/verify', createLimiter, verifyPayment)

export default router
