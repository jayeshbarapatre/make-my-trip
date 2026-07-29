import { db } from '../config/firebase.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import { generateBookingId, generatePNR } from '../utils/idGenerator.js'
import { openRefund } from '../services/refundService.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

const RESOURCE_COLLECTIONS = {
  flight: 'flights',
  hotel: 'hotels',
  bus: 'buses',
  train: 'trains'
}

// Atomically decrement seat/room availability inside a transaction.
// Skips silently when the booked item is not a Firestore document (e.g. live API results).
const decrementAvailability = async (type, itemId, quantity) => {
  const collection = RESOURCE_COLLECTIONS[type]
  if (!collection || !itemId || typeof itemId !== 'string') return { applied: false }

  const ref = db.collection(collection).doc(itemId)

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref)
    if (!doc.exists) return { applied: false }

    const data = doc.data()
    const field = type === 'hotel'
      ? (data.roomsAvailable !== undefined ? 'roomsAvailable' : 'rooms')
      : (data.seatsAvailable !== undefined ? 'seatsAvailable' : 'seats')

    const available = data[field]
    if (typeof available !== 'number') return { applied: false }

    if (available < quantity) {
      const err = new Error(type === 'hotel'
        ? `Only ${available} room(s) left for this hotel`
        : `Only ${available} seat(s) left`)
      err.code = 'INSUFFICIENT_AVAILABILITY'
      throw err
    }

    tx.update(ref, { [field]: available - quantity, updatedAt: new Date().toISOString() })
    return { applied: true, field, remaining: available - quantity }
  })
}

const bookedQuantity = (type, body) => {
  if (type === 'hotel') return parseInt(body.rooms) || 1
  if (Array.isArray(body.passengers)) return body.passengers.length
  if (body.travellers && Array.isArray(body.travellers.passengers)) return body.travellers.passengers.length
  return parseInt(body.passengerCount) || 1
}

export const createBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id

    if (!userId) {
      console.error('❌ Booking: No userId found')
      return res.status(401).json({ message: 'Authentication required to create booking' })
    }

    console.log(`✅ Booking: Creating booking for user ${userId}, type: ${req.body.type || 'unknown'}`)

    const {
      type = 'flight',
      totalAmount,
      userEmail,
      userName,
      transactionId,
      paymentMethod = 'credit_card',
      paymentStatus = 'completed',
      // Booking details
      ...bookingDetails
    } = req.body

    if (!type || !totalAmount) {
      return res.status(400).json({ message: 'Booking type and totalAmount are required' })
    }

    const bookingId = generateBookingId(type)
    const pnr = generatePNR(type)

    // ✅ IDEMPOTENCY CHECK: Use transactionId to prevent duplicate bookings
    if (transactionId) {
      const existingBookings = await db.collection('bookings')
        .where('userId', '==', userId)
        .where('transactionId', '==', transactionId)
        .where('type', '==', type)
        .limit(1)
        .get()

      if (!existingBookings.empty) {
        console.log(`✓ Idempotent: Booking already exists for transaction ${transactionId}`)
        const existingBooking = existingBookings.docs[0].data()
        return res.status(200).json({
          success: true,
          data: existingBooking,
          message: 'Booking already created (idempotent)'
        })
      }
    }

    // Atomic availability check + decrement (no overbooking)
    const itemId = bookingDetails.flightId || bookingDetails.hotelId || bookingDetails.busId ||
      bookingDetails.trainId || bookingDetails.itemId
    const quantity = bookedQuantity(type, req.body)

    try {
      await decrementAvailability(type, itemId, quantity)
    } catch (availErr) {
      if (availErr.code === 'INSUFFICIENT_AVAILABILITY') {
        return res.status(400).json({ message: availErr.message })
      }
      console.warn(`⚠️ Availability update skipped: ${availErr.message}`)
    }

    // Create booking object
    const newBooking = {
      bookingId,
      pnr,
      userId,
      type,
      totalAmount,
      userEmail: userEmail || null,
      userName: userName || null,
      paymentMethod,
      paymentStatus,
      transactionId: transactionId || null,
      status: 'confirmed',
      bookingStatus: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId,
      isDeleted: false,
      ...bookingDetails
    }

    console.log(`💾 Saving booking to Firestore: ${bookingId}`)

    // Save to Firestore
    const bookingDocId = `${userId}_${Date.now()}`
    await db.collection('bookings').doc(bookingDocId).set(newBooking)

    console.log(`✅ Booking created: ${bookingId} (Document: ${bookingDocId})`)

    writeAuditLog({
      req,
      action: AuditAction.BOOKING_CREATED,
      entity: 'bookings',
      entityId: bookingId,
      newValue: { type, totalAmount, transactionId: transactionId || null }
    })

    // Fire-and-forget confirmation email — never blocks or fails the booking
    if (userEmail) {
      sendBookingConfirmationEmail(newBooking)
        .then(r => r?.success !== false && console.log(`📧 Confirmation email sent for ${bookingId}`))
        .catch(e => console.warn(`⚠️ Confirmation email failed (non-critical): ${e.message}`))
    }

    res.status(201).json({
      success: true,
      data: { id: bookingDocId, ...newBooking },
      message: 'Booking created successfully'
    })
  } catch (err) {
    console.error('Firebase Booking error:', err.message)
    console.error('Stack:', err.stack)
    res.status(500).json({ message: `Booking failed: ${err.message}` })
  }
}

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    console.log(`📋 Fetching bookings for user ${userId}`)

    // Get all bookings for this user.
    // No orderBy in the query — a where+orderBy combination requires a composite index;
    // sorting in memory keeps the query index-free for any Firestore project.
    const bookingsSnapshot = await db.collection('bookings')
      .where('userId', '==', userId)
      .get()

    const bookings = bookingsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

    console.log(`✅ Found ${bookings.length} bookings for user ${userId}`)

    res.json({ success: true, data: bookings })
  } catch (err) {
    console.error('Get bookings error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

// Admin: list all bookings across users (route is protected by admin middleware)
export const getAllBookings = async (_req, res) => {
  try {
    const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').limit(500).get()
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.json({ success: true, data: bookings })
  } catch (err) {
    console.error('Get all bookings error:', err.message)
    res.status(500).json({ message: err.message })
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
    res.status(500).json({ message: err.message })
  }
}

export const cancelBooking = async (req, res) => {
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
      return res.status(403).json({ message: 'Forbidden: You can only cancel your own bookings' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' })
    }

    // Update booking status
    await db.collection('bookings').doc(id).update({
      status: 'cancelled',
      bookingStatus: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    })

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
    res.status(500).json({ message: err.message })
  }
}
