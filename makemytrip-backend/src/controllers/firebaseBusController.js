import { db } from '../config/firebase.js'
import { cityMatches } from '../utils/cities.js'
import { fetchRouteCandidates, applySearchPipeline } from '../services/inventorySearch.js'
import { availabilityForItems } from '../services/availability.js'
import { parseSearchDate } from '../utils/searchDate.js'

// Sort orders the results page offers. Applied after the indexed route query,
// over a candidate set small enough that in-memory sorting is free.
const SORTERS = {
  price: (a, b) => (a.price ?? 0) - (b.price ?? 0),
  price_desc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
  duration: (a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0),
  departure: (a, b) => String(a.departureTime ?? '').localeCompare(String(b.departureTime ?? '')),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  seats: (a, b) => (b.seatsAvailable ?? 0) - (a.seatsAvailable ?? 0)
}
import {
  validateCity,
  validateDateRange,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

export const searchBuses = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20, minPrice, maxPrice, busType, operator, sortBy } = req.query

    console.log(`🚌 Firebase Bus Search: from=${from}, to=${to}, date=${date}, passengers=${passengers}`)

    const errors = {}
    if (from && !validateCity(from)) errors.from = 'Invalid city name'
    if (to && !validateCity(to)) errors.to = 'Invalid city name'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)

    const passengerCount = parseInt(passengers) || 1

    // Indexed route query — reads only the buses on this route, not all 245.
    const { docs, indexed, read } = await fetchRouteCandidates('buses', { from, to })

    const routeFiltered = indexed
      ? docs
      : docs.filter((b) => cityMatches(b.from, from) && cityMatches(b.to, to))

    const { rows, pagination } = applySearchPipeline(routeFiltered, {
      filters: [
        (b) => (b.seatsAvailable ?? 0) >= passengerCount,
        minPrice ? (b) => (b.price ?? 0) >= Number(minPrice) : null,
        maxPrice ? (b) => (b.price ?? 0) <= Number(maxPrice) : null,
        busType ? (b) => String(b.busType ?? b.type ?? '').toLowerCase().includes(String(busType).toLowerCase()) : null,
        operator ? (b) => String(b.operatorName ?? b.operator ?? '').toLowerCase().includes(String(operator).toLowerCase()) : null
      ].filter(Boolean),
      sortBy: SORTERS[sortBy] ?? SORTERS.price,
      page: pageNum,
      limit: pageSize
    })

    // Seats are held per travel date. A bus is a recurring service, so the same
    // document sells on many days; without this the seats sold for one date were
    // reported as gone on every other date.
    const travelDate = parseSearchDate(date)
    const freeByBus = travelDate
      ? await availabilityForItems(db.collection('buses'), rows, 'bus', [travelDate])
      : {}

    const enrichedBuses = rows.map(bus => {
      const dated = travelDate && bus.id in freeByBus
      const seats = dated ? freeByBus[bus.id] : (bus.seatsAvailable ?? 0)

      return {
        ...bus,
        passengers: passengerCount,
        totalPrice: (bus.price || 0) * passengerCount,
        isAvailable: seats >= passengerCount,
        availableSeats: seats,
        travelDate: travelDate ?? null,
        availabilityBasis: dated ? 'dates' : 'legacy'
      }
    })

    console.log(`🚌 Buses ${from ?? '*'} → ${to ?? '*'}: read ${read}, matched ${pagination.total} (indexed: ${indexed})`)

    res.json({ data: enrichedBuses, pagination })
  } catch (err) {
    console.error('Firebase Bus Search error:', err.message)

    // A failed search must not be reported as "no buses". Both used to reach the
    // results page as an empty list, so a datastore outage rendered as
    // "Showing 0 of 0 buses" — indistinguishable from a route with no service,
    // and the reason a real inventory problem went undiagnosed for so long.
    // Firestore's RESOURCE_EXHAUSTED (gRPC code 8) is the read-quota case.
    if (err.code === 8) {
      return res.status(503).json({
        code: 'SEARCH_UNAVAILABLE',
        message: 'Bus search is temporarily unavailable — the datastore read quota is exhausted. Please try again later.'
      })
    }

    res.status(500).json({ code: 'SEARCH_FAILED', message: err.message })
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
