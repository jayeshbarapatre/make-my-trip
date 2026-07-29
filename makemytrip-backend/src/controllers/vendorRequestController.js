import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { Role, AccountStatus } from '../config/roles.js'
import { sanitizeText } from '../utils/sanitize.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

// Vendor onboarding: pending → approved → active, or rejected / changes_requested.
// Approval is the only path that grants the vendor role, and it happens here in
// a transaction alongside the user document so the two can never disagree.

export const RequestStatus = {
  PENDING: 'pending',
  CHANGES_REQUESTED: 'changes_requested',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

const TRANSITIONS = {
  [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.CHANGES_REQUESTED],
  [RequestStatus.CHANGES_REQUESTED]: [RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.APPROVED]: [],
  [RequestStatus.REJECTED]: []
}

// One open application per user.
const requestDocId = (userId) => `vr_${userId}`

export const applyAsVendor = async (req, res) => {
  try {
    const uid = req.principal.uid
    const businessName = sanitizeText(req.body?.businessName, 160)
    const contactPhone = sanitizeText(req.body?.contactPhone, 20)

    if (!businessName) {
      return res.status(400).json({ success: false, message: 'A business name is required' })
    }

    if (req.principal.role === Role.VENDOR) {
      return res.status(409).json({ success: false, message: 'You are already registered as a vendor' })
    }

    const ref = db.collection('vendor_requests').doc(requestDocId(uid))

    const saved = await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref)

      if (existing.exists) {
        const current = existing.data()
        // Re-applying is only meaningful when we asked for changes.
        if (current.status === RequestStatus.PENDING) {
          throw Object.assign(new Error('Your application is already under review'), { code: 'PENDING' })
        }
        if (current.status === RequestStatus.APPROVED) {
          throw Object.assign(new Error('Your application has already been approved'), { code: 'APPROVED' })
        }
        if (current.status === RequestStatus.REJECTED) {
          throw Object.assign(new Error('Your application was rejected and cannot be resubmitted'), { code: 'REJECTED' })
        }
      }

      const doc = {
        userId: uid,
        userEmail: req.principal.email,
        businessName,
        contactPhone: contactPhone || null,
        businessType: sanitizeText(req.body?.businessType, 60) || null,
        gstNumber: sanitizeText(req.body?.gstNumber, 32) || null,
        address: sanitizeText(req.body?.address, 400) || null,
        status: RequestStatus.PENDING,
        rejectionReason: null,
        changeRequestNote: null,
        history: FieldValue.arrayUnion({
          status: RequestStatus.PENDING,
          at: new Date().toISOString(),
          by: uid,
          note: existing.exists ? 'Resubmitted after requested changes' : 'Application submitted'
        }),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
        isDeleted: false,
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp(), createdBy: uid })
      }

      tx.set(ref, doc, { merge: true })
      return doc
    })

    writeAuditLog({
      req,
      action: 'vendor_request_submitted',
      entity: 'vendor_requests',
      entityId: requestDocId(uid),
      newValue: { businessName, status: RequestStatus.PENDING }
    })

    res.status(201).json({ success: true, data: { id: requestDocId(uid), ...saved } })
  } catch (err) {
    if (['PENDING', 'APPROVED', 'REJECTED'].includes(err.code)) {
      return res.status(409).json({ success: false, message: err.message })
    }
    console.error('Vendor application failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not submit your application' })
  }
}

export const getMyVendorRequest = async (req, res) => {
  try {
    const snap = await db.collection('vendor_requests').doc(requestDocId(req.principal.uid)).get()
    if (!snap.exists) return res.status(404).json({ success: false, message: 'No application found' })
    res.json({ success: true, data: { id: snap.id, ...snap.data() } })
  } catch (err) {
    console.error('Get vendor request failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load your application' })
  }
}

// ── Admin ──

export const listVendorRequests = async (req, res) => {
  try {
    const { status } = req.query
    let query = db.collection('vendor_requests')
    if (status) query = query.where('status', '==', status)

    const snap = await query.limit(500).get()
    res.json({
      success: true,
      data: snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
    })
  } catch (err) {
    console.error('List vendor requests failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load applications' })
  }
}

const DECISIONS = {
  approve: RequestStatus.APPROVED,
  reject: RequestStatus.REJECTED,
  'request-changes': RequestStatus.CHANGES_REQUESTED
}

export const decideVendorRequest = async (req, res) => {
  const target = DECISIONS[req.params.decision]
  const note = sanitizeText(req.body?.note, 1000)

  if (!target) {
    return res.status(400).json({ success: false, message: `Unknown decision "${req.params.decision}"` })
  }
  // A rejection or a change request is shown to the applicant, so it must explain itself.
  if (target !== RequestStatus.APPROVED && !note) {
    return res.status(400).json({ success: false, message: 'A reason is required for this decision' })
  }

  const ref = db.collection('vendor_requests').doc(req.params.id)

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      if (!snap.exists) throw Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' })

      const current = snap.data()
      if (!TRANSITIONS[current.status]?.includes(target)) {
        throw Object.assign(
          new Error(`Cannot move an application from ${current.status} to ${target}`),
          { code: 'INVALID_TRANSITION' }
        )
      }

      // Granting the role and recording the decision must be one atomic step —
      // a half-applied approval leaves a vendor who cannot log in as one, or a
      // vendor role with no approved application behind it.
      let vendorId = current.vendorId ?? null
      if (target === RequestStatus.APPROVED) {
        vendorId = vendorId ?? `VENDOR-${current.userId}`

        const userQuery = await tx.get(
          db.collection('users').where('id', '==', current.userId).limit(1)
        )
        if (userQuery.empty) {
          throw Object.assign(new Error('The applicant account no longer exists'), { code: 'NOT_FOUND' })
        }

        tx.update(userQuery.docs[0].ref, {
          role: Role.VENDOR,
          vendorId,
          accountStatus: AccountStatus.ACTIVE,
          updatedAt: new Date().toISOString(),
          updatedBy: req.principal.uid
        })
      }

      tx.update(ref, {
        status: target,
        vendorId,
        rejectionReason: target === RequestStatus.REJECTED ? note : null,
        changeRequestNote: target === RequestStatus.CHANGES_REQUESTED ? note : null,
        decidedAt: FieldValue.serverTimestamp(),
        decidedBy: req.principal.uid,
        history: FieldValue.arrayUnion({
          status: target,
          at: new Date().toISOString(),
          by: req.principal.uid,
          note: note || 'Approved'
        }),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: req.principal.uid
      })

      return { ...current, status: target, vendorId }
    })

    writeAuditLog({
      req,
      action: target === RequestStatus.APPROVED ? AuditAction.VENDOR_APPROVED : 'vendor_request_decided',
      entity: 'vendor_requests',
      entityId: req.params.id,
      oldValue: { status: RequestStatus.PENDING },
      newValue: { status: target, note: note || null, vendorId: result.vendorId }
    })

    res.json({ success: true, data: { id: req.params.id, ...result } })
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: err.message })
    if (err.code === 'INVALID_TRANSITION') return res.status(409).json({ success: false, message: err.message })
    console.error('Vendor decision failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not record the decision' })
  }
}
