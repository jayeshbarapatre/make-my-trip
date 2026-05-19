import express from 'express'
import { searchHotels, getHotelDetails } from '../controllers/hotelController.js'

const router = express.Router()

router.get('/search', searchHotels)
router.get('/:id', getHotelDetails)

export default router
