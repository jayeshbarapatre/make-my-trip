import { db } from '../config/firebase.js'
import {
  validateCity,
  validateDateRange,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

export const searchBuses = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20 } = req.query

    console.log(`🚌 Firebase Bus Search: from=${from}, to=${to}, date=${date}, passengers=${passengers}`)

    const errors = {}
    if (from && !validateCity(from)) errors.from = 'Invalid city name'
    if (to && !validateCity(to)) errors.to = 'Invalid city name'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)

    // Fetch all active buses from Firestore
    let query = db.collection('buses').where('isActive', '==', true)
    const snapshot = await query.get()

    let buses = []
    snapshot.forEach(doc => {
      buses.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`📊 Found ${buses.length} total active buses in Firestore`)

    // Filter by from and to cities
    if (from || to) {
      buses = buses.filter(bus => {
        const fromMatch = !from || bus.from?.toLowerCase().includes(from.toLowerCase())
        const toMatch = !to || bus.to?.toLowerCase().includes(to.toLowerCase())
        return fromMatch && toMatch
      })
      console.log(`🚌 After route filter: ${buses.length} buses`)
    }

    // Check availability
    const passengerCount = parseInt(passengers) || 1
    buses = buses.filter(bus => bus.seatsAvailable >= passengerCount)
    console.log(`💺 After seat availability: ${buses.length} buses`)

    // Sort by price
    buses.sort((a, b) => (a.price || 0) - (b.price || 0))

    // Paginate
    const total = buses.length
    const start = (pageNum - 1) * pageSize
    const paginatedBuses = buses.slice(start, start + pageSize)

    // Enrich with availability info
    const enrichedBuses = paginatedBuses.map(bus => ({
      ...bus,
      passengers: passengerCount,
      totalPrice: (bus.price || 0) * passengerCount,
      isAvailable: bus.seatsAvailable >= passengerCount,
      availableSeats: bus.seatsAvailable || 0
    }))

    console.log(`✅ Returning ${enrichedBuses.length} buses (page ${pageNum})`)

    res.json({
      data: enrichedBuses,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    })
  } catch (err) {
    console.error('Firebase Bus Search error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getBusDetails = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`📍 Fetching bus details: ${id}`)

    const busDoc = await db.collection('buses').doc(id).get()

    if (!busDoc.exists) {
      console.log(`❌ Bus not found: ${id}`)
      return res.status(404).json({ message: 'Bus not found' })
    }

    const bus = {
      id: busDoc.id,
      ...busDoc.data()
    }

    console.log(`✅ Bus found: ${bus.busName}`)

    res.json({ data: bus })
  } catch (err) {
    console.error('Get bus details error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getBusAvailability = async (req, res) => {
  try {
    const { id, passengers } = req.query

    const busDoc = await db.collection('buses').doc(id).get()

    if (!busDoc.exists) {
      return res.status(404).json({ message: 'Bus not found' })
    }

    const bus = busDoc.data()
    const passengerCount = parseInt(passengers) || 1
    const totalPrice = (bus.price || 0) * passengerCount
    const tax = Math.round(totalPrice * 0.12)
    const grandTotal = totalPrice + tax

    res.json({
      data: {
        busId: id,
        busName: bus.busName,
        seatsAvailable: bus.seatsAvailable,
        pricePerSeat: bus.price,
        passengers: passengerCount,
        subtotal: totalPrice,
        tax,
        grandTotal,
        isAvailable: bus.seatsAvailable >= passengerCount
      }
    })
  } catch (err) {
    console.error('Get availability error:', err.message)
    res.status(500).json({ message: err.message })
  }
}
