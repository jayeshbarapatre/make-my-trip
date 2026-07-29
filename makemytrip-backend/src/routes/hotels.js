import express from 'express'
import { searchHotels, getHotelDetails } from '../controllers/firebaseHotelController.js'

const router = express.Router()

router.get('/', searchHotels)
router.get('/search', searchHotels)
router.get('/:id', getHotelDetails)

export default router
