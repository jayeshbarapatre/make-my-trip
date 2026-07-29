import { Router } from 'express'
import { searchFlights, getFlightById, getAllFlights } from '../controllers/firebaseFlightController.js'

const router = Router()

router.get('/', searchFlights)
router.get('/search', searchFlights)
router.get('/all', getAllFlights)
router.get('/:id', getFlightById)

export default router
