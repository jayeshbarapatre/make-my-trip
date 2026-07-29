import { createVendorCrud } from './factories/firestoreVendorCrud.js'

// Migrated from Prisma/MongoDB to Firestore. Stored field names match the
// public bus search so approved vendor inventory appears on the site.

const num = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const cityOf = (value) => {
  if (!value) return undefined
  if (typeof value === 'string') return value.trim()
  return value.city ?? undefined
}

const timeOf = (value) => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.time ?? undefined
}

const validate = (body, { partial = false } = {}) => {
  const errors = {}
  const from = cityOf(body.from ?? body.departure)
  const to = cityOf(body.to ?? body.arrival)

  if (!partial) {
    if (!(body.busName ?? body.operatorName)?.trim?.()) errors.operatorName = 'Operator name is required'
    if (!body.busNumber?.trim?.()) errors.busNumber = 'Bus number is required'
    if (!(body.busType ?? body.type)) errors.type = 'Bus type is required'
    if (num(body.price) === null) errors.price = 'Price is required'
  }

  const price = num(body.price)
  if (price !== null && price <= 0) errors.price = 'Price must be greater than zero'

  const seats = num(body.totalSeats ?? body.seats)
  if (seats !== null && (seats < 0 || seats > 100)) errors.seats = 'Seats must be between 0 and 100'

  if (from && to && from.toLowerCase() === to.toLowerCase()) {
    errors.to = 'Destination must differ from origin'
  }

  return errors
}

const toStorage = (body, { partial = false } = {}) => {
  const out = {}

  const name = body.busName ?? body.operatorName
  if (name !== undefined) out.busName = String(name).trim()
  if (body.operatorName !== undefined) out.operatorName = String(body.operatorName).trim()
  if (body.busNumber !== undefined) out.busNumber = String(body.busNumber).trim().toUpperCase()

  const from = cityOf(body.from ?? body.departure)
  const to = cityOf(body.to ?? body.arrival)
  if (from !== undefined) out.from = from
  if (to !== undefined) out.to = to

  const dep = timeOf(body.departureTime ?? body.departure)
  const arr = timeOf(body.arrivalTime ?? body.arrival)
  if (dep !== undefined) out.departureTime = dep
  if (arr !== undefined) out.arrivalTime = arr

  if (body.busType !== undefined || body.type !== undefined) out.busType = body.busType ?? body.type
  if (body.amenities !== undefined) out.amenities = Array.isArray(body.amenities) ? body.amenities : []
  if (body.image !== undefined) out.image = body.image

  const price = num(body.price)
  if (price !== null) out.price = price

  const mins = num(body.durationMinutes ?? body.duration)
  if (mins !== null) out.durationMinutes = mins

  const seats = num(body.totalSeats ?? body.seats)
  if (seats !== null) {
    out.totalSeats = seats
    if (body.seatsAvailable === undefined && !partial) out.seatsAvailable = seats
  }
  if (body.seatsAvailable !== undefined) out.seatsAvailable = num(body.seatsAvailable, 0)

  if (!partial) {
    out.totalSeats = out.totalSeats ?? 45
    out.seatsAvailable = out.seatsAvailable ?? out.totalSeats
    out.busType = out.busType ?? 'AC'
    out.durationMinutes = out.durationMinutes ?? 0
  }

  return out
}

const crud = createVendorCrud({
  collection: 'buses',
  label: 'Bus',
  listKey: 'buses',
  uniqueField: 'busNumber',
  validate,
  toStorage
})

export const getMyBuses = crud.list
export const createBus = crud.create
export const getMyBusById = crud.getById
export const updateBus = crud.update
export const deleteBus = crud.remove
export const submitBusForApproval = crud.submitForApproval
export const toggleBusStatus = crud.toggleStatus
