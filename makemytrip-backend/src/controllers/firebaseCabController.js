import { db } from '../config/firebase.js'
import { cityMatches } from '../utils/cities.js'
import { fetchRouteCandidates, applySearchPipeline } from '../services/inventorySearch.js'

const SORTERS = {
  price: (a, b) => (a.price ?? 0) - (b.price ?? 0),
  price_desc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
  rating: (a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0),
  capacity: (a, b) => (b.capacity ?? 0) - (a.capacity ?? 0)
}
import {
  validateCity,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

export const searchCabs = async (req, res) => {
  try {
    const { from, to, rideType, page = 1, limit = 20, minPrice, maxPrice, capacity, sortBy } = req.query

    console.log(`🚖 Firebase Cab Search: from=${from}, to=${to}, rideType=${rideType}`)

    const errors = {}
    if (from && !validateCity(from)) errors.from = 'Invalid city name'
    if (to && !validateCity(to)) errors.to = 'Invalid city name'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)

    // Indexed route query — reads only the cabs on this route, not all 250.
    const { docs, indexed, read } = await fetchRouteCandidates('cabs', { from, to })

    const routeFiltered = indexed
      ? docs
      : docs.filter((c) => cityMatches(c.from, from) && cityMatches(c.to, to))

    const { rows, pagination } = applySearchPipeline(routeFiltered, {
      filters: [
        // Availability tolerates both the current boolean contract and the
        // legacy numeric form, so cabs created before the fix stay searchable.
        (c) => (typeof c.available === 'number' ? c.available > 0 : c.available !== false),
        rideType ? (c) => String(c.type ?? '').toLowerCase().includes(String(rideType).toLowerCase()) : null,
        minPrice ? (c) => (c.price ?? 0) >= Number(minPrice) : null,
        maxPrice ? (c) => (c.price ?? 0) <= Number(maxPrice) : null,
        capacity ? (c) => (c.capacity ?? 0) >= Number(capacity) : null
      ].filter(Boolean),
      sortBy: SORTERS[sortBy] ?? SORTERS.price,
      page: pageNum,
      limit: pageSize
    })

    const enrichedCabs = rows.map(cab => ({
      ...cab,
      isAvailable: cab.available,
      estimatedTime: cab.estimatedTime || '5-10 mins'
    }))

    console.log(`🚖 Cabs ${from ?? '*'} → ${to ?? '*'}: read ${read}, matched ${pagination.total} (indexed: ${indexed})`)

    res.json({ data: enrichedCabs, pagination })
  } catch (err) {
    console.error('Firebase Cab Search error:', err.message)
    res.status(500).json({ message: 'Cab search is unavailable right now. Please try again.' })
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
    res.status(500).json({ message: 'Could not load this cab. Please try again.' })
  }
}
