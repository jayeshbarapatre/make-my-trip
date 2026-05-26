import express from 'express'
import { searchTraines, getTrainById } from '../controllers/trainController.js'

const router = express.Router()

router.get('/search', searchTraines)
router.get('/:id', getTrainById)

export default router
