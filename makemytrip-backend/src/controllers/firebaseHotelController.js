import { db } from '../config/firebase.js'
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

    console.log(`🔍 Firebase Hotel Search: city=${city}, checkIn=${checkIn}, checkOut=${checkOut}`)

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

    // Fetch all active hotels from Firestore
    let query = db.collection('hotels').where('isActive', '==', true)
    const snapshot = await query.get()

    let hotels = []
    snapshot.forEach(doc => {
      hotels.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`📊 Found ${hotels.length} total active hotels in Firestore`)

    // Filter by city (client-side since Firestore doesn't support case-insensitive contains)
    if (city) {
      hotels = hotels.filter(hotel => {
        const cityLower = city.toLowerCase()
        return (
          hotel.city?.toLowerCase().includes(cityLower) ||
          hotel.name?.toLowerCase().includes(cityLower) ||
          hotel.location?.toLowerCase().includes(cityLower)
        )
      })
      console.log(`🏨 After city filter: ${hotels.length} hotels`)
    }

    // Sort by rating
    hotels.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    // Calculate nights count
    let nightsCount = 0
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      nightsCount = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
    }

    // Paginate
    const total = hotels.length
    const start = (pageNum - 1) * pageSize
    const paginatedHotels = hotels.slice(start, start + pageSize)

    // Enrich with availability info
    const enrichedHotels = paginatedHotels.map(hotel => ({
      ...hotel,
      nightsCount: nightsCount || 1,
      isAvailable: hotel.roomsAvailable > 0,
      availableRooms: hotel.roomsAvailable || 0
    }))

    console.log(`✅ Returning ${enrichedHotels.length} hotels (page ${pageNum})`)

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
    console.error('Firebase Hotel Search error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getHotelDetails = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`📍 Fetching hotel details: ${id}`)

    const hotelDoc = await db.collection('hotels').doc(id).get()

    if (!hotelDoc.exists) {
      console.log(`❌ Hotel not found: ${id}`)
      return res.status(404).json({ message: 'Hotel not found' })
    }

    const hotel = {
      id: hotelDoc.id,
      ...hotelDoc.data()
    }

    console.log(`✅ Hotel found: ${hotel.name}`)

    res.json({ data: hotel })
  } catch (err) {
    console.error('Get hotel details error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getHotelAvailability = async (req, res) => {
  try {
    const { id, checkIn, checkOut } = req.query

    const hotelDoc = await db.collection('hotels').doc(id).get()

    if (!hotelDoc.exists) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    const hotel = hotelDoc.data()

    let nightsCount = 0
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      nightsCount = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
    }

    const totalPrice = (hotel.pricePerNight || hotel.price) * nightsCount
    const tax = Math.round(totalPrice * 0.12)
    const grandTotal = totalPrice + tax

    res.json({
      data: {
        hotelId: id,
        name: hotel.name,
        roomsAvailable: hotel.roomsAvailable,
        pricePerNight: hotel.pricePerNight || hotel.price,
        nightsCount: nightsCount || 1,
        subtotal: totalPrice,
        tax,
        grandTotal,
        isAvailable: hotel.roomsAvailable > 0
      }
    })
  } catch (err) {
    console.error('Get availability error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getBlockedDates = async (req, res) => {
  try {
    const { hotelName } = req.params

    // For now, return empty blocked dates
    // In a real system, this would query bookings to find blocked dates
    res.json({
      data: {
        hotelName,
        blockedDates: []
      }
    })
  } catch (err) {
    console.error('Get blocked dates error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const checkHotelOverlap = async (req, res) => {
  try {
    const { hotelId, checkIn, checkOut } = req.body

    // For now, always return false (no overlap)
    // In a real system, this would check against existing bookings
    res.json({
      data: {
        hasOverlap: false,
        message: 'Hotel is available for selected dates'
      }
    })
  } catch (err) {
    console.error('Check overlap error:', err.message)
    res.status(500).json({ message: err.message })
  }
}
