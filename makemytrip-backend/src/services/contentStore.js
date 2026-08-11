import { db } from '../config/firebase.js'
import { now, toDate } from '../utils/time.js'

// Shared Firestore helpers for the CMS-style content collections (pages, FAQs,
// jobs, inquiries, media, notifications, settings).
//
// These all previously used `new PrismaClient()` against MongoDB, which is not
// running — every one of them hung for ~15s, including the public FAQ, careers,
// settings and CMS page routes. They share the same tiny CRUD surface, so the
// shape lives here rather than being repeated seven times.

export const shape = (doc) => ({ id: doc.id, ...doc.data() })

// Re-exported so existing importers keep working.
//
// This was `export { toDate } from '../utils/time.js'`, which re-exports the
// binding without introducing it into this module's own scope — so every call
// to `toDate` below threw `toDate is not defined`. It took out sorting for
// every content collection: notifications, CMS pages, FAQs, job positions and
// applications, contact inquiries and the media library all returned 500.
// The admin shell polls the unread notification count on every page, so the
// panel showed a permanent failure.
export { toDate }

const stamp = (actorId) => ({
  updatedAt: now(),
  updatedBy: actorId ?? null
})

/**
 * @param {string} collection
 * @param {object} [options]
 * @param {string} [options.sortField]  Field to sort on (default createdAt, descending).
 * @param {'asc'|'desc'} [options.sortDir]
 */
export const contentStore = (collection, { sortField = 'createdAt', sortDir = 'desc' } = {}) => {
  const sorter = (a, b) => {
    const av = a[sortField]
    const bv = b[sortField]

    // Numeric ordering fields (sortOrder) compare directly; dates go through
    // toDate so ISO strings and Timestamps order consistently.
    if (typeof av === 'number' || typeof bv === 'number') {
      return sortDir === 'asc' ? (av ?? 0) - (bv ?? 0) : (bv ?? 0) - (av ?? 0)
    }
    const at = toDate(av)?.getTime() ?? 0
    const bt = toDate(bv)?.getTime() ?? 0
    return sortDir === 'asc' ? at - bt : bt - at
  }

  const list = async ({ where = null, activeOnly = false } = {}) => {
    let query = db.collection(collection)
    if (where) query = query.where(where.field, '==', where.value)

    const snap = await query.get()

    return snap.docs
      .map(shape)
      .filter((x) => !x.isDeleted)
      .filter((x) => !activeOnly || (x.status ?? 'active') === 'active')
      .sort(sorter)
  }

  const getById = async (id) => {
    const snap = await db.collection(collection).doc(id).get()
    if (!snap.exists || snap.data().isDeleted) return null
    return shape(snap)
  }

  const findOneBy = async (field, value) => {
    const snap = await db.collection(collection).where(field, '==', value).limit(1).get()
    if (snap.empty) return null
    const doc = shape(snap.docs[0])
    return doc.isDeleted ? null : doc
  }

  const create = async (data, actorId = null) => {
    const ref = db.collection(collection).doc()
    const doc = {
      ...data,
      status: data.status ?? 'active',
      createdAt: now(),
      createdBy: actorId ?? null,
      ...stamp(actorId),
      isDeleted: false
    }
    await ref.set(doc)
    return { id: ref.id, ...doc }
  }

  const update = async (id, patch, actorId = null) => {
    const ref = db.collection(collection).doc(id)
    const snap = await ref.get()
    if (!snap.exists || snap.data().isDeleted) return null

    // Strip undefined so a partial update never blanks a stored field.
    const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
    await ref.update({ ...clean, ...stamp(actorId) })

    return shape(await ref.get())
  }

  /** Soft delete — content is recoverable and referenced elsewhere. */
  const remove = async (id, actorId = null) => {
    const ref = db.collection(collection).doc(id)
    const snap = await ref.get()
    if (!snap.exists || snap.data().isDeleted) return false

    await ref.update({ isDeleted: true, status: 'inactive', ...stamp(actorId) })
    return true
  }

  return { list, getById, findOneBy, create, update, remove, collection }
}
