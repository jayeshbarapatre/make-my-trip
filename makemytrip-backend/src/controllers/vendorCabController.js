import { createVendorCrud } from './factories/firestoreVendorCrud.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// The previous version compared cab.vendorId against req.user.id — the user's
// own id, not their tenant id. Ownership is now enforced in the factory against
// req.vendorId, which is the value the rest of the platform scopes on.

const num = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const validate = (body, { partial = false } = {}) => {
  const errors = {}

  if (!partial) {
    if (!(body.type ?? body.cabType)?.trim?.()) errors.type = 'Cab type is required'
    if (!(body.vehicleNumber ?? body.cabNumber)?.trim?.()) errors.cabNumber = 'Vehicle number is required'
    if (num(body.price ?? body.baseFare) === null) errors.baseFare = 'Base fare is required'
  }

  const price = num(body.price ?? body.baseFare)
  if (price !== null && price <= 0) errors.baseFare = 'Fare must be greater than zero'

  const capacity = num(body.capacity ?? body.cabs)
  if (capacity !== null && (capacity < 1 || capacity > 20)) errors.capacity = 'Capacity must be between 1 and 20'

  for (const field of ['perKmRate', 'perMinuteRate']) {
    const v = num(body[field])
    if (v !== null && v < 0) errors[field] = 'Rate cannot be negative'
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
  if (body.operatorName !== undefined) out.operatorName = body.operatorName
  if (body.vehicleNumber !== undefined || body.cabNumber !== undefined) {
    out.vehicleNumber = String(body.vehicleNumber ?? body.cabNumber).trim().toUpperCase()
  }
  if (body.phone !== undefined) out.phone = body.phone
  if (body.location !== undefined) out.location = body.location
  if (body.currentCity !== undefined) out.currentCity = body.currentCity
  if (body.estimatedTime !== undefined) out.estimatedTime = body.estimatedTime
  if (body.image !== undefined) out.image = body.image

  const price = num(body.price ?? body.baseFare)
  if (price !== null) {
    out.price = price
    out.baseFare = price
  }

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

const crud = createVendorCrud({
  collection: 'cabs',
  label: 'Cab',
  listKey: 'cabs',
  uniqueField: 'vehicleNumber',
  validate,
  toStorage
})

export const getMyCabs = crud.list
export const createCab = crud.create
export const getMyCabById = crud.getById
export const updateCab = crud.update
export const deleteCab = crud.remove
export const submitCabForApproval = crud.submitForApproval
export const toggleCabStatus = crud.toggleStatus
