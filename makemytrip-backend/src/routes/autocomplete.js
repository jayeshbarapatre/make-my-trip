import { Router } from 'express'
import { getAirlines, getAirports, getCities, getAircrafts, getFlightNumbers } from '../controllers/autocompleteController.js'

const router = Router()

router.get('/airlines', getAirlines)
router.get('/airports', getAirports)
router.get('/cities', getCities)
router.get('/aircrafts', getAircrafts)
router.get('/flightNumbers', getFlightNumbers)

export default router
