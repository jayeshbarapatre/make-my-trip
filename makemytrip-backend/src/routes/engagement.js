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

export const publicReviewRouter = Router()

// Ratings on a listing are public — no auth, no personal data in the response.
publicReviewRouter.get('/subject/:subjectId', listSubjectReviews)

export const reviewRouter = Router()
reviewRouter.use(authenticate, loadPrincipal)
reviewRouter.get('/mine', requirePermission(Permission.BOOKING_READ_OWN), listMyReviews)
reviewRouter.post('/', requirePermission(Permission.BOOKING_READ_OWN), createReview)
reviewRouter.delete('/:id', requirePermission(Permission.BOOKING_READ_OWN), deleteReview)

export const wishlistRouter = Router()
wishlistRouter.use(authenticate, loadPrincipal)
wishlistRouter.get('/', requirePermission(Permission.BOOKING_READ_OWN), listWishlist)
wishlistRouter.post('/', requirePermission(Permission.BOOKING_READ_OWN), addToWishlist)
wishlistRouter.delete('/:type/:itemId', requirePermission(Permission.BOOKING_READ_OWN), removeFromWishlist)
