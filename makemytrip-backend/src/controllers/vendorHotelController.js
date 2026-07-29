import { createVendorCrud } from './factories/firestoreVendorCrud.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// Tenant scoping now lives in the factory: every query is constrained to
// req.vendorId, which vendorAuth reads from the stored user document rather
// than from the request.

const num = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const validate = (body, { partial = false } = {}) => {
  const errors = {}

  if (!partial) {
    if (!body.name?.trim?.()) errors.name = 'Hotel name is required'
    if (!body.city?.trim?.()) errors.city = 'City is required'
    if (num(body.pricePerNight ?? body.price) === null) errors.pricePerNight = 'Price per night is required'
  }

  const price = num(body.pricePerNight ?? body.price)
  if (price !== null && price <= 0) errors.pricePerNight = 'Price must be greater than zero'

  const rating = num(body.rating)
  if (rating !== null && (rating < 0 || rating > 5)) errors.rating = 'Rating must be between 0 and 5'

  const rooms = num(body.rooms)
  if (rooms !== null && rooms < 0) errors.rooms = 'Rooms cannot be negative'

  return errors
}

const toStorage = (body, { partial = false } = {}) => {
  const out = {}

  if (body.name !== undefined) out.name = String(body.name).trim()
  if (body.city !== undefined) out.city = String(body.city).trim()
  if (body.location !== undefined) out.location = body.location
  if (body.locality !== undefined) out.locality = body.locality
  if (body.description !== undefined) out.description = body.description
  if (body.image !== undefined) out.image = body.image
  if (body.images !== undefined) out.images = Array.isArray(body.images) ? body.images : []
  if (body.amenities !== undefined) out.amenities = Array.isArray(body.amenities) ? body.amenities : []
  if (body.checkin !== undefined) out.checkin = body.checkin
  if (body.checkout !== undefined) out.checkout = body.checkout
  if (body.stars !== undefined) out.stars = num(body.stars, 3)
  if (body.rating !== undefined) out.rating = num(body.rating, 4)

  const price = num(body.pricePerNight ?? body.price)
  if (price !== null) {
    out.pricePerNight = price
    out.price = price
  }

  const rooms = num(body.rooms)
  if (rooms !== null) {
    out.rooms = rooms
    if (body.roomsAvailable === undefined && !partial) out.roomsAvailable = rooms
  }
  if (body.roomsAvailable !== undefined) out.roomsAvailable = num(body.roomsAvailable, 0)

  if (!partial) {
    out.rooms = out.rooms ?? 20
    out.roomsAvailable = out.roomsAvailable ?? out.rooms
    out.rating = out.rating ?? 4
    out.reviews = 0
    out.images = out.images ?? []
    out.amenities = out.amenities ?? []
  }

  return out
}

const crud = createVendorCrud({
  collection: 'hotels',
  label: 'Hotel',
  listKey: 'hotels',
  validate,
  toStorage
})

export const getMyHotels = crud.list
export const createHotel = crud.create
export const getMyHotelById = crud.getById
export const updateHotel = crud.update
export const deleteHotel = crud.remove
export const submitForApproval = crud.submitForApproval
export const toggleHotelStatus = crud.toggleStatus

// Exported so the room controller can verify hotel ownership before touching
// a room that hangs off it.
export const loadOwnedHotel = crud.loadOwned
