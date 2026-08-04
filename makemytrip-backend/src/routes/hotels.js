import express from 'express'
import { searchHotels, getHotelDetails } from '../controllers/firebaseHotelController.js'
import { searchLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Inventory search is public and trivially automated. Each call is a full
// Firestore read, so an unthrottled scraper is both a cost and a load problem.
router.use(searchLimiter)

router.get('/', searchHotels)
router.get('/search', searchHotels)
router.get('/:id', getHotelDetails)

export default router
