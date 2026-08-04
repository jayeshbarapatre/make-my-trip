import express from 'express'
import { searchTrains, getTrainDetails } from '../controllers/firebaseTrainController.js'
import { searchLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Inventory search is public and trivially automated. Each call is a full
// Firestore read, so an unthrottled scraper is both a cost and a load problem.
router.use(searchLimiter)

router.get('/', searchTrains)
router.get('/search', searchTrains)
router.get('/:id', getTrainDetails)

export default router
