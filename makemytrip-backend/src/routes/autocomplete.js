import { Router } from 'express'
import { getAirlines, getAirports, getCities, getAircrafts } from '../controllers/autocompleteController.js'

const router = Router()

router.get('/airlines', getAirlines)
router.get('/airports', getAirports)
router.get('/cities', getCities)
router.get('/aircrafts', getAircrafts)

export default router
