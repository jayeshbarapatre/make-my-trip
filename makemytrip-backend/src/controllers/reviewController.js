import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { isPrivileged } from '../config/roles.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import { sanitizeText } from '../utils/sanitize.js'

const REVIEWABLE = new Set(['hotel', 'flight', 'bus', 'train', 'cab'])
const MAX_COMMENT = 2000

// One review per booking. Keying the document on the booking makes duplicate
// reviews impossible and ties every rating to a real, completed stay or trip.
const reviewDocId = (bookingDocId) => `rv_${bookingDocId}`


export const createReview = async (req, res) => {
  try {
    const { bookingDocId, rating, comment, title } = req.body
    const userId = req.principal.uid

    const numericRating = Number(rating)
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a whole number from 1 to 5' })
    }
    if (!bookingDocId) {
      return res.status(400).json({ success: false, message: 'bookingDocId is required' })
    }

    const bookingSnap = await db.collection('bookings').doc(bookingDocId).get()
    if (!bookingSnap.exists) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }

    const booking = bookingSnap.data()

    // Reviews are only credible if the reviewer actually took the trip.
    if (booking.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Booking not found' })
    }
    if (booking.status === 'cancelled') {
      return res.status(409).json({ success: false, message: 'A cancelled booking cannot be reviewed' })
    }
    if (!REVIEWABLE.has(booking.type)) {
      return res.status(400).json({ success: false, message: `${booking.type} bookings cannot be reviewed` })
    }

    const ref = db.collection('reviews').doc(reviewDocId(bookingDocId))

    const created = await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref)
      if (existing.exists) {
        const err = new Error('You have already reviewed this booking')
        err.code = 'DUPLICATE'
        throw err
      }

      const doc = {
        bookingDocId,
        bookingId: booking.bookingId ?? null,
        userId,
        userName: booking.userName ?? req.principal.email ?? 'Traveller',
        type: booking.type,
        subjectId: booking.hotelId ?? booking.flightId ?? booking.busId ?? booking.trainId ?? booking.cabId ?? null,
        vendorId: booking.vendorId ?? null,
        rating: numericRating,
        title: sanitizeText(title, 140) || null,
        comment: sanitizeText(comment, MAX_COMMENT) || null,
        status: 'published',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
        isDeleted: false
      }

      tx.set(ref, doc)
      return { id: ref.id, ...doc }
    })

    writeAuditLog({
      req,
      action: 'review_created',
      entity: 'reviews',
      entityId: created.id,
      newValue: { rating: numericRating, type: booking.type, bookingId: booking.bookingId }
    })

    res.status(201).json({ success: true, data: created })
  } catch (err) {
    if (err.code === 'DUPLICATE') {
      return res.status(409).json({ success: false, message: err.message })
    }
    console.error('Create review failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not save your review' })
  }
}

export const listMyReviews = async (req, res) => {
  try {
    const snap = await db.collection('reviews').where('userId', '==', req.principal.uid).get()
    const reviews = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => !r.isDeleted)
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))

    res.json({ success: true, data: reviews })
  } catch (err) {
    console.error('List my reviews failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load your reviews' })
  }
}

// Public: reviews for one listing, plus its rating summary.
export const listSubjectReviews = async (req, res) => {
  try {
    const { subjectId } = req.params
    const snap = await db.collection('reviews').where('subjectId', '==', subjectId).get()

    const reviews = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((r) => !r.isDeleted && r.status === 'published')

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of reviews) distribution[r.rating] = (distribution[r.rating] ?? 0) + 1

    const average = reviews.length
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2))
      : null

    res.json({
      success: true,
      data: {
        // Reviewer identity is trimmed to a display name — the stored document
        // also holds the userId and booking reference, which are not public.
        reviews: reviews
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
          .map((r) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            userName: r.userName,
            createdAt: r.createdAt ?? null
          })),
        summary: { count: reviews.length, average, distribution }
      }
    })
  } catch (err) {
    console.error('List subject reviews failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load reviews' })
  }
}

export const deleteReview = async (req, res) => {
  try {
    const ref = db.collection('reviews').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Review not found' })

    const review = snap.data()
    if (review.userId !== req.principal.uid && !isPrivileged(req.principal.role)) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    // Soft delete: ratings history stays auditable.
    await ref.update({
      isDeleted: true,
      status: 'removed',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: req.principal.uid
    })

    writeAuditLog({
      req,
      action: 'review_deleted',
      entity: 'reviews',
      entityId: req.params.id,
      oldValue: { rating: review.rating, status: review.status },
      newValue: { status: 'removed' }
    })

    res.json({ success: true, message: 'Review removed' })
  } catch (err) {
    console.error('Delete review failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not remove review' })
  }
}
