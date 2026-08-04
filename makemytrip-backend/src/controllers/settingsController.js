import { db } from '../config/firebase.js'
import { now } from '../utils/time.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// getSettings is public — App.jsx loads it on boot — and used to hang for ~15s
// against an unreachable MongoDB, delaying first paint sitewide.
//
// There is exactly one settings record, so it lives at a fixed document id
// rather than being discovered with findFirst().

const DOC = db.collection('settings').doc('site')

const DEFAULTS = {
  primaryColor: '#003580',
  secondaryColor: '#1a73e8',
  accentColor: '#e63946',
  footerBg: null,
  headerBg: null,
  logo: null,
  favicon: null,
  announcementBar: null,
  announcementActive: false
}

const EDITABLE = Object.keys(DEFAULTS)

export const getSettings = async (_req, res) => {
  try {
    const snap = await DOC.get()

    // Seed on first read so the admin form always has a record to edit.
    if (!snap.exists) {
      const doc = { ...DEFAULTS, createdAt: now(), updatedAt: now() }
      await DOC.set(doc)
      return res.json({ message: 'Settings fetched', data: { id: 'site', ...doc } })
    }

    res.json({ message: 'Settings fetched', data: { id: snap.id, ...DEFAULTS, ...snap.data() } })
  } catch (error) {
    console.error('Error fetching settings:', error.message)
    res.status(500).json({ message: 'Failed to fetch settings' })
  }
}

export const updateSettings = async (req, res) => {
  try {
    // Only known keys are writable — this endpoint feeds sitewide theming.
    const patch = Object.fromEntries(
      EDITABLE.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]])
    )

    if (!Object.keys(patch).length) {
      return res.status(400).json({ message: 'No recognised settings supplied' })
    }

    patch.announcementActive = patch.announcementActive === undefined
      ? undefined
      : Boolean(patch.announcementActive)

    const before = await DOC.get()

    await DOC.set(
      { ...patch, updatedAt: now(), updatedBy: req.adminId ?? null },
      { merge: true }
    )

    writeAuditLog({
      req,
      action: AuditAction.SETTINGS_CHANGED,
      entity: 'settings',
      entityId: 'site',
      oldValue: before.exists ? Object.fromEntries(Object.keys(patch).map((k) => [k, before.data()[k]])) : null,
      newValue: patch
    })

    const fresh = await DOC.get()
    res.json({ message: 'Settings updated', data: { id: fresh.id, ...DEFAULTS, ...fresh.data() } })
  } catch (error) {
    console.error('Error updating settings:', error.message)
    res.status(500).json({ message: 'Failed to update settings' })
  }
}
