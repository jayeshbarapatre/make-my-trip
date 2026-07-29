import { db } from '../config/firebase.js'
import {
  validateCity,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

export const searchCabs = async (req, res) => {
  try {
    const { from, to, rideType, page = 1, limit = 20 } = req.query

    console.log(`🚖 Firebase Cab Search: from=${from}, to=${to}, rideType=${rideType}`)

    const errors = {}
    if (from && !validateCity(from)) errors.from = 'Invalid city name'
    if (to && !validateCity(to)) errors.to = 'Invalid city name'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)

    // Fetch all active cabs from Firestore
    let query = db.collection('cabs').where('isActive', '==', true)
    const snapshot = await query.get()

    let cabs = []
    snapshot.forEach(doc => {
      cabs.push({
        id: doc.id,
        ...doc.data()
      })
    })

    console.log(`📊 Found ${cabs.length} total active cabs in Firestore`)

    // Filter by from and to cities
    if (from || to) {
      cabs = cabs.filter(cab => {
        const fromMatch = !from || cab.from?.toLowerCase().includes(from.toLowerCase())
        const toMatch = !to || cab.to?.toLowerCase().includes(to.toLowerCase())
        return fromMatch && toMatch
      })
      console.log(`🚖 After route filter: ${cabs.length} cabs`)
    }

    // Filter by ride type if provided
    if (rideType) {
      cabs = cabs.filter(cab =>
        cab.type?.toLowerCase().includes(rideType.toLowerCase())
      )
      console.log(`🚗 After type filter: ${cabs.length} cabs`)
    }

    // Check availability
    cabs = cabs.filter(cab => cab.available === true)
    console.log(`✅ After availability: ${cabs.length} cabs`)

    // Sort by price
    cabs.sort((a, b) => (a.price || 0) - (b.price || 0))

    // Paginate
    const total = cabs.length
    const start = (pageNum - 1) * pageSize
    const paginatedCabs = cabs.slice(start, start + pageSize)

    // Enrich with additional info
    const enrichedCabs = paginatedCabs.map(cab => ({
      ...cab,
      isAvailable: cab.available,
      estimatedTime: cab.estimatedTime || '5-10 mins'
    }))

    console.log(`✅ Returning ${enrichedCabs.length} cabs (page ${pageNum})`)

    res.json({
      data: enrichedCabs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    })
  } catch (err) {
    console.error('Firebase Cab Search error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getCabDetails = async (req, res) => {
  try {
    const { id } = req.params

    console.log(`📍 Fetching cab details: ${id}`)

    const cabDoc = await db.collection('cabs').doc(id).get()

    if (!cabDoc.exists) {
      console.log(`❌ Cab not found: ${id}`)
      return res.status(404).json({ message: 'Cab not found' })
    }

    const cab = {
      id: cabDoc.id,
      ...cabDoc.data()
    }

    console.log(`✅ Cab found: ${cab.type}`)

    res.json({ data: cab })
  } catch (err) {
    console.error('Get cab details error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getCabAvailability = async (req, res) => {
  try {
    const { id, from, to } = req.query

    const cabDoc = await db.collection('cabs').doc(id).get()

    if (!cabDoc.exists) {
      return res.status(404).json({ message: 'Cab not found' })
    }

    const cab = cabDoc.data()
    const basePrice = cab.price || 0
    const estimatedDistance = 10 // km (default)
    const totalPrice = basePrice * estimatedDistance
    const tax = Math.round(totalPrice * 0.12)
    const grandTotal = totalPrice + tax

    res.json({
      data: {
        cabId: id,
        cabType: cab.type,
        capacity: cab.capacity,
        pricePerKm: cab.price,
        estimatedDistance,
        subtotal: totalPrice,
        tax,
        grandTotal,
        isAvailable: cab.available,
        estimatedTime: cab.estimatedTime || '5-10 mins'
      }
    })
  } catch (err) {
    console.error('Get availability error:', err.message)
    res.status(500).json({ message: err.message })
  }
}
