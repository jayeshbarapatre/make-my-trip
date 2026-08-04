import { db } from '../config/firebase.js'
import { now, byNewest } from '../utils/time.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import { openRefund } from '../services/refundService.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'
import {
  BOOKING_TYPES,
  bookedQuantity,
  createBookingForPayment,
  loadPaymentAuthority,
  releaseAvailability,
  resolveItemId
} from '../services/bookingService.js'

/**
 * Creates a booking against a payment the gateway has already confirmed.
 *
 * The amount is read from the payment record, never from the request: this
 * endpoint used to accept a client-supplied `totalAmount` and spread the raw
 * request body over the stored document, so a caller could book a ₹1 (or
 * negative, or entirely unpaid) trip and even assign it to another user's id.
 */
export const createBooking = async (req, res) => {
  const userId = req.userId || req.user?.id

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required to create booking' })
  }

  const { type = 'flight', orderId, paymentId, transactionId, userEmail, userName } = req.body

  if (!BOOKING_TYPES.has(type)) {
    return res.status(400).json({ message: `Unsupported booking type: ${type}` })
  }

  try {
    // transactionId is what older clients sent for the gateway payment id.
    const authority = await loadPaymentAuthority({
      orderId,
      paymentId: paymentId ?? transactionId,
      userId
    })

    const { booking, created } = await createBookingForPayment({
      payload: req.body,
      authority,
      userId,
      userEmail: userEmail ?? req.user?.email ?? null,
      userName: userName ?? null
    })

    if (!created) {
      return res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking already created for this payment'
      })
    }

    writeAuditLog({
      req,
      action: AuditAction.BOOKING_CREATED,
      entity: 'bookings',
      entityId: booking.bookingId,
      newValue: { type, totalAmount: authority.amount, paymentId: authority.paymentId }
    })

    const recipient = userEmail ?? req.user?.email
    if (recipient) {
      sendBookingConfirmationEmail({ ...booking, userEmail: recipient, userName })
        .catch((e) => console.warn(`⚠️ Confirmation email failed (non-critical): ${e.message}`))
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    })
  } catch (err) {
    if (err.status) {
      writeAuditLog({
        req,
        action: AuditAction.BOOKING_CREATED,
        entity: 'bookings',
        entityId: null,
        newValue: { reason: err.code, type },
        status: 'failure'
      })
      return res.status(err.status).json({ success: false, code: err.code, message: err.message })
    }

    console.error('Booking creation failed:', err.message)
    res.status(500).json({ success: false, message: 'Booking could not be created' })
  }
}

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Ownership guard: the :userId param in the URL must match the authenticated
    // caller. This prevents a user from substituting another user's ID in the
    // URL to attempt enumeration, even though the query is already scoped to
    // the token's id. An admin (privileged role) may query any user's bookings.
    const paramUserId = req.params?.userId
    const isAdmin = req.principal?.role === 'admin' || req.principal?.role === 'super_admin'
    if (paramUserId && paramUserId !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own bookings' })
    }

    // Always query using the authenticated user's id from the token (or the
    // admin's requested userId), never the raw URL param.
    const queryUserId = (isAdmin && paramUserId) ? paramUserId : userId

    console.log(`📋 Fetching bookings for user ${queryUserId}`)

    // Get all bookings for this user.
    // No orderBy in the query — a where+orderBy combination requires a composite index;
    // sorting in memory keeps the query index-free for any Firestore project.
    const bookingsSnapshot = await db.collection('bookings')
      .where('userId', '==', queryUserId)
      .get()

    // `new Date(x)` is Invalid Date for a Firestore Timestamp, and 19 of the
    // stored bookings carry one — so this comparator returned NaN and left My
    // Trips in an undefined order for exactly the newest bookings.
    const bookings = bookingsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort(byNewest('createdAt'))

    console.log(`✅ Found ${bookings.length} bookings for user ${queryUserId}`)

    res.json({ success: true, data: bookings })
  } catch (err) {
    console.error('Get bookings error:', err.message)
    res.status(500).json({ message: 'Could not load your bookings. Please try again.' })
  }
}

// Admin: list all bookings across users (route is protected by admin middleware)
export const getAllBookings = async (_req, res) => {
  try {
    // Firestore orders by type before value, and `createdAt` is an ISO string
    // on some booking documents and a Timestamp on others — so an indexed
    // orderBy grouped every string ahead of every Timestamp and listed the
    // newest bookings last. Sorting in memory on a normalised value is correct
    // for both shapes.
    //
    // Once `npm run migrate:timestamps` has run everywhere, this can go back to
    // an indexed `.orderBy('createdAt', 'desc')` using the composite index
    // declared in firestore.indexes.json.
    const snapshot = await db.collection('bookings').limit(500).get()
    const bookings = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort(byNewest('createdAt'))
    res.json({ success: true, data: bookings })
  } catch (err) {
    console.error('Get all bookings error:', err.message)
    res.status(500).json({ message: 'Could not load bookings. Please try again.' })
  }
}

export const getBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const bookingDoc = await db.collection('bookings').doc(id).get()

    if (!bookingDoc.exists) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    const booking = bookingDoc.data()

    // Verify user owns this booking
    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own bookings' })
    }

    res.json({ success: true, data: { id, ...booking } })
  } catch (err) {
    console.error('Get booking error:', err.message)
    res.status(500).json({ message: 'Could not load this booking. Please try again.' })
  }
}

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const bookingRef = db.collection('bookings').doc(id)

    // Read, ownership-check and flip to cancelled inside one transaction.
    //
    // Split across separate reads and writes, two concurrent cancellations (a
    // double-click, or a retry racing the original) both observed status
    // !== 'cancelled', both wrote the cancellation, and both went on to call
    // releaseAvailability — returning the same seats to the pool twice and
    // inventing inventory that was never sold back.
    //
    // `alreadyCancelled` tells the caller apart from the winner, so only the
    // transaction that actually performed the flip releases inventory.
    let booking
    let alreadyCancelled = false

    try {
      booking = await db.runTransaction(async (tx) => {
        const snap = await tx.get(bookingRef)
        if (!snap.exists) {
          const err = new Error('Booking not found')
          err.status = 404
          throw err
        }

        const data = snap.data()

        if (data.userId !== userId) {
          const err = new Error('Forbidden: You can only cancel your own bookings')
          err.status = 403
          throw err
        }

        if (data.status === 'cancelled') {
          alreadyCancelled = true
          return data
        }

        tx.update(bookingRef, {
          status: 'cancelled',
          bookingStatus: 'cancelled',
          cancelledAt: now(),
          updatedAt: now(),
          updatedBy: userId
        })

        return data
      })
    } catch (err) {
      if (err.status) return res.status(err.status).json({ message: err.message })
      throw err
    }

    if (alreadyCancelled) {
      return res.status(400).json({ message: 'Booking is already cancelled' })
    }

    // Put the seats/rooms back on sale. Cancellations previously left inventory
    // permanently decremented, so a fully-cancelled flight still showed sold out.
    try {
      // The stored booking is passed through so dated inventory is credited
      // back to the exact nights it was taken from.
      const restored = await releaseAvailability(
        booking.type,
        resolveItemId(booking),
        bookedQuantity(booking.type, booking),
        booking
      )
      if (restored.applied) {
        console.log(restored.dated
          ? `♻️ Released ${restored.restored} on ${restored.dates.join(', ')} for ${booking.bookingId}`
          : `♻️ Released ${restored.restored} ${restored.field} for ${booking.bookingId}`)
      }
    } catch (releaseErr) {
      console.error(`⚠️ Could not release inventory for ${id}:`, releaseErr.message)
    }

    writeAuditLog({
      req,
      action: AuditAction.BOOKING_CANCELLED,
      entity: 'bookings',
      entityId: booking.bookingId || id,
      oldValue: { status: booking.status },
      newValue: { status: 'cancelled' }
    })

    // Open the refund against the cancelled booking. The amount comes from the
    // server-side policy so the customer is never quoted a figure the business
    // has not actually committed to.
    let refund = null
    try {
      refund = await openRefund({
        booking,
        bookingDocId: id,
        userId,
        reason: req.body?.reason?.trim() || null
      })

      if (!refund.alreadyExisted) {
        writeAuditLog({
          req,
          action: AuditAction.REFUND_INITIATED,
          entity: 'refunds',
          entityId: refund.refundId,
          newValue: {
            bookingId: booking.bookingId,
            refundAmount: refund.refundAmount,
            cancellationFee: refund.cancellationFee
          }
        })
      }
    } catch (refundErr) {
      // The cancellation itself already succeeded; surface the refund problem
      // rather than rolling back a cancellation the customer asked for.
      console.error('⚠️ Refund could not be opened for', id, '-', refundErr.message)
    }

    const updatedBooking = (await db.collection('bookings').doc(id).get()).data()

    res.json({
      success: true,
      data: updatedBooking,
      refund: refund
        ? {
            refundId: refund.refundId,
            status: refund.status,
            grossAmount: refund.grossAmount,
            cancellationFee: refund.cancellationFee,
            refundAmount: refund.refundAmount,
            policy: refund.policy
          }
        : null,
      message: 'Booking cancelled successfully'
    })
  } catch (err) {
    console.error('Cancel booking error:', err.message)
    res.status(500).json({ message: 'Could not cancel this booking. Please try again.' })
  }
}
