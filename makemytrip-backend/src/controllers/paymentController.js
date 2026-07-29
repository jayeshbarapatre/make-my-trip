import crypto from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { razorpay, razorpayKeySecret as KEY_SECRET, paiseToRupees } from '../config/razorpay.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'
import { generateBookingId, generatePNR } from '../utils/idGenerator.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

const gatewayUnavailable = (res) =>
  res.status(503).json({ success: false, message: 'Payment gateway is not configured' })

const BOOKING_TYPES = new Set(['flight', 'hotel', 'bus', 'train', 'cab'])

/**
 * A client-supplied fare breakdown is only trustworthy if it reconciles with the
 * amount the gateway actually captured. If it doesn't, we keep the authoritative
 * total and drop the breakdown rather than invent one.
 */
const reconcileBreakdown = (bookingData, authoritativeTotal) => {
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  const hasBreakdown = ['baseFare', 'taxes', 'convenience', 'gst', 'discount']
    .some((k) => bookingData?.[k] !== undefined && bookingData?.[k] !== null)

  if (!hasBreakdown) return null

  const baseFare = num(bookingData.baseFare)
  const taxes = num(bookingData.taxes)
  const convenience = num(bookingData.convenience)
  const gst = num(bookingData.gst)
  const discount = num(bookingData.discount)
  const sum = baseFare + taxes + convenience + gst - discount

  // Allow a rupee of slack for rounding differences between client and gateway.
  if (Math.abs(sum - authoritativeTotal) > 1) return null

  return { baseFare, taxes, convenience, gst, discount }
}

export const createRazorpayOrder = async (req, res) => {
  if (!razorpay) return gatewayUnavailable(res)

  try {
    const { amount, currency = 'INR', notes = {} } = req.body
    const numericAmount = Number(amount)

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A positive amount is required.' })
    }

    const userId = req.user?.id || req.userId

    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency,
      receipt: `rcpt_${Date.now()}_${userId ?? 'anon'}`.slice(0, 40),
      notes: { ...notes, userId: userId ?? null }
    })

    // Record the intent so an order can never be verified against a user who
    // did not create it.
    await db.collection('payments').doc(order.id).set({
      orderId: order.id,
      userId: userId ?? null,
      amount: paiseToRupees(order.amount),
      currency: order.currency,
      status: 'created',
      provider: 'razorpay',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
      isDeleted: false
    })

    writeAuditLog({
      req,
      action: AuditAction.PAYMENT_ORDER_CREATED,
      entity: 'payments',
      entityId: order.id,
      newValue: { amount: paiseToRupees(order.amount), currency: order.currency }
    })

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    })
  } catch (err) {
    console.error('Razorpay order creation error:', err)
    res.status(500).json({ success: false, message: 'Failed to create payment order' })
  }
}

export const verifyPayment = async (req, res) => {
  if (!razorpay) return gatewayUnavailable(res)

  const { orderId, paymentId, signature, bookingData } = req.body

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ success: false, message: 'Missing payment verification details' })
  }

  const userId = req.user?.id || req.userId
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  try {
    const expected = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    // Constant-time compare so a caller cannot probe the signature byte by byte.
    const expectedBuf = Buffer.from(expected, 'utf8')
    const providedBuf = Buffer.from(String(signature), 'utf8')
    const signatureValid =
      expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)

    if (!signatureValid) {
      writeAuditLog({
        req,
        action: AuditAction.PAYMENT_REJECTED,
        entity: 'payments',
        entityId: paymentId,
        newValue: { reason: 'invalid_signature', orderId },
        status: 'failure'
      })
      return res.status(400).json({ success: false, message: 'Invalid payment signature' })
    }

    // A valid signature proves the response came from Razorpay, but not what was
    // actually charged. Ask the gateway directly — this is the only trustworthy
    // source for the amount and the capture status.
    const payment = await razorpay.payments.fetch(paymentId)

    if (payment.order_id !== orderId) {
      writeAuditLog({
        req,
        action: AuditAction.PAYMENT_REJECTED,
        entity: 'payments',
        entityId: paymentId,
        newValue: { reason: 'order_mismatch', orderId, gatewayOrderId: payment.order_id },
        status: 'failure'
      })
      return res.status(400).json({ success: false, message: 'Payment does not belong to this order' })
    }

    if (!['captured', 'authorized'].includes(payment.status)) {
      writeAuditLog({
        req,
        action: AuditAction.PAYMENT_REJECTED,
        entity: 'payments',
        entityId: paymentId,
        newValue: { reason: 'not_captured', gatewayStatus: payment.status },
        status: 'failure'
      })
      return res.status(400).json({
        success: false,
        message: `Payment is not complete (gateway status: ${payment.status})`
      })
    }

    const authoritativeTotal = paiseToRupees(payment.amount)

    // The order was recorded at creation time against its owner. Refuse to let
    // one account claim another account's payment.
    const orderSnap = await db.collection('payments').doc(orderId).get()
    const orderOwner = orderSnap.exists ? orderSnap.data().userId : null
    if (orderOwner && orderOwner !== userId) {
      writeAuditLog({
        req,
        action: AuditAction.PAYMENT_REJECTED,
        entity: 'payments',
        entityId: paymentId,
        newValue: { reason: 'owner_mismatch', orderOwner },
        status: 'failure'
      })
      return res.status(403).json({ success: false, message: 'This payment belongs to another account' })
    }

    await db.collection('payments').doc(orderId).set(
      {
        paymentId,
        status: payment.status,
        amountCaptured: authoritativeTotal,
        method: payment.method ?? null,
        gatewayResponse: {
          id: payment.id,
          status: payment.status,
          method: payment.method ?? null,
          amount: payment.amount,
          currency: payment.currency,
          captured: payment.captured ?? null,
          email: payment.email ?? null,
          contact: payment.contact ?? null,
          created_at: payment.created_at ?? null
        },
        userId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId,
        isDeleted: false
      },
      { merge: true }
    )

    let booking = null

    if (bookingData) {
      const type = BOOKING_TYPES.has(bookingData.type) ? bookingData.type : 'flight'

      // Bookings written by earlier revisions were keyed only by transactionId.
      const legacy = await db.collection('bookings').where('transactionId', '==', paymentId).limit(1).get()

      if (!legacy.empty) {
        booking = { id: legacy.docs[0].id, ...legacy.docs[0].data() }
      } else {
        const {
          type: _type,
          totalAmount: _clientTotal,
          userId: _clientUserId,
          baseFare: _bf,
          taxes: _tx,
          convenience: _cv,
          gst: _gst,
          discount: _dc,
          status: _st,
          paymentStatus: _ps,
          transactionId: _ti,
          userEmail,
          userName,
          ...rest
        } = bookingData

        const breakdown = reconcileBreakdown(bookingData, authoritativeTotal)

        // Deterministic id keyed on the gateway payment: two concurrent verify
        // calls for the same payment resolve to the same document, so the
        // transaction below makes duplicate booking creation impossible.
        const bookingRef = db.collection('bookings').doc(`pay_${paymentId}`)

        const created = await db.runTransaction(async (tx) => {
          const existing = await tx.get(bookingRef)
          if (existing.exists) return { id: existing.id, ...existing.data() }

          const doc = {
            ...rest,
            bookingId: generateBookingId(type),
            pnr: generatePNR(type),
            userId,
            type,
            bookingType: type,
            totalAmount: authoritativeTotal,
            ...(breakdown ?? {}),
            fareBreakdownVerified: breakdown !== null,
            status: 'confirmed',
            bookingStatus: 'confirmed',
            paymentStatus: 'completed',
            paymentId,
            orderId,
            transactionId: paymentId,
            paymentMethod: payment.method ?? 'razorpay',
            userEmail: userEmail ?? null,
            userName: userName ?? null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            createdBy: userId,
            updatedBy: userId,
            isDeleted: false
          }

          tx.set(bookingRef, doc)
          return { id: bookingRef.id, ...doc }
        })

        booking = created

        writeAuditLog({
          req,
          action: AuditAction.BOOKING_CREATED,
          entity: 'bookings',
          entityId: booking.bookingId,
          newValue: { type, totalAmount: authoritativeTotal, paymentId }
        })
      }

      const recipient = bookingData.userEmail || booking.userEmail || req.user?.email
      if (recipient) {
        sendBookingConfirmationEmail({
          ...booking,
          userEmail: recipient,
          userName: bookingData.userName || booking.userName
        }).catch((emailErr) =>
          console.error('⚠️ Confirmation email failed:', emailErr.message)
        )
      }
    }

    writeAuditLog({
      req,
      action: AuditAction.PAYMENT_VERIFIED,
      entity: 'payments',
      entityId: paymentId,
      newValue: { orderId, amount: authoritativeTotal, bookingId: booking?.bookingId ?? null }
    })

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId,
        paymentId,
        amount: authoritativeTotal,
        booking: booking ?? null
      }
    })
  } catch (err) {
    console.error('Payment verification error:', err)
    writeAuditLog({
      req,
      action: AuditAction.PAYMENT_REJECTED,
      entity: 'payments',
      entityId: paymentId,
      newValue: { reason: 'exception', message: err.message },
      status: 'failure'
    })
    res.status(500).json({ success: false, message: 'Payment verification failed' })
  }
}
