import { db } from '../config/firebase.js'
import {
  validateCity,
  validateDateRange,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

export const searchTrains = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20 } = req.query

    console.log(`🚂 Firebase Train Search: from=${from}, to=${to}, date=${date}, passengers=${passengers}`)

    const errors = {}
    if (from && !validateCity(from)) errors.from = 'Invalid city name'
    if (to && !validateCity(to)) errors.to = 'Invalid city name'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)

    // Fetch all active trains from Firestore
    let query = db.collection('trains').where('isActive', '==', true)
    const snapshot = await query.get()

    let trains = []
    snapshot.forEach(doc => {
      trains.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`📊 Found ${trains.length} total active trains in Firestore`)

    // Filter by from and to cities
    if (from || to) {
      trains = trains.filter(train => {
        const fromMatch = !from || train.from?.toLowerCase().includes(from.toLowerCase())
        const toMatch = !to || train.to?.toLowerCase().includes(to.toLowerCase())
        return fromMatch && toMatch
      })
      console.log(`🚂 After route filter: ${trains.length} trains`)
    }

    // Check availability
    const passengerCount = parseInt(passengers) || 1
    trains = trains.filter(train => train.seatsAvailable >= passengerCount)
    console.log(`💺 After seat availability: ${trains.length} trains`)

    // Sort by price
    trains.sort((a, b) => (a.price || 0) - (b.price || 0))

    // Paginate
    const total = trains.length
    const start = (pageNum - 1) * pageSize
    const paginatedTrains = trains.slice(start, start + pageSize)

    // Enrich with availability info
    const enrichedTrains = paginatedTrains.map(train => ({
      ...train,
      passengers: passengerCount,
      totalPrice: (train.price || 0) * passengerCount,
      isAvailable: train.seatsAvailable >= passengerCount,
      availableSeats: train.seatsAvailable || 0
    }))

    console.log(`✅ Returning ${enrichedTrains.length} trains (page ${pageNum})`)

    res.json({
      data: enrichedTrains,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    })
  } catch (err) {
    console.error('Firebase Train Search error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getTrainDetails = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`📍 Fetching train details: ${id}`)

    const trainDoc = await db.collection('trains').doc(id).get()

    if (!trainDoc.exists) {
      console.log(`❌ Train not found: ${id}`)
      return res.status(404).json({ message: 'Train not found' })
    }

    const train = {
      id: trainDoc.id,
      ...trainDoc.data()
    }

    console.log(`✅ Train found: ${train.trainName}`)

    res.json({ data: train })
  } catch (err) {
    console.error('Get train details error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getTrainAvailability = async (req, res) => {
  try {
    const { id, passengers } = req.query

    const trainDoc = await db.collection('trains').doc(id).get()

    if (!trainDoc.exists) {
      return res.status(404).json({ message: 'Train not found' })
    }

    const train = trainDoc.data()
    const passengerCount = parseInt(passengers) || 1
    const totalPrice = (train.price || 0) * passengerCount
    const tax = Math.round(totalPrice * 0.12)
    const grandTotal = totalPrice + tax

    res.json({
      data: {
        trainId: id,
        trainName: train.trainName,
        seatsAvailable: train.seatsAvailable,
        pricePerSeat: train.price,
        passengers: passengerCount,
        subtotal: totalPrice,
        tax,
        grandTotal,
        isAvailable: train.seatsAvailable >= passengerCount
      }
    })
  } catch (err) {
    console.error('Get availability error:', err.message)
    res.status(500).json({ message: err.message })
  }
}
