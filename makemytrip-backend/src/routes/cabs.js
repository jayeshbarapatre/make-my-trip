import express from 'express'
import { searchCabs, getCabDetails } from '../controllers/firebaseCabController.js'

const router = express.Router()

router.get('/', searchCabs)
router.get('/search', searchCabs)
router.get('/:id', getCabDetails)

export default router
