import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../../config/firebase.js'
import { writeAuditLog, AuditAction } from '../../services/auditLog.js'

// Vendor-scoped CRUD over a Firestore collection.
//
// Every read and write is constrained to req.vendorId, which vendorAuth derives
// from the stored user document. A vendor can never reach another vendor's rows
// because the tenant id is never taken from the request body or params.
//
// Vendor listings also carry an approval lifecycle: DRAFT -> PENDING_APPROVAL ->
// APPROVED / REJECTED. Only APPROVED listings are visible to customers, so
// `isActive` alone is not enough to publish.

export const ListingStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
}

const toDate = (value) => {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export const createVendorCrud = ({
  collection,
  label,
  listKey,
  validate = () => ({}),
  toStorage = (b) => b,
  toClient = (d) => d,
  uniqueField = null
}) => {
  const key = listKey ?? collection

  /** Loads a document only if it belongs to the calling vendor. */
  const loadOwned = async (req) => {
    const snap = await db.collection(collection).doc(req.params.id).get()
    if (!snap.exists) return null

    const data = snap.data()
    if (data.isDeleted) return null
    // 404 rather than 403: confirming existence would leak that another vendor
    // holds this id.
    if (data.vendorId !== req.vendorId) return null

    return { ref: snap.ref, data }
  }

  const findUniqueClash = async (value, exceptId = null) => {
    if (!uniqueField || !value) return null
    const snap = await db.collection(collection).where(uniqueField, '==', value).limit(2).get()
    return snap.docs.find((d) => d.id !== exceptId) ?? null
  }

  const list = async (req, res) => {
    try {
      const snap = await db.collection(collection).where('vendorId', '==', req.vendorId).get()

      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => !x.isDeleted)
        .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
        .map(toClient)

      res.status(200).json({ success: true, data: { [key]: items } })
    } catch (err) {
      console.error(`Vendor list ${collection} error:`, err.message)
      res.status(500).json({ success: false, message: `Failed to load ${key}` })
    }
  }

  const create = async (req, res) => {
    try {
      const errors = validate(req.body)
      if (Object.keys(errors).length) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors })
      }

      const payload = toStorage(req.body)

      if (uniqueField) {
        const clash = await findUniqueClash(payload[uniqueField])
        if (clash) {
          return res.status(409).json({ success: false, message: `That ${label.toLowerCase()} already exists` })
        }
      }

      const ref = db.collection(collection).doc()
      const doc = {
        ...payload,
        vendorId: req.vendorId,
        // New inventory starts as a draft and is invisible to customers until
        // an admin approves it.
        listingStatus: ListingStatus.DRAFT,
        rejectionReason: null,
        isActive: false,
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
        entity: collection,
        entityId: ref.id,
        newValue: { vendorId: req.vendorId, listingStatus: doc.listingStatus }
      })

      res.status(201).json({ success: true, data: toClient({ id: ref.id, ...doc }) })
    } catch (err) {
      console.error(`Vendor create ${collection} error:`, err.message)
      res.status(500).json({ success: false, message: `Failed to create ${label.toLowerCase()}` })
    }
  }

  const getById = async (req, res) => {
    try {
      const found = await loadOwned(req)
      if (!found) return res.status(404).json({ success: false, message: `${label} not found` })
      res.json({ success: true, data: toClient({ id: req.params.id, ...found.data }) })
    } catch (err) {
      console.error(`Vendor get ${collection} error:`, err.message)
      res.status(500).json({ success: false, message: `Failed to load ${label.toLowerCase()}` })
    }
  }

  const update = async (req, res) => {
    try {
      const found = await loadOwned(req)
      if (!found) return res.status(404).json({ success: false, message: `${label} not found` })

      const errors = validate({ ...found.data, ...req.body }, { partial: true })
      if (Object.keys(errors).length) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors })
      }

      // A vendor may never set these directly — they are the approval state and
      // the tenant boundary.
      const {
        id: _id, vendorId: _v, listingStatus: _ls, rejectionReason: _rr, approvedAt: _aa,
        approvedBy: _ab, createdAt: _c, createdBy: _cb, isDeleted: _d, isActive: _ia, ...rest
      } = req.body

      const payload = toStorage(rest, { partial: true })

      if (uniqueField && payload[uniqueField]) {
        const clash = await findUniqueClash(payload[uniqueField], req.params.id)
        if (clash) {
          return res.status(409).json({ success: false, message: `That ${label.toLowerCase()} already exists` })
        }
      }

      const patch = {
        ...payload,
        updatedAt: new Date().toISOString(),
        updatedBy: req.principal?.uid ?? null
      }

      // Editing published inventory sends it back for re-approval — otherwise a
      // vendor could get a clean listing approved and then change the price.
      if (found.data.listingStatus === ListingStatus.APPROVED) {
        patch.listingStatus = ListingStatus.PENDING_APPROVAL
        patch.isActive = false
        patch.submittedAt = new Date().toISOString()
        patch.approvedAt = null
        patch.approvedBy = null
      } else if (found.data.listingStatus === ListingStatus.REJECTED) {
        // Acting on the feedback returns it to draft.
        patch.listingStatus = ListingStatus.DRAFT
        patch.rejectionReason = null
      }

      await found.ref.update(patch)

      writeAuditLog({
        req,
        action: AuditAction.LISTING_UPDATED,
        entity: collection,
        entityId: req.params.id,
        oldValue: { listingStatus: found.data.listingStatus },
        newValue: { listingStatus: patch.listingStatus ?? found.data.listingStatus, fields: Object.keys(payload) }
      })

      const fresh = await found.ref.get()
      res.json({ success: true, data: toClient({ id: fresh.id, ...fresh.data() }) })
    } catch (err) {
      console.error(`Vendor update ${collection} error:`, err.message)
      res.status(500).json({ success: false, message: `Failed to update ${label.toLowerCase()}` })
    }
  }

  const remove = async (req, res) => {
    try {
      const found = await loadOwned(req)
      if (!found) return res.status(404).json({ success: false, message: `${label} not found` })

      // Soft delete: bookings reference this inventory.
      await found.ref.update({
        isDeleted: true,
        isActive: false,
        deletedAt: FieldValue.serverTimestamp(),
        updatedBy: req.principal?.uid ?? null
      })

      writeAuditLog({
        req,
        action: AuditAction.LISTING_DELETED,
        entity: collection,
        entityId: req.params.id,
        oldValue: { vendorId: req.vendorId }
      })

      res.json({ success: true, message: `${label} deleted` })
    } catch (err) {
      console.error(`Vendor delete ${collection} error:`, err.message)
      res.status(500).json({ success: false, message: `Failed to delete ${label.toLowerCase()}` })
    }
  }

  const submitForApproval = async (req, res) => {
    try {
      const found = await loadOwned(req)
      if (!found) return res.status(404).json({ success: false, message: `${label} not found` })

      const status = found.data.listingStatus ?? ListingStatus.DRAFT
      if (status !== ListingStatus.DRAFT && status !== ListingStatus.REJECTED) {
        return res.status(400).json({
          success: false,
          message: `Only draft or rejected ${key} can be submitted for approval`
        })
      }

      await found.ref.update({
        listingStatus: ListingStatus.PENDING_APPROVAL,
        submittedAt: new Date().toISOString(),
        rejectionReason: null,
        updatedAt: new Date().toISOString(),
        updatedBy: req.principal?.uid ?? null
      })

      writeAuditLog({
        req,
        action: AuditAction.LISTING_UPDATED,
        entity: collection,
        entityId: req.params.id,
        oldValue: { listingStatus: status },
        newValue: { listingStatus: ListingStatus.PENDING_APPROVAL }
      })

      const fresh = await found.ref.get()
      res.json({
        success: true,
        data: toClient({ id: fresh.id, ...fresh.data() }),
        message: `${label} submitted for approval`
      })
    } catch (err) {
      console.error(`Vendor submit ${collection} error:`, err.message)
      res.status(500).json({ success: false, message: `Failed to submit ${label.toLowerCase()}` })
    }
  }

  const toggleStatus = async (req, res) => {
    try {
      const found = await loadOwned(req)
      if (!found) return res.status(404).json({ success: false, message: `${label} not found` })

      // Only approved inventory can be switched on — otherwise this would be a
      // way to publish without review.
      if (found.data.listingStatus !== ListingStatus.APPROVED) {
        return res.status(400).json({
          success: false,
          message: `Only approved ${key} can be activated. Current status: ${found.data.listingStatus}`
        })
      }

      const nextActive = found.data.isActive === false
      await found.ref.update({
        isActive: nextActive,
        updatedAt: new Date().toISOString(),
        updatedBy: req.principal?.uid ?? null
      })

      const fresh = await found.ref.get()
      res.json({
        success: true,
        data: toClient({ id: fresh.id, ...fresh.data() }),
        message: `${label} ${nextActive ? 'activated' : 'deactivated'}`
      })
    } catch (err) {
      console.error(`Vendor toggle ${collection} error:`, err.message)
      res.status(500).json({ success: false, message: `Failed to update ${label.toLowerCase()}` })
    }
  }

  return { list, create, getById, update, remove, submitForApproval, toggleStatus, loadOwned }
}
