import { createAdminCrud } from './factories/firestoreAdminCrud.js'

// Migrated from Prisma/MongoDB to Firestore. Stored field names match what the
// public cab search reads: from / to / type / price / capacity / available /
// estimatedTime / driver / vehicleNumber.

const num = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const validate = (body, { partial = false } = {}) => {
  const errors = {}

  if (!partial) {
    if (!(body.type ?? body.cabType)?.trim?.()) errors.type = 'Cab type is required'
    if (num(body.price ?? body.baseFare) === null) errors.price = 'Fare is required'
    // Both ends are required for the same reason as in vendorCabController: a
    // cab with no destination cannot be found by a route search.
    if (!(body.from ?? body.currentCity)?.trim?.()) errors.from = 'Pickup city is required'
    if (!body.to?.trim?.()) errors.to = 'Drop-off city is required'
  }

  const price = num(body.price ?? body.baseFare)
  if (price !== null && price <= 0) errors.price = 'Fare must be greater than zero'

  const capacity = num(body.capacity)
  if (capacity !== null && (capacity < 1 || capacity > 20)) errors.capacity = 'Capacity must be between 1 and 20'

  const rating = num(body.rating)
  if (rating !== null && (rating < 0 || rating > 5)) errors.rating = 'Rating must be between 0 and 5'

  if (body.from && body.to && String(body.from).trim().toLowerCase() === String(body.to).trim().toLowerCase()) {
    errors.to = 'Drop-off must differ from pickup'
  }

  return errors
}

const toStorage = (body, { partial = false } = {}) => {
  const out = {}

  if (body.from !== undefined || body.currentCity !== undefined) {
    out.from = String(body.from ?? body.currentCity).trim()
  }
  if (body.to !== undefined) out.to = String(body.to).trim()
  if (body.type !== undefined || body.cabType !== undefined) out.type = body.type ?? body.cabType
  if (body.driver !== undefined || body.operatorName !== undefined) out.driver = body.driver ?? body.operatorName
  if (body.vehicleNumber !== undefined || body.cabNumber !== undefined) {
    out.vehicleNumber = String(body.vehicleNumber ?? body.cabNumber).trim().toUpperCase()
  }
  if (body.phone !== undefined) out.phone = body.phone
  if (body.estimatedTime !== undefined) out.estimatedTime = body.estimatedTime
  if (body.image !== undefined) out.image = body.image
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive)

  const price = num(body.price ?? body.baseFare)
  if (price !== null) out.price = price

  // Per-km / per-minute rates are retained when supplied so fare breakdowns
  // stay reproducible, even though search sorts on the flat price.
  const perKm = num(body.perKmRate)
  if (perKm !== null) out.perKmRate = perKm
  const perMin = num(body.perMinuteRate)
  if (perMin !== null) out.perMinuteRate = perMin

  const capacity = num(body.capacity ?? body.cabs)
  if (capacity !== null) out.capacity = capacity

  const rating = num(body.rating)
  if (rating !== null) out.rating = rating

  // `available` is a boolean flag: the public cab search filters on
  // `available === true`, so a numeric value here makes the cab invisible.
  // A numeric count (e.g. fleet size) is preserved separately.
  const availableNum = num(body.available)
  if (availableNum !== null) {
    out.availableCount = availableNum
    out.available = availableNum > 0
  }

  if (!partial) {
    out.capacity = out.capacity ?? 4
    out.available = out.available ?? true
    out.availableCount = out.availableCount ?? null
    out.rating = out.rating ?? 4.5
    out.type = out.type ?? 'Sedan'
  }

  return out
}

const crud = createAdminCrud({
  collection: 'cabs',
  label: 'Cab',
  validate,
  toStorage
})

export const createCab = crud.create
export const getAllCabs = crud.list
export const getCabById = crud.getById
export const updateCab = crud.update
export const deleteCab = crud.remove
export const toggleCabStatus = crud.toggleStatus
