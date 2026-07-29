import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// Rooms hang off a hotel, so ownership is established through the parent: the
// hotel must belong to the calling vendor before any room under it is readable
// or writable. Checking only the room would let a vendor guess a room id from
// another tenant.

const COLLECTION = 'room_categories'

const num = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const toDate = (value) => {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Resolves the parent hotel, or null if it is missing or not this vendor's. */
const loadOwnedHotel = async (req) => {
  const snap = await db.collection('hotels').doc(req.params.hotelId).get()
  if (!snap.exists) return null
  const hotel = snap.data()
  if (hotel.isDeleted || hotel.vendorId !== req.vendorId) return null
  return { ref: snap.ref, data: hotel }
}

/** Resolves a room, but only through a hotel this vendor owns. */
const loadOwnedRoom = async (req) => {
  const hotel = await loadOwnedHotel(req)
  if (!hotel) return { hotel: null, room: null }

  const snap = await db.collection(COLLECTION).doc(req.params.roomId).get()
  if (!snap.exists) return { hotel, room: null }

  const room = snap.data()
  if (room.isDeleted || room.hotelId !== req.params.hotelId) return { hotel, room: null }

  return { hotel, room: { ref: snap.ref, data: room } }
}

export const getRoomsByHotel = async (req, res) => {
  try {
    const hotel = await loadOwnedHotel(req)
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' })

    const snap = await db.collection(COLLECTION).where('hotelId', '==', req.params.hotelId).get()

    const rooms = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => !r.isDeleted)
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))

    res.json({ data: { rooms } })
  } catch (err) {
    console.error('Get rooms error:', err.message)
    res.status(500).json({ message: 'Failed to load rooms' })
  }
}

export const createRoom = async (req, res) => {
  try {
    const hotel = await loadOwnedHotel(req)
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' })

    const { categoryName, description, capacity, totalRooms, basePrice, amenities, images } = req.body

    const errors = {}
    if (!categoryName?.trim?.()) errors.categoryName = 'Category name is required'
    if (num(totalRooms) === null) errors.totalRooms = 'Total rooms is required'
    else if (num(totalRooms) < 0) errors.totalRooms = 'Total rooms cannot be negative'
    if (num(basePrice) === null) errors.basePrice = 'Base price is required'
    else if (num(basePrice) <= 0) errors.basePrice = 'Base price must be greater than zero'

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const total = num(totalRooms, 0)
    const ref = db.collection(COLLECTION).doc()

    const doc = {
      hotelId: req.params.hotelId,
      vendorId: req.vendorId,
      categoryName: String(categoryName).trim(),
      description: description ?? null,
      capacity: num(capacity, 2),
      totalRooms: total,
      availableRooms: total,
      basePrice: num(basePrice, 0),
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) ? images : [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.principal?.uid ?? null,
      updatedBy: req.principal?.uid ?? null,
      isDeleted: false
    }

    await ref.set(doc)

    writeAuditLog({
      req,
      action: AuditAction.LISTING_CREATED,
      entity: COLLECTION,
      entityId: ref.id,
      newValue: { hotelId: req.params.hotelId, categoryName: doc.categoryName }
    })

    res.status(201).json({ message: 'Room category created successfully', data: { room: { id: ref.id, ...doc } } })
  } catch (err) {
    console.error('Create room error:', err.message)
    res.status(500).json({ message: 'Failed to create room category' })
  }
}

export const updateRoom = async (req, res) => {
  try {
    const { hotel, room } = await loadOwnedRoom(req)
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' })
    if (!room) return res.status(404).json({ message: 'Room category not found' })

    const { categoryName, description, capacity, totalRooms, basePrice, amenities, images } = req.body

    const errors = {}
    if (categoryName !== undefined && !String(categoryName).trim()) errors.categoryName = 'Category name cannot be empty'
    if (totalRooms !== undefined && (num(totalRooms) === null || num(totalRooms) < 0)) errors.totalRooms = 'Invalid total rooms'
    if (basePrice !== undefined && (num(basePrice) === null || num(basePrice) <= 0)) errors.basePrice = 'Invalid base price'

    if (Object.keys(errors).length) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const patch = { updatedAt: new Date().toISOString(), updatedBy: req.principal?.uid ?? null }

    if (categoryName !== undefined) patch.categoryName = String(categoryName).trim()
    if (description !== undefined) patch.description = description
    if (capacity !== undefined) patch.capacity = num(capacity, room.data.capacity)
    if (basePrice !== undefined) patch.basePrice = num(basePrice, room.data.basePrice)
    if (amenities !== undefined) patch.amenities = Array.isArray(amenities) ? amenities : []
    if (images !== undefined) patch.images = Array.isArray(images) ? images : []

    if (totalRooms !== undefined) {
      const total = num(totalRooms, room.data.totalRooms)
      patch.totalRooms = total
      // Availability must not exceed capacity after a downward resize, and the
      // rooms already booked should stay accounted for.
      const booked = (room.data.totalRooms ?? 0) - (room.data.availableRooms ?? 0)
      patch.availableRooms = Math.max(0, total - booked)
    }

    await room.ref.update(patch)

    writeAuditLog({
      req,
      action: AuditAction.LISTING_UPDATED,
      entity: COLLECTION,
      entityId: req.params.roomId,
      newValue: { fields: Object.keys(patch) }
    })

    const fresh = await room.ref.get()
    res.json({ message: 'Room category updated successfully', data: { room: { id: fresh.id, ...fresh.data() } } })
  } catch (err) {
    console.error('Update room error:', err.message)
    res.status(500).json({ message: 'Failed to update room category' })
  }
}

export const deleteRoom = async (req, res) => {
  try {
    const { hotel, room } = await loadOwnedRoom(req)
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' })
    if (!room) return res.status(404).json({ message: 'Room category not found' })

    // Soft delete: existing bookings reference this room category.
    await room.ref.update({
      isDeleted: true,
      isActive: false,
      deletedAt: FieldValue.serverTimestamp(),
      updatedBy: req.principal?.uid ?? null
    })

    writeAuditLog({
      req,
      action: AuditAction.LISTING_DELETED,
      entity: COLLECTION,
      entityId: req.params.roomId
    })

    res.json({ message: 'Room category deleted successfully' })
  } catch (err) {
    console.error('Delete room error:', err.message)
    res.status(500).json({ message: 'Failed to delete room category' })
  }
}

export const toggleRoomStatus = async (req, res) => {
  try {
    const { hotel, room } = await loadOwnedRoom(req)
    if (!hotel) return res.status(404).json({ message: 'Hotel not found' })
    if (!room) return res.status(404).json({ message: 'Room category not found' })

    const nextActive = room.data.isActive === false
    await room.ref.update({
      isActive: nextActive,
      updatedAt: new Date().toISOString(),
      updatedBy: req.principal?.uid ?? null
    })

    const fresh = await room.ref.get()
    res.json({
      message: `Room category ${nextActive ? 'activated' : 'deactivated'}`,
      data: { room: { id: fresh.id, ...fresh.data() } }
    })
  } catch (err) {
    console.error('Toggle room error:', err.message)
    res.status(500).json({ message: 'Failed to update room category' })
  }
}
