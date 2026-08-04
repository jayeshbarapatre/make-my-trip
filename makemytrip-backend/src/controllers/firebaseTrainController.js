import { db } from '../config/firebase.js'
import { cityMatches } from '../utils/cities.js'
import { fetchRouteCandidates, applySearchPipeline } from '../services/inventorySearch.js'
import { availabilityForItems, DEFAULT_TRAIN_CLASS } from '../services/availability.js'
import { parseSearchDate } from '../utils/searchDate.js'
import {
  validateCity,
  validateDateRange,
  validatePageNumber,
  validatePageSize
} from '../utils/validation.js'

// Sort orders the results page offers. Applied after the indexed route query,
// over a candidate set small enough that in-memory sorting is free.
const SORTERS = {
  price: (a, b) => (a.price ?? 0) - (b.price ?? 0),
  price_desc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
  duration: (a, b) => (a.durationMinutes ?? a.duration ?? 0) - (b.durationMinutes ?? b.duration ?? 0),
  departure: (a, b) => String(a.departureTime ?? '').localeCompare(String(b.departureTime ?? '')),
  seats: (a, b) => (b.seatsAvailable ?? 0) - (a.seatsAvailable ?? 0)
}

export const searchTrains = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20, minPrice, maxPrice, travelClass, sortBy } = req.query

    console.log(`🚂 Firebase Train Search: from=${from}, to=${to}, date=${date}, passengers=${passengers}`)

    const errors = {}
    if (from && !validateCity(from)) errors.from = 'Invalid city name'
    if (to && !validateCity(to)) errors.to = 'Invalid city name'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)

    const passengerCount = parseInt(passengers) || 1

    // Indexed route query — reads only the trains on this route, not all 509.
    // The route filter is an equality test against the canonical fields written
    // by `npm run migrate:route-index`; until that has run, this falls back to
    // the old scan rather than returning an empty page.
    const { docs, indexed, read } = await fetchRouteCandidates('trains', { from, to })

    // Alias-aware safety net for the fallback path, and for any document the
    // backfill could not resolve.
    const routeFiltered = indexed
      ? docs
      : docs.filter((t) => cityMatches(t.from, from) && cityMatches(t.to, to))

    const { rows, pagination } = applySearchPipeline(routeFiltered, {
      filters: [
        (t) => (t.seatsAvailable ?? 0) >= passengerCount,
        minPrice ? (t) => (t.price ?? 0) >= Number(minPrice) : null,
        maxPrice ? (t) => (t.price ?? 0) <= Number(maxPrice) : null,
        travelClass ? (t) => String(t.classes ?? t.class ?? '').toLowerCase().includes(String(travelClass).toLowerCase()) : null
      ].filter(Boolean),
      sortBy: SORTERS[sortBy] ?? SORTERS.price,
      page: pageNum,
      limit: pageSize
    })

    console.log(`🚂 Trains ${from ?? '*'} → ${to ?? '*'}: read ${read}, matched ${pagination.total} (indexed: ${indexed})`)

    // Seats are held per travel date AND per class. A train is a recurring
    // service, so one document sells on many days; and a sold-out sleeper must
    // not make an empty 3A berth look unavailable.
    const journeyDate = parseSearchDate(date)
    const classCode = travelClass ? String(travelClass).trim().toUpperCase() : DEFAULT_TRAIN_CLASS
    const freeByTrain = journeyDate
      ? await availabilityForItems(db.collection('trains'), rows, 'train', [journeyDate], classCode)
      : {}

    res.json({
      data: rows.map(train => {
        const dated = journeyDate && train.id in freeByTrain
        const seats = dated ? freeByTrain[train.id] : (train.seatsAvailable ?? 0)

        return {
        ...train,
        passengers: passengerCount,
        totalPrice: (train.price || 0) * passengerCount,
        isAvailable: seats >= passengerCount,
        availableSeats: seats,
        travelDate: journeyDate ?? null,
        travelClass: dated ? classCode : (train.travelClass ?? null),
        availabilityBasis: dated ? 'dates' : 'legacy'
        }
      }),
      pagination
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
