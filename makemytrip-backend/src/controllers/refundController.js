import { db } from '../config/firebase.js'
import { isPrivileged } from '../config/roles.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import {
  RefundStatus,
  quoteRefund,
  transitionRefund,
  executeGatewayRefund,
  confirmGatewayRefund
} from '../services/refundService.js'

// Read-only preview so the cancellation dialog can state the real fee and
// refund before the customer commits.
export const previewRefund = async (req, res) => {
  try {
    const snap = await db.collection('bookings').doc(req.params.bookingId).get()
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Booking not found' })

    const booking = snap.data()
    if (booking.userId !== req.principal.uid && !isPrivileged(req.principal.role)) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    res.json({ success: true, data: quoteRefund(booking) })
  } catch (err) {
    console.error('Refund preview failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not calculate refund' })
  }
}

export const listMyRefunds = async (req, res) => {
  try {
    // No orderBy alongside the where clause: that pairing needs a composite
    // index. Sorting in memory keeps this index-free.
    const snap = await db.collection('refunds').where('userId', '==', req.principal.uid).get()

    const refunds = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => !r.isDeleted)
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))

    res.json({ success: true, data: refunds })
  } catch (err) {
    console.error('List refunds failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load refunds' })
  }
}

export const getRefund = async (req, res) => {
  try {
    const snap = await db.collection('refunds').doc(req.params.id).get()
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Refund not found' })

    const refund = snap.data()
    if (refund.userId !== req.principal.uid && !isPrivileged(req.principal.role)) {
      return res.status(404).json({ success: false, message: 'Refund not found' })
    }

    res.json({ success: true, data: { id: snap.id, ...refund } })
  } catch (err) {
    console.error('Get refund failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load refund' })
  }
}

// ── Admin ──

export const listAllRefunds = async (req, res) => {
  try {
    const { status } = req.query
    let query = db.collection('refunds')
    if (status) query = query.where('status', '==', status)

    const snap = await query.limit(500).get()
    const refunds = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))

    res.json({ success: true, data: refunds })
  } catch (err) {
    console.error('List all refunds failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load refunds' })
  }
}

// `process` and `complete` are not plain status writes — they move money and
// then confirm it moved, so they run through the gateway helpers.
const ADMIN_ACTIONS = {
  approve: { to: RefundStatus.APPROVED, audit: AuditAction.REFUND_INITIATED },
  reject: { to: RefundStatus.REJECTED, audit: AuditAction.REFUND_INITIATED },
  fail: { to: RefundStatus.FAILED, audit: AuditAction.REFUND_INITIATED }
}

const GATEWAY_ERROR_STATUS = {
  NOT_FOUND: 404,
  GATEWAY_UNAVAILABLE: 503,
  NO_PAYMENT: 409,
  ZERO_AMOUNT: 409,
  NOT_ISSUED: 409,
  NOT_SETTLED: 409,
  GATEWAY_FAILED: 502,
  GATEWAY_REJECTED: 502,
  INVALID_TRANSITION: 409
}

const failRefundRequest = (res, err, fallback) => {
  const status = GATEWAY_ERROR_STATUS[err.code]
  if (status) return res.status(status).json({ success: false, code: err.code, message: err.message })
  console.error(fallback, err.message)
  return res.status(500).json({ success: false, message: fallback })
}

export const updateRefundStatus = async (req, res) => {
  const { action, id } = req.params
  const { note } = req.body || {}
  const actorId = req.principal.uid

  try {
    const before = await db.collection('refunds').doc(id).get()
    if (!before.exists) return res.status(404).json({ success: false, message: 'Refund not found' })
    const previousStatus = before.data().status

    // Issue the money at the gateway.
    if (action === 'process') {
      const result = await executeGatewayRefund({ refundDocId: id, actorId })

      if (result.alreadyIssued) {
        return res.status(409).json({
          success: false,
          code: 'ALREADY_ISSUED',
          message: `A gateway refund (${result.gatewayRefundId}) has already been issued for this record`
        })
      }

      writeAuditLog({
        req,
        action: AuditAction.REFUND_INITIATED,
        entity: 'refunds',
        entityId: result.refund.refundId || id,
        oldValue: { status: previousStatus },
        newValue: { status: RefundStatus.PROCESSING, gatewayRefundId: result.gatewayRefundId }
      })

      return res.json({ success: true, data: result.refund })
    }

    // Confirm settlement before the record may read "completed".
    if (action === 'complete') {
      const updated = await confirmGatewayRefund({ refundDocId: id, actorId })

      writeAuditLog({
        req,
        action: AuditAction.REFUND_COMPLETED,
        entity: 'refunds',
        entityId: updated.refundId || id,
        oldValue: { status: previousStatus },
        newValue: { status: RefundStatus.COMPLETED, gatewayRefundId: updated.gatewayRefundId }
      })

      return res.json({ success: true, data: updated })
    }

    const mapping = ADMIN_ACTIONS[action]
    if (!mapping) {
      return res.status(400).json({ success: false, message: `Unknown refund action "${action}"` })
    }

    // A rejection has to say why — the customer sees this text.
    if (mapping.to === RefundStatus.REJECTED && !note?.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required when rejecting a refund' })
    }

    const updated = await transitionRefund({
      refundDocId: id,
      to: mapping.to,
      actorId,
      note: note?.trim() || null
    })

    writeAuditLog({
      req,
      action: mapping.audit,
      entity: 'refunds',
      entityId: updated.refundId || id,
      oldValue: { status: previousStatus },
      newValue: { status: mapping.to, note: note?.trim() || null }
    })

    res.json({ success: true, data: updated })
  } catch (err) {
    return failRefundRequest(res, err, 'Could not update refund')
  }
}
