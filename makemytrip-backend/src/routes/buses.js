import express from 'express'
import { searchBuses, getBusById } from '../controllers/busController.js'

const router = express.Router()

// Search route - must come before /:id to avoid /search being treated as an id
router.get('/search', searchBuses)
// Default list/search - when no query params provided
router.get('/', searchBuses)
// Get specific bus by id
router.get('/:id', getBusById)

export default router
