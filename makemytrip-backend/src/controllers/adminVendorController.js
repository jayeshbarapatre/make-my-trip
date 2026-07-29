import bcrypt from 'bcryptjs'
import { db } from '../config/firebase.js'
import { Role, AccountStatus, resolveRole, resolveAccountStatus } from '../config/roles.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

// Migrated from Prisma/MongoDB to Firestore. Vendors are `users` documents with
// role=vendor and a vendorId; inventory is scoped by that vendorId, not by the
// user's own id.

const toDate = (value) => {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const publicVendor = (u, hotelCount = 0) => ({
  id: u.id,
  name: u.name ?? null,
  email: u.email ?? null,
  phone: u.phone ?? null,
  vendorId: u.vendorId ?? null,
  vendorName: u.vendorName ?? u.businessName ?? null,
  vendorType: u.vendorType ?? 'hotel',
  vendorStatus: resolveAccountStatus(u),
  accountStatus: resolveAccountStatus(u),
  isActive: resolveAccountStatus(u) === AccountStatus.ACTIVE,
  createdAt: u.createdAt ?? null,
  is_vendor: true,
  _count: { hotels: hotelCount }
})

const findUserById = async (id) => {
  const snap = await db.collection('users').where('id', '==', id).limit(1).get()
  return snap.empty ? null : { ref: snap.docs[0].ref, data: snap.docs[0].data() }
}

/** Takes a vendor's inventory off sale across every collection they own. */
const deactivateInventory = async (vendorId, adminId) => {
  if (!vendorId) return
  const batch = db.batch()
  for (const collection of ['hotels', 'buses', 'cabs']) {
    const snap = await db.collection(collection).where('vendorId', '==', vendorId).get()
    snap.forEach((doc) => batch.update(doc.ref, { isActive: false, updatedBy: adminId ?? null }))
  }
  await batch.commit()
}

export const getAllVendors = async (_req, res) => {
  try {
    const [usersSnap, hotelsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('hotels').get()
    ])

    // Count in one pass rather than a query per vendor.
    const hotelCounts = new Map()
    for (const doc of hotelsSnap.docs) {
      const h = doc.data()
      if (h.isDeleted || !h.vendorId) continue
      hotelCounts.set(h.vendorId, (hotelCounts.get(h.vendorId) ?? 0) + 1)
    }

    const vendors = usersSnap.docs
      .map((d) => d.data())
      .filter((u) => !u.isDeleted && resolveRole(u) === Role.VENDOR)
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
      .map((u) => publicVendor(u, hotelCounts.get(u.vendorId) ?? 0))

    res.json({ data: { vendors } })
  } catch (err) {
    console.error('Get vendors error:', err.message)
    res.status(500).json({ message: 'Failed to load vendors' })
  }
}

export const getVendorHotels = async (req, res) => {
  try {
    const found = await findUserById(req.params.id)
    if (!found || resolveRole(found.data) !== Role.VENDOR) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    const vendorId = found.data.vendorId
    if (!vendorId) return res.json({ data: { hotels: [] } })

    const [hotelsSnap, roomsSnap] = await Promise.all([
      db.collection('hotels').where('vendorId', '==', vendorId).get(),
      db.collection('room_categories').where('vendorId', '==', vendorId).get()
    ])

    const roomsByHotel = new Map()
    for (const doc of roomsSnap.docs) {
      const r = { id: doc.id, ...doc.data() }
      if (r.isDeleted) continue
      if (!roomsByHotel.has(r.hotelId)) roomsByHotel.set(r.hotelId, [])
      roomsByHotel.get(r.hotelId).push(r)
    }

    const hotels = hotelsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((h) => !h.isDeleted)
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
      .map((h) => ({ ...h, roomCategories: roomsByHotel.get(h.id) ?? [] }))

    res.json({ data: { hotels } })
  } catch (err) {
    console.error('Get vendor hotels error:', err.message)
    res.status(500).json({ message: 'Failed to load vendor hotels' })
  }
}

export const createVendor = async (req, res) => {
  try {
    const { name, email, password, phone, vendorType = 'hotel', vendorName } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const ref = db.collection('users').doc(email)
    if ((await ref.get()).exists) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const id = `user_${Date.now()}`
    // An admin creating a vendor directly is itself the approval, so the
    // vendorId is assigned here rather than through the application queue.
    const vendorId = `VENDOR-${id}`

    const doc = {
      id,
      name,
      email,
      phone: phone ?? null,
      password: await bcrypt.hash(password, 10),
      role: Role.VENDOR,
      accountStatus: AccountStatus.ACTIVE,
      vendorId,
      vendorType,
      vendorName: vendorName ?? name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.adminId ?? null,
      updatedBy: req.adminId ?? null,
      isDeleted: false
    }

    await ref.set(doc)

    writeAuditLog({
      req,
      action: AuditAction.VENDOR_APPROVED,
      entity: 'users',
      entityId: id,
      newValue: { email, vendorId, vendorType, createdBy: 'admin' }
    })

    res.status(201).json({ message: 'Vendor created successfully', data: { vendor: publicVendor(doc) } })
  } catch (err) {
    console.error('Create vendor error:', err.message)
    res.status(500).json({ message: 'Failed to create vendor' })
  }
}

export const deleteVendor = async (req, res) => {
  try {
    const found = await findUserById(req.params.id)
    if (!found || resolveRole(found.data) !== Role.VENDOR) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    // Soft delete, and take their inventory off sale in the same step — leaving
    // a removed vendor's listings live and bookable is worse than the orphaned
    // references a hard delete would create.
    await deactivateInventory(found.data.vendorId, req.adminId)

    await found.ref.update({
      isDeleted: true,
      accountStatus: AccountStatus.DISABLED,
      updatedAt: new Date().toISOString(),
      updatedBy: req.adminId ?? null
    })

    writeAuditLog({
      req,
      action: AuditAction.VENDOR_SUSPENDED,
      entity: 'users',
      entityId: req.params.id,
      oldValue: { accountStatus: resolveAccountStatus(found.data) },
      newValue: { isDeleted: true, accountStatus: AccountStatus.DISABLED, inventoryDeactivated: true }
    })

    res.json({ success: true, message: 'Vendor deleted successfully' })
  } catch (err) {
    console.error('Delete vendor error:', err.message)
    res.status(500).json({ message: 'Failed to delete vendor' })
  }
}

export const toggleVendorStatus = async (req, res) => {
  try {
    const found = await findUserById(req.params.id)
    if (!found || resolveRole(found.data) !== Role.VENDOR) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    const wasActive = resolveAccountStatus(found.data) === AccountStatus.ACTIVE
    const nextStatus = wasActive ? AccountStatus.SUSPENDED : AccountStatus.ACTIVE

    await found.ref.update({
      accountStatus: nextStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: req.adminId ?? null
    })

    // Suspending pulls their inventory from sale immediately. Re-activating does
    // not silently republish it — the vendor re-enables each listing themselves.
    if (wasActive) await deactivateInventory(found.data.vendorId, req.adminId)

    writeAuditLog({
      req,
      action: wasActive ? AuditAction.VENDOR_SUSPENDED : AuditAction.VENDOR_APPROVED,
      entity: 'users',
      entityId: req.params.id,
      oldValue: { accountStatus: wasActive ? AccountStatus.ACTIVE : AccountStatus.SUSPENDED },
      newValue: { accountStatus: nextStatus }
    })

    const fresh = await found.ref.get()
    res.json({
      message: `Vendor ${nextStatus === AccountStatus.ACTIVE ? 'activated' : 'suspended'} successfully`,
      data: { vendor: publicVendor(fresh.data()) }
    })
  } catch (err) {
    console.error('Toggle vendor error:', err.message)
    res.status(500).json({ message: 'Failed to update vendor' })
  }
}
