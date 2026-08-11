import { db } from '../config/firebase.js'
import { parseSearchDate, istDayRangeUtc } from '../utils/searchDate.js'
import { validatePageNumber, validatePageSize } from '../utils/validation.js'
import { cityMatches } from '../utils/cities.js'
import { fetchRouteCandidates, applySearchPipeline } from '../services/inventorySearch.js'
import { respondIfDatastoreDown } from '../utils/datastoreErrors.js'

const SORTERS = {
  price: (a, b) => (a.price ?? 0) - (b.price ?? 0),
  price_desc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
  duration: (a, b) => (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0),
  departure: (a, b) => new Date(a.departure?.time ?? 0) - new Date(b.departure?.time ?? 0),
  stops: (a, b) => (a.stops ?? 0) - (b.stops ?? 0)
}

// Schedule times are wall-clock values stored as UTC (see flightAdminController).
// Formatting in server-local time would shift every departure by the host's
// offset, so a flight entered as 09:30 would display as 15:00 in IST.
const formatTime = (iso) => {
  const d = new Date(iso)
  if (isNaN(d)) return '00:00'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
}

const formatDuration = (minutes) => {
  const mins = parseInt(minutes) || 0
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// Firestore flight docs store { source, destination, departure/arrival as ISO, duration in minutes }.
// The frontend consumes { departure: { city, time }, arrival: { city, time }, duration: "2h 15m" }.
const normalizeFlight = (id, f) => ({
  id,
  airline: f.airline,
  airlineCode: f.airlineCode || null,
  airlineLogo: f.airlineLogo || null,
  flightNumber: f.flightNumber,
  departure: { city: f.source, time: formatTime(f.departure), date: f.departure },
  arrival: { city: f.destination, time: formatTime(f.arrival), date: f.arrival },
  duration: formatDuration(f.duration),
  durationMinutes: f.duration,
  price: f.price,
  seats: f.seats,
  seatsAvailable: f.seatsAvailable !== undefined ? f.seatsAvailable : f.seats,
  stops: f.stops || 0,
  cabinClass: f.class || 'Economy',
  baggage: f.baggage || '15 kg check-in + 7 kg cabin',
  aircraft: f.aircraft || 'Airbus A320',
  isActive: f.isActive !== false
})

export const searchFlights = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20, minPrice, maxPrice, airline, stops, cabinClass, sortBy } = req.query

    // The travel date was accepted by the search form, shown back to the
    // customer, and then dropped here — so picking one day returned departures
    // from every day in the catalogue and a traveller could book the wrong one.
    //
    // The window is applied in the in-memory pipeline rather than pushed into
    // Firestore on purpose: the route query above is equality-only so that it
    // needs no composite index, and adding a range filter on `departure`
    // alongside those equalities would require one per combination. After the
    // route filter the candidate set is a single route's departures, so the
    // date test is cheap here.
    let departureWindow = null
    if (date !== undefined && String(date).trim() !== '') {
      const parsedDate = parseSearchDate(date)
      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_DATE',
          message: 'Provide the travel date as YYYY-MM-DD.'
        })
      }
      departureWindow = istDayRangeUtc(parsedDate)
    }

    console.log(`✈️ Firebase Flight Search: from=${from}, to=${to}, date=${departureWindow ? date : 'any'}`)

    const passengerCount = parseInt(passengers) || 1
    // Shared validators, so every vertical honours the same page-size ceiling.
    // Flights alone capped at 50 while the others allowed 100, so a results page
    // asking for a whole route silently got a truncated one here.
    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)

    // Indexed route query — reads only the flights on this route, not all 162.
    const { docs, indexed, read } = await fetchRouteCandidates('flights', { from, to })

    let flights = docs.map((d) => normalizeFlight(d.id, d)).filter((f) => f.isActive)

    // The fallback path still needs alias-aware matching; the indexed path has
    // already constrained the route.
    if (!indexed) {
      if (from) flights = flights.filter((f) => cityMatches(f.departure.city, from))
      if (to) flights = flights.filter((f) => cityMatches(f.arrival.city, to))
    }

    const { rows: paged, pagination } = applySearchPipeline(flights, {
      filters: [
        (f) => (f.seatsAvailable ?? 0) >= passengerCount,
        // `departure.date` carries the raw stored ISO instant; `departure.time`
        // is a display string and must not be compared against.
        departureWindow
          ? (f) => {
            const iso = f.departure?.date
            return typeof iso === 'string' && iso >= departureWindow.startIso && iso <= departureWindow.endIso
          }
          : null,
        airline ? (f) => String(f.airline ?? '').toLowerCase().includes(String(airline).toLowerCase()) : null,
        minPrice ? (f) => f.price >= parseFloat(minPrice) : null,
        maxPrice ? (f) => f.price <= parseFloat(maxPrice) : null,
        stops !== undefined && stops !== '' ? (f) => (f.stops ?? 0) <= Number(stops) : null,
        cabinClass ? (f) => String(f.cabinClass ?? '').toLowerCase() === String(cabinClass).toLowerCase() : null
      ].filter(Boolean),
      sortBy: SORTERS[sortBy] ?? SORTERS.price,
      page: pageNum,
      limit: pageSize
    })

    console.log(`✈️ Flights ${from ?? '*'} → ${to ?? '*'}: read ${read}, matched ${pagination.total} (indexed: ${indexed})`)

    res.json({ data: paged, pagination })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Flight search')) return
    console.error('Firebase Flight Search error:', err.message)
    res.status(500).json({ message: 'Failed to search flights', error: err.message })
  }
}

export const getFlightById = async (req, res) => {
  try {
    const doc = await db.collection('flights').doc(req.params.id).get()
    if (!doc.exists) {
      return res.status(404).json({ message: 'Flight not found' })
    }
    res.json({ data: normalizeFlight(doc.id, doc.data()) })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Flight search')) return
    console.error('Get flight error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const getAllFlights = async (req, res) => {
  try {
    const snapshot = await db.collection('flights').limit(100).get()
    const flights = snapshot.docs
      .map(doc => normalizeFlight(doc.id, doc.data()))
      .sort((a, b) => (a.price || 0) - (b.price || 0))
    res.json({ data: flights })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Flight search')) return
    res.status(500).json({ message: err.message })
  }
}
