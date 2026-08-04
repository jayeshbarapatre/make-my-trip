import { Router } from 'express'
import { getAirlines, getAirports, getCities, getAircrafts, getFlightNumbers } from '../controllers/autocompleteController.js'
import { searchLimiter } from '../middleware/rateLimiter.js'

const router = Router()

// Autocomplete fires on every keystroke, so it is the highest-volume public
// endpoint and the easiest to turn into a catalogue-enumeration tool.
router.use(searchLimiter)

router.get('/airlines', getAirlines)
router.get('/airports', getAirports)
router.get('/cities', getCities)
router.get('/aircrafts', getAircrafts)
router.get('/flightNumbers', getFlightNumbers)

export default router
