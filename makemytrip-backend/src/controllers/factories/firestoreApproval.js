import { db } from '../../config/firebase.js'
import { now, toDate } from '../../utils/time.js'
import { ListingStatus } from './firestoreVendorCrud.js'
import { writeAuditLog, AuditAction } from '../../services/auditLog.js'

// Admin approval queue for vendor-submitted inventory.
//
// Approval is the only thing that makes a listing visible to customers, so it
// is the boundary worth guarding: only PENDING_APPROVAL rows can be decided,
// and a rejection must carry a reason the vendor will read.


// Vendors live in `users`; attach a light profile so the queue shows who
// submitted each listing without an N+1 lookup.
const loadVendorProfiles = async (vendorIds) => {
  const ids = [...new Set(vendorIds.filter(Boolean))]
  if (!ids.length) return new Map()

  const snap = await db.collection('users').where('role', '==', 'vendor').get()
  const byVendorId = new Map()

  for (const doc of snap.docs) {
    const u = doc.data()
    if (u.vendorId && ids.includes(u.vendorId)) {
      byVendorId.set(u.vendorId, { id: u.id, name: u.name ?? null, email: u.email ?? null, vendorId: u.vendorId })
    }
  }

  return byVendorId
}

export const createApprovalController = ({ collection, label, listKey }) => {
  const key = listKey ?? collection

  const listPending = async (_req, res) => {
    try {
      const snap = await db
        .collection(collection)
        .where('listingStatus', '==', ListingStatus.PENDING_APPROVAL)
        .get()

      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => !x.isDeleted)
      const vendors = await loadVendorProfiles(rows.map((r) => r.vendorId))

      // Oldest submission first — the queue should be worked in order.
      const items = rows
        .sort((a, b) => (toDate(a.submittedAt)?.getTime() ?? 0) - (toDate(b.submittedAt)?.getTime() ?? 0))
        .map((r) => ({ ...r, vendor: vendors.get(r.vendorId) ?? null }))

      res.json({ data: { [key]: items } })
    } catch (err) {
      console.error(`List pending ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to load pending ${key}` })
    }
  }

  const decide = (target) => async (req, res) => {
    try {
      const reason = req.body?.reason?.trim?.()
      if (target === ListingStatus.REJECTED && !reason) {
        return res.status(400).json({ message: 'Rejection reason is required' })
      }

      const ref = db.collection(collection).doc(req.params.id)
      const snap = await ref.get()
      if (!snap.exists || snap.data().isDeleted) {
        return res.status(404).json({ message: `${label} not found` })
      }

      const current = snap.data()
      if (current.listingStatus !== ListingStatus.PENDING_APPROVAL) {
        return res.status(400).json({
          message: `Only PENDING_APPROVAL ${key} can be ${target === ListingStatus.APPROVED ? 'approved' : 'rejected'}`
        })
      }

      const patch = target === ListingStatus.APPROVED
        ? {
            listingStatus: ListingStatus.APPROVED,
            // Approval publishes it — this is what makes it visible in search.
            isActive: true,
            approvedAt: now(),
            approvedBy: req.adminId ?? null,
            rejectionReason: null
          }
        : {
            listingStatus: ListingStatus.REJECTED,
            isActive: false,
            rejectionReason: reason,
            approvedAt: null,
            approvedBy: null
          }

      await ref.update({ ...patch, updatedAt: now(), updatedBy: req.adminId ?? null })

      writeAuditLog({
        req,
        action: target === ListingStatus.APPROVED
          ? AuditAction.LISTING_APPROVED
          : AuditAction.LISTING_REJECTED,
        entity: collection,
        entityId: req.params.id,
        oldValue: { listingStatus: current.listingStatus },
        newValue: { listingStatus: patch.listingStatus, reason: reason ?? null, vendorId: current.vendorId ?? null }
      })

      const fresh = await ref.get()
      res.json({
        message: `${label} ${target === ListingStatus.APPROVED ? 'approved' : 'rejected'} successfully`,
        data: { [label.toLowerCase()]: { id: fresh.id, ...fresh.data() } }
      })
    } catch (err) {
      console.error(`Decide ${collection} error:`, err.message)
      res.status(500).json({ message: `Failed to update ${label.toLowerCase()}` })
    }
  }

  return {
    listPending,
    approve: decide(ListingStatus.APPROVED),
    reject: decide(ListingStatus.REJECTED)
  }
}
