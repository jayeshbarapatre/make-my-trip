import { db } from '../config/firebase.js'

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
    const { from, to, passengers, page = 1, limit = 20, minPrice, maxPrice, airline } = req.query

    console.log(`✈️ Firebase Flight Search: from=${from}, to=${to}`)

    const snapshot = await db.collection('flights').get()

    let flights = []
    snapshot.forEach(doc => {
      const f = normalizeFlight(doc.id, doc.data())
      if (f.isActive) flights.push(f)
    })

    if (from) {
      flights = flights.filter(f => f.departure.city?.toLowerCase().includes(from.toLowerCase()))
    }
    if (to) {
      flights = flights.filter(f => f.arrival.city?.toLowerCase().includes(to.toLowerCase()))
    }
    if (airline) {
      flights = flights.filter(f => f.airline?.toLowerCase().includes(airline.toLowerCase()))
    }
    if (minPrice) flights = flights.filter(f => f.price >= parseFloat(minPrice))
    if (maxPrice) flights = flights.filter(f => f.price <= parseFloat(maxPrice))

    const passengerCount = parseInt(passengers) || 1
    flights = flights.filter(f => f.seatsAvailable >= passengerCount)

    flights.sort((a, b) => (a.price || 0) - (b.price || 0))

    const pageNum = Math.max(1, parseInt(page) || 1)
    const pageSize = Math.min(50, parseInt(limit) || 20)
    const total = flights.length
    const start = (pageNum - 1) * pageSize
    const paged = flights.slice(start, start + pageSize)

    console.log(`✅ Returning ${paged.length} of ${total} flights`)

    res.json({
      data: paged,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    })
  } catch (err) {
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
    res.status(500).json({ message: err.message })
  }
}
