import express from 'express'
import { searchTrains, getTrainDetails } from '../controllers/firebaseTrainController.js'

const router = express.Router()

router.get('/', searchTrains)
router.get('/search', searchTrains)
router.get('/:id', getTrainDetails)

export default router
