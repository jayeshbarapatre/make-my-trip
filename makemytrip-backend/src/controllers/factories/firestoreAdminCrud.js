import { FieldValue } from 'firebase-admin/firestore'
import { routeIndexFields } from '../../services/inventorySearch.js'
import { db } from '../../config/firebase.js'
import { now, toDate } from '../../utils/time.js'
import { writeAuditLog, AuditAction } from '../../services/auditLog.js'

// Shared admin CRUD over a Firestore collection.
//
// Flights, hotels, buses, cabs and trains previously had five near-identical
// Prisma controllers. They differ only in validation and in how the admin form
// shape maps to the stored shape, so those two pieces are injected and the
// rest is shared.
//
// Storage shape matters: the public search controllers read these same
// collections, so anything created here must be written in the shape search
// expects or it simply will not appear on the site.


/**
 * @param {object} config
 * @param {string} config.collection            Firestore collection name.
 * @param {string} config.label                 Human name used in messages.
 * @param {(body:object)=>object} [config.validate]     Returns a field->message map.
 * @param {(body:object)=>object} [config.toStorage]    Admin form shape -> stored shape.
 * @param {(doc:object)=>object} [config.toClient]      Stored shape -> admin form shape.
 * @param {string} [config.uniqueField]         Field that must stay unique (e.g. flightNumber).
 */
export const createAdminCrud = ({
  collection,
  label,
  validate = () => ({}),
  toStorage = (b) => b,
  toClient = (d) => d,
  uniqueField = null
}) => {
  const listKey = `${collection}`

  const findUnique = async (value, exceptDocId = null) => {
    if (!uniqueField || !value) return null
    const snap = await db.collection(collection).where(uniqueField, '==', value).limit(2).get()
    const clash = snap.docs.find((d) => d.id !== exceptDocId)
    return clash ?? null
  }

  const create = async (req, res) => {
    try {
      const errors = validate(req.body)
      if (Object.keys(errors).length) {
        return res.status(400).json({ message: 'Validation failed', errors })
      }

      const payload = toStorage(req.body)

      if (uniqueField) {
        const clash = await findUnique(payload[uniqueField])
        if (clash) {
          return res.status(409).json({ message: `That ${label.toLowerCase()} already exists` })
        }
      }

      const ref = db.collection(collection).doc()
      const doc = {
        ...payload,
        // Denormalised canonical route/city, so inventory created here is
        // reachable by the indexed search immediately rather than only after
        // the next backfill run.
        ...routeIndexFields(collection, payload),
        isActive: payload.isActive !== false,
        createdAt: now(),
        updatedAt: now(),
        createdBy: req.adminId ?? null,
        updatedBy: req.adminId ?? null,
        isDeleted: false
      }

      await ref.set(doc)

      writeAuditLog({
        req,
        action: AuditAction.LISTING_CREATED,
        entity: collection,
        entityId: ref.id,
        newValue: { [uniqueField ?? 'id']: payload[uniqueField] ?? ref.id }
      })

      res.status(201).json({
        message: `${label} created successfully`,
        data: { [label.toLowerCase()]: toClient({ id: ref.id, ...doc }) }
      })
    } catch (err) {
      console.error(`Create ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to create ${label.toLowerCase()}` })
    }
  }

  const list = async (_req, res) => {
    try {
      const snap = await db.collection(collection).get()

      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((x) => !x.isDeleted)
        .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
        .map(toClient)

      res.json({ data: { [listKey]: items, pagination: { total: items.length, page: 1 } } })
    } catch (err) {
      console.error(`List ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to load ${listKey}` })
    }
  }

  const getById = async (req, res) => {
    try {
      const snap = await db.collection(collection).doc(req.params.id).get()
      if (!snap.exists || snap.data().isDeleted) {
        return res.status(404).json({ message: `${label} not found` })
      }
      res.json({ data: { [label.toLowerCase()]: toClient({ id: snap.id, ...snap.data() }) } })
    } catch (err) {
      console.error(`Get ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to load ${label.toLowerCase()}` })
    }
  }

  const update = async (req, res) => {
    try {
      const ref = db.collection(collection).doc(req.params.id)
      const snap = await ref.get()
      if (!snap.exists || snap.data().isDeleted) {
        return res.status(404).json({ message: `${label} not found` })
      }

      const errors = validate({ ...snap.data(), ...req.body }, { partial: true })
      if (Object.keys(errors).length) {
        return res.status(400).json({ message: 'Validation failed', errors })
      }

      // Never let the client rewrite identity or audit fields.
      const { id: _id, createdAt: _c, updatedAt: _u, createdBy: _cb, isDeleted: _d, ...rest } = req.body
      const payload = toStorage(rest, { partial: true })
      // Re-derive the canonical route when an edit changes from/to/city.
      // Merged over the stored document so a partial update that touches only
      // `to` still recomputes both fields from consistent values.
      Object.assign(payload, routeIndexFields(collection, { ...snap.data(), ...payload }))

      if (uniqueField && payload[uniqueField]) {
        const clash = await findUnique(payload[uniqueField], req.params.id)
        if (clash) {
          return res.status(409).json({ message: `That ${label.toLowerCase()} already exists` })
        }
      }

      await ref.update({
        ...payload,
        updatedAt: now(),
        updatedBy: req.adminId ?? null
      })

      writeAuditLog({
        req,
        action: AuditAction.LISTING_UPDATED,
        entity: collection,
        entityId: req.params.id,
        newValue: { fields: Object.keys(payload) }
      })

      const fresh = await ref.get()
      res.json({
        message: `${label} updated successfully`,
        data: { [label.toLowerCase()]: toClient({ id: fresh.id, ...fresh.data() }) }
      })
    } catch (err) {
      console.error(`Update ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to update ${label.toLowerCase()}` })
    }
  }

  const remove = async (req, res) => {
    try {
      const ref = db.collection(collection).doc(req.params.id)
      const snap = await ref.get()
      if (!snap.exists || snap.data().isDeleted) {
        return res.status(404).json({ message: `${label} not found` })
      }

      // Soft delete: existing bookings reference this inventory item, and a
      // hard delete would leave those bookings pointing at nothing.
      await ref.update({
        isDeleted: true,
        isActive: false,
        deletedAt: FieldValue.serverTimestamp(),
        updatedBy: req.adminId ?? null
      })

      writeAuditLog({
        req,
        action: AuditAction.LISTING_DELETED,
        entity: collection,
        entityId: req.params.id
      })

      res.json({ message: `${label} deleted successfully` })
    } catch (err) {
      console.error(`Delete ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to delete ${label.toLowerCase()}` })
    }
  }

  const toggleStatus = async (req, res) => {
    try {
      const ref = db.collection(collection).doc(req.params.id)
      const snap = await ref.get()
      if (!snap.exists || snap.data().isDeleted) {
        return res.status(404).json({ message: `${label} not found` })
      }

      const nextActive = snap.data().isActive === false
      await ref.update({
        isActive: nextActive,
        updatedAt: now(),
        updatedBy: req.adminId ?? null
      })

      writeAuditLog({
        req,
        action: AuditAction.LISTING_UPDATED,
        entity: collection,
        entityId: req.params.id,
        oldValue: { isActive: !nextActive },
        newValue: { isActive: nextActive }
      })

      const fresh = await ref.get()
      res.json({
        message: `${label} ${nextActive ? 'activated' : 'deactivated'}`,
        data: { [label.toLowerCase()]: toClient({ id: fresh.id, ...fresh.data() }) }
      })
    } catch (err) {
      console.error(`Toggle ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to update ${label.toLowerCase()}` })
    }
  }

  return { create, list, getById, update, remove, toggleStatus }
}
