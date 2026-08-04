import { db } from '../../config/firebase.js'
import { now } from '../../utils/time.js'
import { DEFAULT_TEMPLATES } from '../../config/defaultEmailTemplates.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// Templates are keyed by their `key` (booking_confirmation, otp, welcome, ...),
// so the key is the document id and every lookup is a single point read.
//
// getTemplate still falls back to the bundled defaults when a template is
// missing or inactive: transactional email must keep sending even if the CMS
// copy has not been authored yet.

const COLLECTION = 'email_templates'
const CACHE_TTL = 5 * 60 * 1000

let templateCache = {}
let cacheTimestamp = {}

const shape = (id, data) => ({ id, key: id, ...data })

export const clearCache = () => {
  templateCache = {}
  cacheTimestamp = {}
  console.log('📧 Template cache cleared')
}

export const getTemplate = async (key) => {
  try {
    if (templateCache[key] && (Date.now() - cacheTimestamp[key]) < CACHE_TTL) {
      return templateCache[key]
    }

    const snap = await db.collection(COLLECTION).doc(key).get()

    if (snap.exists && snap.data().isActive !== false && !snap.data().isDeleted) {
      const template = shape(snap.id, snap.data())
      templateCache[key] = template
      cacheTimestamp[key] = Date.now()
      console.log(`📧 Template loaded from Firestore: ${key}`)
      return template
    }

    const defaultTemplate = DEFAULT_TEMPLATES[key]
    if (defaultTemplate) {
      console.log(`📧 Using default template: ${key}`)
      return defaultTemplate
    }

    throw new Error(`Email template not found: ${key}`)
  } catch (error) {
    console.error(`Error fetching template ${key}:`, error.message)
    // A storage outage must not stop transactional mail going out.
    if (DEFAULT_TEMPLATES[key]) {
      console.warn(`Falling back to default template for ${key}`)
      return DEFAULT_TEMPLATES[key]
    }
    throw error
  }
}

export const listTemplates = async () => {
  const snap = await db.collection(COLLECTION).get()

  return snap.docs
    .map((d) => shape(d.id, d.data()))
    .filter((t) => !t.isDeleted)
    .sort((a, b) => String(a.module ?? '').localeCompare(String(b.module ?? '')) || a.key.localeCompare(b.key))
}

export const getTemplateByKey = async (key) => {
  const snap = await db.collection(COLLECTION).doc(key).get()
  if (!snap.exists || snap.data().isDeleted) return null
  return shape(snap.id, snap.data())
}

export const createTemplate = async (data) => {
  if (!data.key) throw new Error('Template key is required')

  const ref = db.collection(COLLECTION).doc(data.key)
  if ((await ref.get()).exists) {
    const err = new Error(`Template already exists: ${data.key}`)
    err.code = 'ALREADY_EXISTS'
    throw err
  }

  const doc = {
    name: data.name ?? data.key,
    module: data.module ?? 'general',
    subject: data.subject ?? '',
    htmlBody: data.htmlBody ?? '',
    variables: data.variables ?? [],
    isActive: data.isActive ?? true,
    createdAt: now(),
    updatedAt: now(),
    updatedBy: data.updatedBy ?? null,
    isDeleted: false
  }

  await ref.set(doc)
  clearCache()
  return shape(data.key, doc)
}

export const updateTemplate = async (key, data) => {
  const ref = db.collection(COLLECTION).doc(key)
  const snap = await ref.get()
  if (!snap.exists || snap.data().isDeleted) throw new Error(`Template not found: ${key}`)

  const patch = { updatedAt: now() }
  if (data.name !== undefined) patch.name = data.name
  if (data.subject !== undefined) patch.subject = data.subject
  if (data.htmlBody !== undefined) patch.htmlBody = data.htmlBody
  if (data.variables !== undefined) patch.variables = data.variables
  if (data.isActive !== undefined) patch.isActive = data.isActive
  if (data.updatedBy !== undefined) patch.updatedBy = data.updatedBy

  await ref.update(patch)
  clearCache()

  const fresh = await ref.get()
  return shape(fresh.id, fresh.data())
}

export const toggleTemplate = async (key) => {
  const ref = db.collection(COLLECTION).doc(key)
  const snap = await ref.get()
  if (!snap.exists || snap.data().isDeleted) throw new Error(`Template not found: ${key}`)

  await ref.update({
    isActive: snap.data().isActive === false,
    updatedAt: now()
  })
  clearCache()

  const fresh = await ref.get()
  return shape(fresh.id, fresh.data())
}

export const deleteTemplate = async (key) => {
  const ref = db.collection(COLLECTION).doc(key)
  const snap = await ref.get()
  if (!snap.exists || snap.data().isDeleted) throw new Error(`Template not found: ${key}`)

  // Soft delete: getTemplate then falls back to the bundled default rather
  // than failing to send.
  await ref.update({ isDeleted: true, isActive: false, updatedAt: now() })
  clearCache()
}

export const upsertTemplate = async (key, data) => {
  const ref = db.collection(COLLECTION).doc(key)

  const doc = {
    name: data.name ?? key,
    module: data.module ?? 'general',
    subject: data.subject ?? '',
    htmlBody: data.htmlBody ?? '',
    variables: data.variables ?? [],
    isActive: data.isActive ?? true,
    updatedAt: now(),
    updatedBy: data.updatedBy ?? null,
    isDeleted: false
  }

  const existing = await ref.get()
  if (!existing.exists) doc.createdAt = new Date().toISOString()

  await ref.set(doc, { merge: true })
  clearCache()

  const fresh = await ref.get()
  return shape(fresh.id, fresh.data())
}
