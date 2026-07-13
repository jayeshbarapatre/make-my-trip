import prisma from '../config/prismaClient.js'
import logger from '../utils/logger.js'
import {
  validateCity,
  validateDateRange,
  validateGuestCount,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

export const searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests, page = 1, limit = 20 } = req.query

    const errors = {}
    if (city && !validateCity(city)) errors.city = 'Invalid city name'
    if (checkIn && checkOut && !validateDateRange(checkIn, checkOut).valid) {
      errors.checkOut = validateDateRange(checkIn, checkOut).error
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)
    const skip = (pageNum - 1) * pageSize

    const where = { isActive: true }
    if (city) {
      where.OR = [
        { city: { contains: city, mode: 'insensitive' } },
        { name: { contains: city, mode: 'insensitive' } },
        { location: { contains: city, mode: 'insensitive' } }
      ]
    }

    let nightsCount = 0
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      nightsCount = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
    }

    const total = await prisma.hotel.count({ where })
    const hotels = await prisma.hotel.findMany({
      where,
      orderBy: { rating: 'desc' },
      skip,
      take: pageSize
    })

    const enrichedHotels = hotels.map(hotel => ({
      ...hotel,
      nightsCount: nightsCount || 1,
      isAvailable: hotel.roomsAvailable > 0,
      availableRooms: hotel.roomsAvailable || 0
    }))

    res.json({
      data: enrichedHotels,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    })
  } catch (err) {
    logger.error('Hotel search error:', err)
    res.status(500).json({ success: false, message: 'Failed to search hotels' })
  }
}

export const getHotelDetails = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id }
    })

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' })
    }

    res.json({ success: true, data: hotel })
  } catch (err) {
    logger.error('Get hotel details error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch hotel details' })
  }
}
