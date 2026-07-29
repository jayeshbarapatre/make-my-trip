import { createAdminCrud } from './factories/firestoreAdminCrud.js'

// Migrated from Prisma/MongoDB to Firestore. Stored field names match what the
// public train search reads: trainName / trainNumber / from / to /
// departureTime / arrivalTime / durationMinutes / trainClass / seatsAvailable.

const num = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const cityOf = (value) => {
  if (!value) return undefined
  if (typeof value === 'string') return value.trim()
  return value.city ?? value.station ?? undefined
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
    if (!(body.trainName ?? body.operatorName)?.trim?.()) errors.operatorName = 'Train name is required'
    if (!body.trainNumber?.trim?.()) errors.trainNumber = 'Train number is required'
    if (!from) errors.from = 'Origin station is required'
    if (!to) errors.to = 'Destination station is required'
    if (num(body.price) === null) errors.price = 'Price is required'
  }

  const price = num(body.price)
  if (price !== null && price <= 0) errors.price = 'Price must be greater than zero'

  const seats = num(body.seats ?? body.seatsAvailable)
  if (seats !== null && seats < 0) errors.seats = 'Seats cannot be negative'

  if (from && to && from.toLowerCase() === to.toLowerCase()) {
    errors.to = 'Destination must differ from origin'
  }

  return errors
}

const toStorage = (body, { partial = false } = {}) => {
  const out = {}

  const name = body.trainName ?? body.operatorName
  if (name !== undefined) out.trainName = String(name).trim()
  if (body.trainNumber !== undefined) out.trainNumber = String(body.trainNumber).trim()

  const from = cityOf(body.from ?? body.departure)
  const to = cityOf(body.to ?? body.arrival)
  if (from !== undefined) out.from = from
  if (to !== undefined) out.to = to

  const dep = timeOf(body.departureTime ?? body.departure)
  const arr = timeOf(body.arrivalTime ?? body.arrival)
  if (dep !== undefined) out.departureTime = dep
  if (arr !== undefined) out.arrivalTime = arr

  if (body.trainClass !== undefined || body.type !== undefined) out.trainClass = body.trainClass ?? body.type
  if (body.amenities !== undefined) out.amenities = Array.isArray(body.amenities) ? body.amenities : []
  if (body.image !== undefined) out.image = body.image
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive)

  const price = num(body.price)
  if (price !== null) out.price = price

  const mins = num(body.durationMinutes ?? body.duration)
  if (mins !== null) out.durationMinutes = mins

  const seats = num(body.seats ?? body.seatsAvailable)
  if (seats !== null) out.seatsAvailable = seats

  if (!partial) {
    out.seatsAvailable = out.seatsAvailable ?? 200
    out.trainClass = out.trainClass ?? '3A'
    out.durationMinutes = out.durationMinutes ?? 0
  }

  return out
}

const crud = createAdminCrud({
  collection: 'trains',
  label: 'Train',
  uniqueField: 'trainNumber',
  validate,
  toStorage
})

export const createTrain = crud.create
// Existing route imports this misspelling; kept so the admin routes keep working.
export const getAllTraines = crud.list
export const getAllTrains = crud.list
export const getTrainById = crud.getById
export const updateTrain = crud.update
export const deleteTrain = crud.remove
export const toggleTrainStatus = crud.toggleStatus
