import { Router } from 'express'
import { searchFlights, getFlightById, getAllFlights } from '../controllers/firebaseFlightController.js'
import { searchLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Inventory search is public and trivially automated. Each call is a full
// Firestore read, so an unthrottled scraper is both a cost and a load problem.
router.use(searchLimiter)

router.get('/', searchFlights)
router.get('/search', searchFlights)
router.get('/all', getAllFlights)
router.get('/:id', getFlightById)

export default router
