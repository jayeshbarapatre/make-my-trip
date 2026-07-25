import express from 'express'
import { searchCabs } from '../controllers/cabController.js'

const router = express.Router()

// Support both /cabs and /cabs/search patterns
router.get('/', searchCabs)
router.get('/search', searchCabs)

export default router
