/**
 * §7, §25 — the vendor's driver roster.
 *
 * Drivers are the one part of a cab that is not embedded on the cab document.
 * A driver works across several vehicles and is assigned per trip, so binding
 * one to a single cab would mean duplicating the same person — and the same
 * licence expiry — for every vehicle they drive.
 *
 * Licences are verified by an admin, exactly like vehicle documents: a vendor
 * may submit a licence but may not mark it verified.
 */

import { db } from '../config/firebase.js'
import { now } from '../utils/time.js'
import { CAB_DRIVERS, VerificationStatus } from '../config/cabModel.js'
import { respondIfDatastoreDown } from '../utils/datastoreErrors.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

const str = (v) => (v === undefined || v === null ? null : String(v).trim())
const MOBILE = /^[6-9]\d{9}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validate = (body, { partial = false } = {}) => {
  const errors = {}

  if (!partial) {
    if (!str(body.name)) errors.name = 'Driver name is required'
    if (!str(body.mobile)) errors.mobile = 'Driver mobile is required'
    if (!str(body.licenseNumber)) errors.licenseNumber = 'Driving licence number is required'
    if (!str(body.licenseExpiry)) errors.licenseExpiry = 'Licence expiry date is required'
  }

  if (body.mobile !== undefined && !MOBILE.test(String(body.mobile).replace(/\D/g, '').slice(-10))) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number'
  }
  if (body.email && !EMAIL.test(String(body.email))) errors.email = 'Enter a valid email address'

  if (body.licenseExpiry) {
    const expiry = new Date(body.licenseExpiry)
    if (Number.isNaN(expiry.getTime())) {
      errors.licenseExpiry = 'Invalid expiry date'
    } else if (expiry < new Date()) {
      // Refused at entry rather than caught at assignment: a driver whose
      // licence has already lapsed can never legally take a trip, so there is
      // no point storing them as assignable.
      errors.licenseExpiry = 'This licence has already expired'
    }
  }

  const experience = Number(body.experienceYears)
  if (body.experienceYears !== undefined && (!Number.isFinite(experience) || experience < 0 || experience > 60)) {
    errors.experienceYears = 'Experience must be between 0 and 60 years'
  }

  return errors
}

const toStorage = (body) => {
  const out = {}
  if (body.name !== undefined) out.name = str(body.name)
  if (body.mobile !== undefined) out.mobile = String(body.mobile).replace(/\D/g, '').slice(-10)
  if (body.email !== undefined) out.email = str(body.email)
  if (body.photoUrl !== undefined) out.photoUrl = str(body.photoUrl)
  if (body.licenseNumber !== undefined) out.licenseNumber = str(body.licenseNumber)?.toUpperCase()
  if (body.licenseExpiry !== undefined) out.licenseExpiry = body.licenseExpiry
  if (body.experienceYears !== undefined) out.experienceYears = Number(body.experienceYears)
  if (body.languages !== undefined) {
    out.languages = Array.isArray(body.languages) ? body.languages.map(str).filter(Boolean) : []
  }
  return out
}

export const listDrivers = async (req, res) => {
  try {
    const snap = await db.collection(CAB_DRIVERS).where('vendorId', '==', req.vendorId).get()
    const drivers = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => !d.isDeleted)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))

    res.json({ success: true, data: { drivers } })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Driver list')) return
    console.error('List drivers error:', err.message)
    res.status(500).json({ success: false, message: 'Could not load drivers' })
  }
}

export const createDriver = async (req, res) => {
  try {
    const errors = validate(req.body)
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors })
    }

    // One licence, one driver. Without this the same person can be added twice
    // and assigned to two overlapping trips.
    const licenseNumber = str(req.body.licenseNumber)?.toUpperCase()
    const clash = await db.collection(CAB_DRIVERS)
      .where('vendorId', '==', req.vendorId)
      .where('licenseNumber', '==', licenseNumber)
      .limit(1)
      .get()

    if (!clash.empty && !clash.docs[0].data().isDeleted) {
      return res.status(409).json({
        success: false,
        message: 'A driver with this licence number already exists',
        errors: { licenseNumber: 'Already registered' }
      })
    }

    const ref = db.collection(CAB_DRIVERS).doc()
    const doc = {
      id: ref.id,
      vendorId: req.vendorId,
      ...toStorage(req.body),
      verificationStatus: VerificationStatus.PENDING,
      rejectionReason: null,
      isAvailable: true,
      createdAt: now(),
      updatedAt: now(),
      createdBy: req.userId ?? null,
      isDeleted: false
    }

    await ref.set(doc)

    writeAuditLog({
      req,
      action: AuditAction.LISTING_CREATED,
      entity: CAB_DRIVERS,
      entityId: ref.id,
      newValue: { name: doc.name, licenseNumber: doc.licenseNumber }
    })

    res.status(201).json({ success: true, data: { driver: doc } })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Driver creation')) return
    console.error('Create driver error:', err.message)
    res.status(500).json({ success: false, message: 'Could not create this driver' })
  }
}

const loadOwned = async (req) => {
  const snap = await db.collection(CAB_DRIVERS).doc(req.params.id).get()
  if (!snap.exists) return null
  const data = snap.data()
  if (data.isDeleted || data.vendorId !== req.vendorId) return null
  return { ref: snap.ref, data }
}

export const updateDriver = async (req, res) => {
  try {
    const found = await loadOwned(req)
    if (!found) return res.status(404).json({ success: false, message: 'Driver not found' })

    const errors = validate(req.body, { partial: true })
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors })
    }

    const patch = { ...toStorage(req.body), updatedAt: now(), updatedBy: req.userId ?? null }

    // Editing the licence invalidates whatever the admin previously checked.
    if (patch.licenseNumber || patch.licenseExpiry) {
      patch.verificationStatus = VerificationStatus.PENDING
      patch.rejectionReason = null
    }

    await found.ref.update(patch)
    const fresh = await found.ref.get()
    res.json({ success: true, data: { driver: { id: fresh.id, ...fresh.data() } } })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Driver update')) return
    console.error('Update driver error:', err.message)
    res.status(500).json({ success: false, message: 'Could not update this driver' })
  }
}

export const deleteDriver = async (req, res) => {
  try {
    const found = await loadOwned(req)
    if (!found) return res.status(404).json({ success: false, message: 'Driver not found' })

    await found.ref.update({
      isDeleted: true,
      isAvailable: false,
      updatedAt: now(),
      updatedBy: req.userId ?? null
    })

    res.json({ success: true, message: 'Driver removed' })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Driver removal')) return
    console.error('Delete driver error:', err.message)
    res.status(500).json({ success: false, message: 'Could not remove this driver' })
  }
}
