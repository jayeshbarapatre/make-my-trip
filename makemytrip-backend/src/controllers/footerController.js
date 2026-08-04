import { db } from '../config/firebase.js'
import { now } from '../utils/time.js'
import { sanitizeText } from '../utils/sanitize.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// GET /cms/footer is public and runs on every page render. On Prisma it hung
// for 20+ seconds against an unreachable MongoDB, blocking the footer sitewide.
//
// Links are stored on their parent section rather than in their own collection:
// the footer is always read whole, so one document per section avoids a second
// query per section on every page load.

const SECTIONS = 'footer_sections'

const bySortOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)

const shapeSection = (doc, { activeOnly = false } = {}) => {
  const links = Array.isArray(doc.links) ? doc.links : []
  return {
    id: doc.id,
    title: doc.title,
    sortOrder: doc.sortOrder ?? 0,
    status: doc.status ?? 'active',
    links: links
      .filter((l) => !l.isDeleted && (!activeOnly || (l.status ?? 'active') === 'active'))
      .sort(bySortOrder)
  }
}

const loadSections = async ({ activeOnly = false } = {}) => {
  const snap = await db.collection(SECTIONS).get()

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => !s.isDeleted && (!activeOnly || (s.status ?? 'active') === 'active'))
    .sort(bySortOrder)
    .map((s) => shapeSection(s, { activeOnly }))
}

export const getFooter = async (_req, res) => {
  try {
    res.json({ message: 'Footer fetched', data: await loadSections({ activeOnly: true }) })
  } catch (error) {
    console.error('Error fetching footer:', error.message)
    res.status(500).json({ message: 'Failed to fetch footer' })
  }
}

export const listSections = async (_req, res) => {
  try {
    res.json({ message: 'Sections fetched', data: await loadSections() })
  } catch (error) {
    console.error('Error fetching sections:', error.message)
    res.status(500).json({ message: 'Failed to fetch sections' })
  }
}

export const createSection = async (req, res) => {
  try {
    const title = sanitizeText(req.body?.title, 120)
    if (!title) return res.status(400).json({ message: 'Title is required' })

    const ref = db.collection(SECTIONS).doc()
    const doc = {
      title,
      sortOrder: Number(req.body.sortOrder) || 0,
      status: req.body.status === 'inactive' ? 'inactive' : 'active',
      links: [],
      createdAt: now(),
      updatedAt: now(),
      createdBy: req.adminId ?? null,
      updatedBy: req.adminId ?? null,
      isDeleted: false
    }

    await ref.set(doc)

    writeAuditLog({ req, action: AuditAction.SETTINGS_CHANGED, entity: SECTIONS, entityId: ref.id, newValue: { title } })

    res.status(201).json({ message: 'Section created', data: { id: ref.id, ...doc } })
  } catch (error) {
    console.error('Error creating section:', error.message)
    res.status(500).json({ message: 'Failed to create section' })
  }
}

const loadSection = async (id) => {
  const snap = await db.collection(SECTIONS).doc(id).get()
  if (!snap.exists || snap.data().isDeleted) return null
  return { ref: snap.ref, data: snap.data() }
}

export const updateSection = async (req, res) => {
  try {
    const found = await loadSection(req.params.id)
    if (!found) return res.status(404).json({ message: 'Section not found' })

    const patch = { updatedAt: now(), updatedBy: req.adminId ?? null }

    if (req.body.title !== undefined) {
      const title = sanitizeText(req.body.title, 120)
      if (!title) return res.status(400).json({ message: 'Title cannot be empty' })
      patch.title = title
    }
    if (req.body.sortOrder !== undefined) patch.sortOrder = Number(req.body.sortOrder) || 0
    if (req.body.status !== undefined) patch.status = req.body.status === 'inactive' ? 'inactive' : 'active'

    await found.ref.update(patch)

    writeAuditLog({ req, action: AuditAction.SETTINGS_CHANGED, entity: SECTIONS, entityId: req.params.id, newValue: patch })

    const fresh = await found.ref.get()
    res.json({ message: 'Section updated', data: shapeSection({ id: fresh.id, ...fresh.data() }) })
  } catch (error) {
    console.error('Error updating section:', error.message)
    res.status(500).json({ message: 'Failed to update section' })
  }
}

export const deleteSection = async (req, res) => {
  try {
    const found = await loadSection(req.params.id)
    if (!found) return res.status(404).json({ message: 'Section not found' })

    // Soft delete so a mis-click does not lose the section's links.
    await found.ref.update({
      isDeleted: true,
      status: 'inactive',
      updatedAt: now(),
      updatedBy: req.adminId ?? null
    })

    writeAuditLog({ req, action: AuditAction.SETTINGS_CHANGED, entity: SECTIONS, entityId: req.params.id, newValue: { isDeleted: true } })

    res.json({ message: 'Section deleted' })
  } catch (error) {
    console.error('Error deleting section:', error.message)
    res.status(500).json({ message: 'Failed to delete section' })
  }
}

// ── Links live inside their parent section document ──

const nextLinkId = () => `lnk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

export const createLink = async (req, res) => {
  try {
    const sectionId = req.body?.sectionId ?? req.params?.sectionId
    // `title` is the field name the existing admin UI sends.
    const title = sanitizeText(req.body?.title ?? req.body?.label, 120)

    if (!sectionId || !title) {
      return res.status(400).json({ message: 'Section ID and title are required' })
    }

    const found = await loadSection(sectionId)
    if (!found) return res.status(404).json({ message: 'Section not found' })

    const link = {
      id: nextLinkId(),
      title,
      url: sanitizeText(req.body?.url, 500) || null,
      target: req.body?.target === '_blank' ? '_blank' : '_self',
      sortOrder: Number(req.body?.sortOrder) || 0,
      status: req.body?.status === 'inactive' ? 'inactive' : 'active',
      isDeleted: false,
      createdAt: now()
    }

    await found.ref.update({
      links: [...(found.data.links ?? []), link],
      updatedAt: now(),
      updatedBy: req.adminId ?? null
    })

    res.status(201).json({ message: 'Link created', data: link })
  } catch (error) {
    console.error('Error creating link:', error.message)
    res.status(500).json({ message: 'Failed to create link' })
  }
}

/** Finds the section document holding a given link id. */
const findSectionForLink = async (linkId) => {
  const snap = await db.collection(SECTIONS).get()
  for (const doc of snap.docs) {
    const data = doc.data()
    if (data.isDeleted) continue
    if ((data.links ?? []).some((l) => l.id === linkId)) return { ref: doc.ref, data }
  }
  return null
}

export const updateLink = async (req, res) => {
  try {
    const found = await findSectionForLink(req.params.id)
    if (!found) return res.status(404).json({ message: 'Link not found' })

    const links = (found.data.links ?? []).map((l) => {
      if (l.id !== req.params.id) return l

      const next = { ...l }
      if (req.body.title !== undefined || req.body.label !== undefined) {
        next.title = sanitizeText(req.body.title ?? req.body.label, 120) || l.title
      }
      if (req.body.url !== undefined) next.url = sanitizeText(req.body.url, 500) || null
      if (req.body.target !== undefined) next.target = req.body.target === '_blank' ? '_blank' : '_self'
      if (req.body.sortOrder !== undefined) next.sortOrder = Number(req.body.sortOrder) || 0
      if (req.body.status !== undefined) next.status = req.body.status === 'inactive' ? 'inactive' : 'active'
      return next
    })

    await found.ref.update({
      links,
      updatedAt: now(),
      updatedBy: req.adminId ?? null
    })

    res.json({ message: 'Link updated', data: links.find((l) => l.id === req.params.id) })
  } catch (error) {
    console.error('Error updating link:', error.message)
    res.status(500).json({ message: 'Failed to update link' })
  }
}

export const deleteLink = async (req, res) => {
  try {
    const found = await findSectionForLink(req.params.id)
    if (!found) return res.status(404).json({ message: 'Link not found' })

    await found.ref.update({
      links: (found.data.links ?? []).filter((l) => l.id !== req.params.id),
      updatedAt: now(),
      updatedBy: req.adminId ?? null
    })

    res.json({ message: 'Link deleted' })
  } catch (error) {
    console.error('Error deleting link:', error.message)
    res.status(500).json({ message: 'Failed to delete link' })
  }
}
