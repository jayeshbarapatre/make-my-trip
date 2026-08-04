import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { loadPrincipal, requirePermission } from '../middleware/rbac.js'
import { Permission } from '../config/roles.js'
import {
  createReview,
  listMyReviews,
  listSubjectReviews,
  deleteReview
} from '../controllers/reviewController.js'
import {
  listWishlist,
  addToWishlist,
  removeFromWishlist
} from '../controllers/wishlistController.js'
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'

export const publicReviewRouter = Router()

// Ratings on a listing are public — no auth, no personal data in the response.
// Unauthenticated, so this one is bucketed by address.
publicReviewRouter.get('/subject/:subjectId', generalLimiter, listSubjectReviews)

export const reviewRouter = Router()
reviewRouter.use(authenticate, loadPrincipal)
// Review writes are the spam surface here; reads are not.
reviewRouter.get('/mine', generalLimiter, requirePermission(Permission.BOOKING_READ_OWN), listMyReviews)
reviewRouter.post('/', createLimiter, requirePermission(Permission.BOOKING_READ_OWN), createReview)
reviewRouter.delete('/:id', createLimiter, requirePermission(Permission.BOOKING_READ_OWN), deleteReview)

export const wishlistRouter = Router()
wishlistRouter.use(authenticate, loadPrincipal)
wishlistRouter.get('/', generalLimiter, requirePermission(Permission.BOOKING_READ_OWN), listWishlist)
wishlistRouter.post('/', createLimiter, requirePermission(Permission.BOOKING_READ_OWN), addToWishlist)
wishlistRouter.delete('/:type/:itemId', createLimiter, requirePermission(Permission.BOOKING_READ_OWN), removeFromWishlist)
