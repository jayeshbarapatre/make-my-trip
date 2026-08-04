import express from 'express'
import { searchCabs, getCabDetails } from '../controllers/firebaseCabController.js'
import { searchLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Inventory search is public and trivially automated. Each call is a full
// Firestore read, so an unthrottled scraper is both a cost and a load problem.
router.use(searchLimiter)

router.get('/', searchCabs)
router.get('/search', searchCabs)
router.get('/:id', getCabDetails)

export default router
