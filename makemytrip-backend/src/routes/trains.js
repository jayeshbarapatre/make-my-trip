import express from 'express'
import { searchTrains, getTrainById } from '../controllers/trainController.js'

const router = express.Router()

// Support both /trains and /trains/search patterns
router.get('/', searchTrains)
router.get('/search', searchTrains)
router.get('/:id', getTrainById)

export default router
