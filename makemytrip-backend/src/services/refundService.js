import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { razorpay, rupeesToPaise, paiseToRupees } from '../config/razorpay.js'
import { generateInvoiceNumber } from '../utils/idGenerator.js'

// Refund amounts are computed here and nowhere else. The client previously
// rendered its own estimate (a flat 20% fee against a hardcoded ₹5000 default),
// which could disagree with whatever the business actually refunded.

export const RefundStatus = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

/**
 * Cancellation fee tiers by hours remaining before departure/check-in.
 * Ordered most-restrictive first; the first matching tier wins.
 */
const FEE_TIERS = [
  { minHoursBefore: 0, feeRate: 1.0, label: 'No refund within 2 hours of departure' },
  { minHoursBefore: 2, feeRate: 0.5, label: '50% cancellation fee under 24 hours' },
  { minHoursBefore: 24, feeRate: 0.25, label: '25% cancellation fee under 7 days' },
  { minHoursBefore: 168, feeRate: 0.1, label: '10% cancellation fee' }
].sort((a, b) => b.minHoursBefore - a.minHoursBefore)

const hoursUntil = (dateLike) => {
  const target = new Date(dateLike)
  if (Number.isNaN(target.getTime())) return null
  return (target.getTime() - Date.now()) / 36e5
}

/**
 * @returns {{refundable:boolean, grossAmount:number, cancellationFee:number,
 *            refundAmount:number, feeRate:number, policy:string}}
 */
export const quoteRefund = (booking) => {
  const grossAmount = Number(booking?.totalAmount) || 0

  if (grossAmount <= 0) {
    return {
      refundable: false,
      grossAmount: 0,
      cancellationFee: 0,
      refundAmount: 0,
      feeRate: 0,
      policy: 'No payment recorded against this booking'
    }
  }

  const departure = booking.departureDate || booking.checkIn || booking.travelDate
  const remaining = departure ? hoursUntil(departure) : null

  // With no usable travel date we cannot place the booking in a tier; fall back
  // to the most generous tier rather than silently over-charging the customer.
  const tier = remaining === null
    ? FEE_TIERS[0]
    : FEE_TIERS.find((t) => remaining >= t.minHoursBefore) ?? FEE_TIERS[FEE_TIERS.length - 1]

  const cancellationFee = Math.round(grossAmount * tier.feeRate)
  const refundAmount = Math.max(0, grossAmount - cancellationFee)

  return {
    refundable: refundAmount > 0,
    grossAmount,
    cancellationFee,
    refundAmount,
    feeRate: tier.feeRate,
    policy: tier.label
  }
}

/**
 * Creates the refund record for a cancelled booking. Keyed deterministically on
 * the booking so a repeated cancellation cannot open a second refund.
 */
export const openRefund = async ({ booking, bookingDocId, userId, reason = null }) => {
  const quote = quoteRefund(booking)
  const refundRef = db.collection('refunds').doc(`rf_${bookingDocId}`)

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(refundRef)
    if (existing.exists) return { id: existing.id, ...existing.data(), alreadyExisted: true }

    const doc = {
      refundId: generateInvoiceNumber(booking.type || 'flight').replace('INV-', 'RFD-'),
      bookingDocId,
      bookingId: booking.bookingId ?? null,
      userId,
      vendorId: booking.vendorId ?? null,
      type: booking.type ?? null,
      paymentId: booking.paymentId ?? booking.transactionId ?? null,
      grossAmount: quote.grossAmount,
      cancellationFee: quote.cancellationFee,
      refundAmount: quote.refundAmount,
      feeRate: quote.feeRate,
      policy: quote.policy,
      reason,
      status: quote.refundable ? RefundStatus.REQUESTED : RefundStatus.REJECTED,
      statusHistory: [
        {
          status: quote.refundable ? RefundStatus.REQUESTED : RefundStatus.REJECTED,
          at: new Date().toISOString(),
          by: userId,
          note: quote.refundable ? 'Opened on booking cancellation' : quote.policy
        }
      ],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
      isDeleted: false
    }

    tx.set(refundRef, doc)
    return { id: refundRef.id, ...doc, alreadyExisted: false }
  })
}

const ALLOWED_TRANSITIONS = {
  [RefundStatus.REQUESTED]: [RefundStatus.APPROVED, RefundStatus.REJECTED],
  // APPROVED -> FAILED is reachable: the gateway can reject the transfer at the
  // moment we try to issue it, before the refund ever reaches PROCESSING.
  [RefundStatus.APPROVED]: [RefundStatus.PROCESSING, RefundStatus.REJECTED, RefundStatus.FAILED],
  [RefundStatus.PROCESSING]: [RefundStatus.COMPLETED, RefundStatus.FAILED],
  [RefundStatus.FAILED]: [RefundStatus.PROCESSING],
  [RefundStatus.COMPLETED]: [],
  [RefundStatus.REJECTED]: []
}

export const canTransition = (from, to) => (ALLOWED_TRANSITIONS[from] || []).includes(to)

export const transitionRefund = async ({ refundDocId, to, actorId, note = null, extra = {} }) => {
  const ref = db.collection('refunds').doc(refundDocId)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      const err = new Error('Refund not found')
      err.code = 'NOT_FOUND'
      throw err
    }

    const current = snap.data()
    if (!canTransition(current.status, to)) {
      const err = new Error(`Cannot move a refund from ${current.status} to ${to}`)
      err.code = 'INVALID_TRANSITION'
      throw err
    }

    const entry = { status: to, at: new Date().toISOString(), by: actorId, note }

    tx.update(ref, {
      ...extra,
      status: to,
      statusHistory: FieldValue.arrayUnion(entry),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorId,
      ...(note ? { lastNote: note } : {})
    })

    return { id: refundDocId, ...current, ...extra, status: to }
  })
}

const gatewayError = (message, code) => {
  const err = new Error(message)
  err.code = code
  return err
}

/**
 * The Razorpay SDK surfaces failures in several shapes depending on whether the
 * request was rejected by the API, the HTTP layer, or the SDK itself. Falling
 * back through them avoids logging an empty string, which tells an operator
 * nothing about why a refund did not go out.
 */
const describeGatewayError = (err) => {
  const candidates = [
    err?.error?.description,
    err?.description,
    err?.error?.reason,
    typeof err?.error === 'string' ? err.error : null,
    err?.message
  ]
  const found = candidates.find((c) => typeof c === 'string' && c.trim().length)
  if (found) return found

  const statusCode = err?.statusCode ?? err?.error?.code
  return statusCode
    ? `Gateway rejected the refund (code ${statusCode})`
    : 'Gateway rejected the refund for an unspecified reason'
}

/**
 * Issues the actual refund at the payment gateway.
 *
 * Marking a refund "completed" in Firestore without this call means the record
 * says the customer was paid when no money moved. The gateway refund id is
 * written back so the transfer is auditable and can never be issued twice.
 */
export const executeGatewayRefund = async ({ refundDocId, actorId }) => {
  const ref = db.collection('refunds').doc(refundDocId)
  const snap = await ref.get()

  if (!snap.exists) throw gatewayError('Refund not found', 'NOT_FOUND')
  const refund = snap.data()

  if (refund.gatewayRefundId) {
    // Already issued — surface the existing transfer instead of double-refunding.
    return { alreadyIssued: true, gatewayRefundId: refund.gatewayRefundId, refund }
  }

  if (!razorpay) throw gatewayError('Payment gateway is not configured', 'GATEWAY_UNAVAILABLE')
  if (!refund.paymentId) {
    throw gatewayError('This refund has no linked gateway payment to refund against', 'NO_PAYMENT')
  }
  if (!(refund.refundAmount > 0)) {
    throw gatewayError('Refund amount is zero', 'ZERO_AMOUNT')
  }

  let gatewayRefund
  try {
    gatewayRefund = await razorpay.payments.refund(refund.paymentId, {
      amount: rupeesToPaise(refund.refundAmount),
      speed: 'normal',
      notes: { refundId: refund.refundId, bookingId: refund.bookingId ?? '' },
      // Razorpay rejects a duplicate receipt, which gives us gateway-side
      // idempotency on top of the gatewayRefundId guard above.
      receipt: refund.refundId
    })
  } catch (err) {
    const reason = describeGatewayError(err)
    // Record the failure. If even this write fails we must still surface the
    // gateway error, but never silently — a refund stuck in APPROVED with no
    // trace of the attempt is how money quietly goes missing.
    try {
      await transitionRefund({
        refundDocId,
        to: RefundStatus.FAILED,
        actorId,
        note: `Gateway refund failed: ${reason}`
      })
    } catch (transitionErr) {
      console.error(
        `⚠️ Could not record gateway failure on refund ${refundDocId}:`,
        transitionErr.message
      )
    }
    throw gatewayError(reason, 'GATEWAY_REJECTED')
  }

  const updated = await transitionRefund({
    refundDocId,
    to: RefundStatus.PROCESSING,
    actorId,
    note: `Gateway refund issued (${gatewayRefund.id})`,
    extra: {
      gatewayRefundId: gatewayRefund.id,
      gatewayRefundStatus: gatewayRefund.status ?? null,
      gatewayRefundedAmount: paiseToRupees(gatewayRefund.amount ?? 0),
      gatewayResponse: {
        id: gatewayRefund.id,
        status: gatewayRefund.status ?? null,
        amount: gatewayRefund.amount ?? null,
        currency: gatewayRefund.currency ?? null,
        speed_processed: gatewayRefund.speed_processed ?? null,
        created_at: gatewayRefund.created_at ?? null
      }
    }
  })

  return { alreadyIssued: false, gatewayRefundId: gatewayRefund.id, refund: updated }
}

/**
 * Confirms with the gateway that the transfer actually settled before the
 * record is allowed to read "completed".
 */
export const confirmGatewayRefund = async ({ refundDocId, actorId }) => {
  const snap = await db.collection('refunds').doc(refundDocId).get()
  if (!snap.exists) throw gatewayError('Refund not found', 'NOT_FOUND')

  const refund = snap.data()
  if (!refund.gatewayRefundId) {
    throw gatewayError('No gateway refund has been issued for this record yet', 'NOT_ISSUED')
  }
  if (!razorpay) throw gatewayError('Payment gateway is not configured', 'GATEWAY_UNAVAILABLE')

  const remote = await razorpay.refunds.fetch(refund.gatewayRefundId)

  if (remote.status === 'failed') {
    await transitionRefund({
      refundDocId,
      to: RefundStatus.FAILED,
      actorId,
      note: 'Gateway reported the refund failed'
    })
    throw gatewayError('The gateway reported this refund as failed', 'GATEWAY_FAILED')
  }

  if (remote.status !== 'processed') {
    throw gatewayError(`Gateway refund is still ${remote.status}; cannot mark completed yet`, 'NOT_SETTLED')
  }

  return transitionRefund({
    refundDocId,
    to: RefundStatus.COMPLETED,
    actorId,
    note: `Gateway confirmed settlement (${remote.id})`,
    extra: { gatewayRefundStatus: remote.status, settledAt: new Date().toISOString() }
  })
}
