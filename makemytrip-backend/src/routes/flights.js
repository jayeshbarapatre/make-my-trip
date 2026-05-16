import { Router } from 'express'
import { searchFlights, getFlightById, getAllFlights, createFlight, updateFlight, deleteFlight } from '../controllers/flightController.js'

const router = Router()

router.get('/', getAllFlights)
router.get('/search', searchFlights)
router.get('/:id', getFlightById)
router.post('/', createFlight)
router.put('/:id', updateFlight)
router.delete('/:id', deleteFlight)

export default router
