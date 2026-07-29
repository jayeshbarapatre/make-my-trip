import express from 'express'
import { searchBuses, getBusDetails } from '../controllers/firebaseBusController.js'

const router = express.Router()

// Search route - must come before /:id to avoid /search being treated as an id
router.get('/search', searchBuses)
router.get('/', searchBuses)
router.get('/:id', getBusDetails)

export default router
