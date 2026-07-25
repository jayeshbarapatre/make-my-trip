import express from 'express'
import { searchCabs, getCabById } from '../controllers/cabController.js'

const router = express.Router()

// Support both /cabs and /cabs/search patterns
router.get('/', searchCabs)
router.get('/search', searchCabs)
router.get('/:id', getCabById)

export default router
