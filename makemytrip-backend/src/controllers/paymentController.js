import crypto from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import {
  razorpay,
  razorpayKeySecret as KEY_SECRET,
  razorpayWebhookSecret,
  isWebhookConfigured,
  paiseToRupees
} from '../config/razorpay.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import { createBookingForPayment } from '../services/bookingService.js'
import { quoteTrip, redeemQuote, signQuote } from '../services/pricingService.js'

const gatewayUnavailable = (res) =>
  res.status(503).json({ success: false, message: 'Payment gateway is not configured' })

/**
 * Returns the authoritative price for a trip, plus a short-lived signed quote
 * the order endpoint will re-price from. The frontend displays this breakdown so
 * the figure shown and the figure charged cannot diverge.
 */
export const getQuote = async (req, res) => {
  const userId = req.user?.id || req.userId

  try {
    const { type, itemId, quantity, nights, distance, couponCode } = req.body

    // `couponCode` and `userId` were not forwarded, so `quoteTrip` always
    // priced with couponCode=null and the discount was always zero — while
    // `createBookingForPayment` still redeemed the code against the booking.
    // The customer paid full price AND burned a single-use coupon.
    //
    // The code travels inside the signed quote token, so `redeemQuote` re-prices
    // with the same coupon and a tampered code cannot survive to create-order.
    const quote = await quoteTrip({ type, itemId, quantity, nights, distance, couponCode, userId })

    res.json({
      success: true,
      data: { ...quote, quoteToken: signQuote(quote, userId) }
    })
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message })
    }
    console.error('Quote failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not price this trip' })
  }
}

export const createRazorpayOrder = async (req, res) => {
  if (!razorpay) return gatewayUnavailable(res)

  const userId = req.user?.id || req.userId

  try {
    const { quoteToken, currency = 'INR', notes = {}, bookingDraft = null } = req.body

    // The amount is never taken from the request. It is re-derived from stored
    // inventory via the signed quote, so a tampered client cannot choose its own
    // price. Callers that still send a bare `amount` are refused outright.
    if (!quoteToken) {
      return res.status(400).json({
        success: false,
        code: 'QUOTE_REQUIRED',
        message: 'A price quote is required. Request one from /payment/quote first.'
      })
    }

    const quote = await redeemQuote(quoteToken, userId)

    const order = await razorpay.orders.create({
      amount: Math.round(quote.totalAmount * 100),
      currency,
      receipt: `rcpt_${Date.now()}_${userId ?? 'anon'}`.slice(0, 40),
      notes: {
        ...notes,
        userId: userId ?? null,
        type: quote.type,
        itemId: quote.itemId
      }
    })

    // Record the intent, together with the priced breakdown, so an order can
    // never be verified against a user who did not create it and the booking can
    // be written from the server's own figures.
    await db.collection('payments').doc(order.id).set({
      orderId: order.id,
      userId: userId ?? null,
      amount: paiseToRupees(order.amount),
      currency: order.currency,
      status: 'created',
      provider: 'razorpay',
      quote: {
        type: quote.type,
        itemId: quote.itemId,
        quantity: quote.quantity,
        nights: quote.nights,
        baseFare: quote.baseFare,
        taxes: quote.taxes,
        gst: quote.gst,
        convenience: quote.convenience,
        discount: quote.discount,
        totalAmount: quote.totalAmount
      },
      // Traveller details, captured before payment so the webhook can complete
      // the booking when the browser never comes back. `createBookingForPayment`
      // strips every server-owned field from this, exactly as it does for the
      // browser-return path, so nothing here is trusted for money or ownership.
      bookingDraft: bookingDraft && typeof bookingDraft === 'object' ? bookingDraft : null,
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
        receipt: order.receipt,
        breakdown: {
          baseFare: quote.baseFare,
          taxes: quote.taxes,
          convenience: quote.convenience,
          discount: quote.discount,
          totalAmount: quote.totalAmount
        }
      }
    })
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message })
    }
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
    const orderRecord = orderSnap.exists ? orderSnap.data() : null
    const orderOwner = orderRecord?.userId ?? null
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
      // Bookings written by earlier revisions were keyed only by transactionId.
      const legacy = await db.collection('bookings').where('transactionId', '==', paymentId).limit(1).get()

      if (!legacy.empty) {
        booking = { id: legacy.docs[0].id, ...legacy.docs[0].data() }
      } else {
        // One shared creation path with POST /bookings/*: the amount comes from
        // the gateway, and every server-owned field is stripped from the payload.
        const result = await createBookingForPayment({
          payload: bookingData,
          // The signed quote recorded at create-order time. Without this the
          // payload alone chose which inventory to reserve, so a trip could be
          // priced as the cheapest bus seat and booked as a long-haul flight.
          quote: orderRecord?.quote ?? null,
          authority: {
            orderId,
            paymentId,
            amount: authoritativeTotal,
            method: payment.method ?? 'razorpay'
          },
          userId,
          userEmail: bookingData.userEmail ?? req.user?.email ?? null,
          userName: bookingData.userName ?? null
        })

        booking = result.booking

        writeAuditLog({
          req,
          action: AuditAction.BOOKING_CREATED,
          entity: 'bookings',
          entityId: booking.bookingId,
          newValue: { type: booking.type || bookingData.type, totalAmount: authoritativeTotal, paymentId }
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
      newValue: { reason: err.code ?? 'exception', message: err.message },
      status: 'failure'
    })
    // A rejected booking (QUOTE_MISMATCH, INSUFFICIENT_AVAILABILITY) is the
    // caller's fault and carries a message worth showing; only genuinely
    // unexpected failures collapse into a 500.
    if (err.status) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message })
    }
    res.status(500).json({ success: false, message: 'Payment verification failed' })
  }
}

/**
 * Razorpay webhook — the only reliable source of payment truth.
 *
 * `POST /payment/verify` only runs if the customer's browser comes back. When
 * it does not — tab closed, connection dropped, phone died — the money is
 * captured and no booking exists. Nothing on the platform notices, and the
 * customer has paid for nothing. This endpoint closes that hole.
 *
 * Unauthenticated by necessity (Razorpay holds no session), so the HMAC over
 * the raw body IS the authentication. The route must be mounted with
 * `express.raw` ahead of `express.json`: a parsed-and-restringified body does
 * not reproduce the bytes Razorpay signed, and every signature would fail.
 *
 * Idempotent: bookings are keyed `pay_{paymentId}`, so a retried delivery
 * converges on the same document rather than creating a second booking. The
 * browser-return path writes the same key, so the two cannot both win.
 */
export const handleWebhook = async (req, res) => {
  const signature = req.get('x-razorpay-signature')

  if (!isWebhookConfigured) {
    console.error('Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set')
    return res.status(503).json({ success: false, message: 'Webhook not configured' })
  }

  // `express.raw` leaves a Buffer; anything else means the route was mounted
  // without it and no signature could ever verify.
  const raw = Buffer.isBuffer(req.body) ? req.body : null
  if (!raw) {
    console.error('Razorpay webhook body is not raw — check the express.raw mount order')
    return res.status(500).json({ success: false, message: 'Webhook misconfigured' })
  }

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing signature' })
  }

  const expected = crypto.createHmac('sha256', razorpayWebhookSecret).update(raw).digest('hex')
  const expectedBuf = Buffer.from(expected, 'utf8')
  const providedBuf = Buffer.from(String(signature), 'utf8')
  const signatureValid =
    expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)

  if (!signatureValid) {
    writeAuditLog({
      req,
      action: AuditAction.PAYMENT_WEBHOOK,
      entity: 'payments',
      entityId: 'unknown',
      newValue: { reason: 'invalid_signature' },
      status: 'failure'
    })
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' })
  }

  let event
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch {
    return res.status(400).json({ success: false, message: 'Malformed webhook payload' })
  }

  const entity = event?.payload?.payment?.entity
  const eventType = event?.event

  // Acknowledge anything we do not act on. Returning non-2xx makes Razorpay
  // retry an event we will never process, indefinitely.
  if (!entity?.id || !['payment.captured', 'payment.failed'].includes(eventType)) {
    return res.json({ success: true, ignored: eventType ?? 'unknown' })
  }

  const paymentId = entity.id
  const orderId = entity.order_id

  try {
    if (eventType === 'payment.failed') {
      if (orderId) {
        await db.collection('payments').doc(orderId).set(
          {
            paymentId,
            status: 'failed',
            failureReason: entity.error_description ?? entity.error_reason ?? null,
            updatedAt: FieldValue.serverTimestamp()
          },
          { merge: true }
        )
      }
      writeAuditLog({
        req,
        action: AuditAction.PAYMENT_WEBHOOK,
        entity: 'payments',
        entityId: paymentId,
        newValue: { event: eventType, orderId },
        status: 'success'
      })
      return res.json({ success: true, handled: eventType })
    }

    // payment.captured — the booking must exist after this returns.
    const bookingRef = db.collection('bookings').doc(`pay_${paymentId}`)
    const existing = await bookingRef.get()

    if (existing.exists) {
      // The browser got back first, or this delivery is a retry. Both are fine.
      writeAuditLog({
        req,
        action: AuditAction.PAYMENT_WEBHOOK,
        entity: 'bookings',
        entityId: existing.id,
        newValue: { event: eventType, outcome: 'already_booked' },
        status: 'success'
      })
      return res.json({ success: true, handled: eventType, bookingId: existing.data()?.bookingId ?? null })
    }

    const orderSnap = orderId ? await db.collection('payments').doc(orderId).get() : null
    const order = orderSnap?.exists ? orderSnap.data() : null

    const amount = paiseToRupees(entity.amount)

    await db.collection('payments').doc(orderId ?? paymentId).set(
      {
        paymentId,
        status: entity.status,
        amountCaptured: amount,
        method: entity.method ?? null,
        source: 'webhook',
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    )

    // Without the order record there is no owner and no priced trip, so a
    // booking cannot be attributed. Record the payment and let reconciliation
    // surface it rather than inventing a booking.
    if (!order?.userId) {
      writeAuditLog({
        req,
        action: AuditAction.PAYMENT_WEBHOOK,
        entity: 'payments',
        entityId: paymentId,
        newValue: { event: eventType, outcome: 'orphan_payment', orderId },
        status: 'failure'
      })
      return res.json({ success: true, handled: eventType, orphan: true })
    }

    const draft = order.bookingDraft ?? {}
    const payload = {
      ...draft,
      type: draft.type ?? order.quote?.type ?? 'flight',
      quantity: draft.quantity ?? order.quote?.quantity,
      nights: draft.nights ?? order.quote?.nights
    }

    const { booking } = await createBookingForPayment({
      payload,
      // The draft is client input, exactly like the browser-return payload, so
      // it is held to the same quote it was priced against.
      quote: order.quote ?? null,
      authority: {
        orderId: orderId ?? null,
        paymentId,
        amount,
        method: entity.method ?? 'razorpay'
      },
      userId: order.userId,
      userEmail: draft.userEmail ?? entity.email ?? null,
      userName: draft.userName ?? null
    })

    writeAuditLog({
      req,
      action: AuditAction.PAYMENT_WEBHOOK,
      entity: 'bookings',
      entityId: booking?.bookingId ?? paymentId,
      newValue: { event: eventType, outcome: 'booking_created', orderId },
      status: 'success'
    })

    // A customer who never saw the confirmation screen needs the email even
    // more than one who did.
    if (booking && (draft.userEmail || entity.email)) {
      sendBookingConfirmationEmail({ ...booking, userEmail: draft.userEmail ?? entity.email })
        .catch((e) => console.error('Webhook confirmation email failed:', e.message))
    }

    return res.json({ success: true, handled: eventType, bookingId: booking?.bookingId ?? null })
  } catch (err) {
    console.error('Webhook processing error:', err)
    writeAuditLog({
      req,
      action: AuditAction.PAYMENT_WEBHOOK,
      entity: 'payments',
      entityId: paymentId,
      newValue: { event: eventType, reason: err.code ?? 'exception', message: err.message },
      status: 'failure'
    })

    // A rejected booking (QUOTE_MISMATCH, INSUFFICIENT_AVAILABILITY) is
    // permanent: the same delivery will fail the same way forever, so retrying
    // it only buries the audit trail. Acknowledge and leave the captured
    // payment for reconciliation to refund.
    if (err.status) {
      return res.json({ success: true, handled: eventType, rejected: err.code ?? 'rejected' })
    }

    // 500 so Razorpay retries — the booking genuinely has not been written.
    return res.status(500).json({ success: false, message: 'Webhook processing failed' })
  }
}
