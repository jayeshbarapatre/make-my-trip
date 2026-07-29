import { createAdminCrud } from './factories/firestoreAdminCrud.js'
import { validatePrice, validateSeats } from '../utils/validation.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// The admin form and the public search index disagree on shape, so this module
// owns the translation:
//
//   admin form   departure: { city, airport, date, time }, duration "2h 15m"
//   stored/search  source, sourceAirport, departure: ISO, duration: minutes
//
// Writing the form shape straight through would create flights that never
// appear in search results.

// Schedule times are wall-clock values, not instants — "09:30 departure" means
// 09:30 at the airport. They are stored and read back as UTC so the value an
// admin types is the value they see when editing, and the value search shows.
// Parsing as server-local instead would shift every time by the host's offset
// and silently rewrite the schedule on the next save.
const combineDateTime = (date, time) => {
  if (!date) return null
  const iso = new Date(`${date}T${time || '00:00'}:00.000Z`)
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString()
}

const splitIso = (iso) => {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return { date: '', time: '' }
  return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) }
}

// Accepts "2h 15m", "135", or a number.
const durationToMinutes = (value) => {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'number') return Math.round(value)
  const text = String(value).trim()
  if (/^\d+$/.test(text)) return parseInt(text, 10)
  const h = /(\d+)\s*h/i.exec(text)?.[1]
  const m = /(\d+)\s*m/i.exec(text)?.[1]
  if (!h && !m) return null
  return (parseInt(h || 0, 10) * 60) + parseInt(m || 0, 10)
}

const minutesToDuration = (mins) => {
  const n = Number(mins) || 0
  return `${Math.floor(n / 60)}h ${n % 60}m`
}

const validate = (body, { partial = false } = {}) => {
  const errors = {}
  const has = (k) => body[k] !== undefined && body[k] !== null && body[k] !== ''

  if (!partial) {
    if (!body.airline?.trim?.()) errors.airline = 'Airline name is required'
    if (!body.flightNumber?.trim?.()) errors.flightNumber = 'Flight number is required'
    if (!body.departure) errors.departure = 'Departure details are required'
    if (!body.arrival) errors.arrival = 'Arrival details are required'
    if (!has('price')) errors.price = 'Price is required'
  }

  if (has('price') && !validatePrice(body.price).valid) errors.price = 'Invalid price'
  if (has('seats') && !validateSeats(body.seats).valid) errors.seats = 'Seats must be between 0 and 500'

  return errors
}

const toStorage = (body, { partial = false } = {}) => {
  const out = {}
  const dep = body.departure
  const arr = body.arrival

  if (body.airline !== undefined) out.airline = String(body.airline).trim()
  if (body.flightNumber !== undefined) out.flightNumber = String(body.flightNumber).trim().toUpperCase()
  if (body.airlineCode !== undefined) out.airlineCode = body.airlineCode
  if (body.airlineLogo !== undefined) out.airlineLogo = body.airlineLogo

  // The form nests departure/arrival; search reads flat source/destination.
  if (dep && typeof dep === 'object') {
    if (dep.city !== undefined) out.source = dep.city
    if (dep.airport !== undefined) out.sourceAirport = dep.airport
    const iso = combineDateTime(dep.date, dep.time)
    if (iso) out.departure = iso
  } else if (typeof dep === 'string') {
    out.departure = dep
  }

  if (arr && typeof arr === 'object') {
    if (arr.city !== undefined) out.destination = arr.city
    if (arr.airport !== undefined) out.destinationAirport = arr.airport
    const iso = combineDateTime(arr.date, arr.time)
    if (iso) out.arrival = iso
  } else if (typeof arr === 'string') {
    out.arrival = arr
  }

  const mins = durationToMinutes(body.duration)
  if (mins !== null) out.duration = mins

  if (body.price !== undefined) out.price = parseFloat(body.price)
  if (body.seats !== undefined) {
    out.seats = parseInt(body.seats, 10)
    // On create, availability starts equal to capacity. On edit, only follow
    // capacity when the caller did not set availability explicitly.
    if (body.seatsAvailable === undefined && !partial) out.seatsAvailable = out.seats
  }
  if (body.seatsAvailable !== undefined) out.seatsAvailable = parseInt(body.seatsAvailable, 10)
  if (body.stops !== undefined) out.stops = parseInt(body.stops, 10) || 0
  if (body.baggage !== undefined) out.baggage = body.baggage
  if (body.aircraft !== undefined) out.aircraft = body.aircraft
  if (body.class !== undefined || body.cabinClass !== undefined) out.class = body.class ?? body.cabinClass
  if (body.image !== undefined) out.image = body.image
  if (body.refundable !== undefined) out.refundable = Boolean(body.refundable)
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive)

  if (!partial) {
    out.seats = out.seats ?? 180
    out.seatsAvailable = out.seatsAvailable ?? out.seats
    out.duration = out.duration ?? 120
    out.stops = out.stops ?? 0
    out.aircraft = out.aircraft ?? 'Boeing 737'
    out.class = out.class ?? 'Economy'
  }

  return out
}

// Rebuild the nested shape the admin form binds to.
const toClient = (doc) => {
  const dep = splitIso(doc.departure)
  const arr = splitIso(doc.arrival)

  return {
    ...doc,
    departure: { city: doc.source ?? '', airport: doc.sourceAirport ?? '', date: dep.date, time: dep.time },
    arrival: { city: doc.destination ?? '', airport: doc.destinationAirport ?? '', date: arr.date, time: arr.time },
    duration: minutesToDuration(doc.duration),
    durationMinutes: Number(doc.duration) || 0
  }
}

const crud = createAdminCrud({
  collection: 'flights',
  label: 'Flight',
  uniqueField: 'flightNumber',
  validate,
  toStorage,
  toClient
})

export const createFlight = crud.create
export const getAllFlights = crud.list
export const getFlightById = crud.getById
export const updateFlight = crud.update
export const deleteFlight = crud.remove
export const toggleFlightStatus = crud.toggleStatus
