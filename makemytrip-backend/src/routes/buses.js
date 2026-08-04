import express from 'express'
import { searchBuses, getBusDetails } from '../controllers/firebaseBusController.js'
import { searchLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Inventory search is public and trivially automated. Each call is a full
// Firestore read, so an unthrottled scraper is both a cost and a load problem.
router.use(searchLimiter)

// Search route - must come before /:id to avoid /search being treated as an id
router.get('/search', searchBuses)
router.get('/', searchBuses)
router.get('/:id', getBusDetails)

export default router
