import { db } from '../config/firebase.js'
import { cityMatches } from '../utils/cities.js'
import { fetchRouteCandidates, applySearchPipeline } from '../services/inventorySearch.js'
import { stayNights, availabilityForItems } from '../services/availability.js'

const SORTERS = {
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  price: (a, b) => (a.pricePerNight ?? a.price ?? 0) - (b.pricePerNight ?? b.price ?? 0),
  price_desc: (a, b) => (b.pricePerNight ?? b.price ?? 0) - (a.pricePerNight ?? a.price ?? 0),
  stars: (a, b) => (b.stars ?? 0) - (a.stars ?? 0)
}
import {
  validateCity,
  validateDateRange,
  validateGuestCount,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

export const searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests, rooms, page = 1, limit = 20, minPrice, maxPrice, stars, amenity, sortBy } = req.query

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

    // Indexed city query — reads only that city's hotels, not all 430.
    const { docs, indexed, read } = await fetchRouteCandidates('hotels', { city })

    // Name and location stay a substring match: those are free text where a
    // literal match is what the user means.
    const matchesFreeText = (h, q) => {
      const needle = String(q ?? '').toLowerCase().trim()
      if (!needle) return true
      return cityMatches(h.city, q) ||
        h.name?.toLowerCase().includes(needle) ||
        h.location?.toLowerCase().includes(needle)
    }

    let cityFiltered = indexed ? docs : docs.filter((h) => matchesFreeText(h, city))

    // The field is labelled "City, area or property", and customers type hotel
    // names into it. The indexed lookup only knows cities, so a property name
    // resolved to no city and returned an empty *indexed* result — which
    // skipped the free-text branch above entirely and reported "no hotels
    // found" for a property that exists and is bookable.
    //
    // Only reached when the city lookup found nothing, so an ordinary city
    // search still costs one indexed query.
    if (city && cityFiltered.length === 0) {
      const { docs: all, read: scanned } = await fetchRouteCandidates('hotels', {})
      cityFiltered = all.filter((h) => matchesFreeText(h, city))
      if (cityFiltered.length > 0) {
        console.log(`🔍 "${city}" matched ${cityFiltered.length} by name/area after ${scanned} reads`)
      }
    }

    let nightsCount = 0
    if (checkIn && checkOut) {
      nightsCount = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    }

    const roomsWanted = Math.max(1, parseInt(rooms, 10) || 1)

    const { rows, pagination } = applySearchPipeline(cityFiltered, {
      filters: [
        (h) => (h.roomsAvailable ?? 0) >= roomsWanted,
        minPrice ? (h) => (h.pricePerNight ?? h.price ?? 0) >= Number(minPrice) : null,
        maxPrice ? (h) => (h.pricePerNight ?? h.price ?? 0) <= Number(maxPrice) : null,
        stars ? (h) => (h.stars ?? 0) >= Number(stars) : null,
        amenity ? (h) => (h.amenities ?? []).some((a) => String(a).toLowerCase().includes(String(amenity).toLowerCase())) : null
      ].filter(Boolean),
      sortBy: SORTERS[sortBy] ?? SORTERS.rating,
      page: pageNum,
      limit: pageSize
    })

    // True availability for the requested nights.
    //
    // The pre-pagination filter above uses the legacy counter, which cannot know
    // about dates. Without this a guest was shown "available", chose the hotel,
    // filled in traveller details and only discovered the night was sold out
    // when the payment transaction refused it.
    //
    // Sold-out results are marked rather than dropped: removing them here would
    // make the page count disagree with the totals reported above, and "sold out
    // for your dates" is more useful than a silently shorter list.
    let nights = []
    if (checkIn && checkOut) {
      try {
        nights = stayNights(checkIn, checkOut)
      } catch {
        // validateDateRange above already rejected genuinely bad input; anything
        // reaching here just means no dated lookup for this request.
        nights = []
      }
    }

    const freeByHotel = nights.length
      ? await availabilityForItems(db.collection('hotels'), rows, 'hotel', nights)
      : {}

    const enrichedHotels = rows.map(hotel => {
      const dated = nights.length && hotel.id in freeByHotel
      const available = dated ? freeByHotel[hotel.id] : (hotel.roomsAvailable ?? 0)

      return {
        ...hotel,
        nightsCount: nights.length || nightsCount || 1,
        isAvailable: available >= roomsWanted,
        availableRooms: available,
        // Lets the results page say "sold out for these dates" rather than
        // "sold out", which are different messages to a shopper.
        availabilityBasis: dated ? 'dates' : 'legacy'
      }
    })

    console.log(`🏨 Hotels in ${city ?? '*'}: read ${read}, matched ${pagination.total} (indexed: ${indexed})`)

    res.json({ data: enrichedHotels, pagination })
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
