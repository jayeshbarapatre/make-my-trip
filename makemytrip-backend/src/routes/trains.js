import express from 'express'
import { searchTraines, getTrainById } from '../controllers/trainController.js'

const router = express.Router()

// Support both /trains and /trains/search patterns
router.get('/', searchTraines)
router.get('/search', searchTraines)
router.get('/:id', getTrainById)

export default router
