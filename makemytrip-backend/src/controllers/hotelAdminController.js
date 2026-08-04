import { db } from '../config/firebase.js'
import { now } from '../utils/time.js'
import { createAdminCrud } from './factories/firestoreAdminCrud.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

// Migrated from Prisma/MongoDB to Firestore. The stored shape already matches
// what the admin form and public hotel search both use, so this is mostly
// defaults and coercion rather than translation.

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
    if (num(body.pricePerNight ?? body.price) === null) {
      errors.pricePerNight = 'Price per night is required'
    }
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
  if (body.reviews !== undefined) out.reviews = num(body.reviews, 0)
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive)

  // The form has used both `price` and `pricePerNight`; store both so search
  // and older UI code keep working.
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
    out.rooms = out.rooms ?? 50
    out.roomsAvailable = out.roomsAvailable ?? out.rooms
    out.rating = out.rating ?? 4
    out.reviews = out.reviews ?? 0
    out.images = out.images ?? []
    out.amenities = out.amenities ?? []
  }

  return out
}

const crud = createAdminCrud({
  collection: 'hotels',
  label: 'Hotel',
  validate,
  toStorage
})

export const createHotel = crud.create
export const getAllHotels = crud.list
export const getHotelById = crud.getById
export const updateHotel = crud.update
export const deleteHotel = crud.remove
export const toggleHotelStatus = crud.toggleStatus

// Kept for the listing that sorts by rating rather than recency.
export const listAllHotels = async (_req, res) => {
  try {
    const snap = await db.collection('hotels').get()
    const hotels = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((h) => !h.isDeleted)
      .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))

    res.json({ data: hotels })
  } catch (err) {
    console.error('List hotels error:', err.message)
    res.status(500).json({ message: 'Failed to load hotels' })
  }
}

export const updateHotelImages = async (req, res) => {
  try {
    // The existing admin UI sends `imageUrls`; accept `images` too.
    const imageUrls = req.body.imageUrls ?? req.body.images

    if (!Array.isArray(imageUrls)) {
      return res.status(400).json({ message: 'imageUrls must be an array' })
    }

    const ref = db.collection('hotels').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists || snap.data().isDeleted) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    const patch = {
      images: imageUrls,
      updatedAt: now(),
      updatedBy: req.adminId ?? null
    }

    // Keep the cover image pointing at something that still exists.
    if (!imageUrls.includes(snap.data().image)) patch.image = imageUrls[0] ?? null

    await ref.update(patch)

    writeAuditLog({
      req,
      action: AuditAction.LISTING_UPDATED,
      entity: 'hotels',
      entityId: req.params.id,
      newValue: { images: imageUrls.length }
    })

    const fresh = await ref.get()
    res.json({ message: 'Hotel images updated successfully', data: { hotel: { id: fresh.id, ...fresh.data() } } })
  } catch (err) {
    console.error('Update hotel images error:', err.message)
    res.status(500).json({ message: 'Failed to update images' })
  }
}

export const getHotelImages = async (req, res) => {
  try {
    const snap = await db.collection('hotels').doc(req.params.id).get()
    if (!snap.exists || snap.data().isDeleted) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    const h = snap.data()
    const images = Array.isArray(h.images) && h.images.length ? h.images : (h.image ? [h.image] : [])

    res.json({ data: { hotelId: snap.id, hotelName: h.name, images } })
  } catch (err) {
    console.error('Get hotel images error:', err.message)
    res.status(500).json({ message: 'Failed to load images' })
  }
}
