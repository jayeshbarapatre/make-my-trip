import express from 'express'
import { searchHotels, getHotelDetails } from '../controllers/hotelController.js'

const router = express.Router()

// Support both /hotels and /hotels/search patterns
router.get('/', searchHotels)
router.get('/search', searchHotels)
router.get('/:id', getHotelDetails)

export default router
