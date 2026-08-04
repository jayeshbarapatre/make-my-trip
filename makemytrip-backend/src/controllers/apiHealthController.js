import cacheService from '../services/cache/cacheService.js'
import { db } from '../config/firebase.js'
import { toDate, byNewest } from '../utils/time.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// Only today's bookings are needed. The date filter runs in memory rather than
// as a Firestore range query, because `createdAt` is an ISO string on some
// booking documents and a Timestamp on others, and a range filter never matches
// across types — the server-side version returned zero every time.
//
// The read is capped so an ever-growing order history cannot OOM the process.
// Once `npm run migrate:timestamps` has run everywhere this can go back to a
// server-side `where('createdAt', '>=', today)` using the declared index.

export const getApiHealth = async (_req, res) => {
  try {
    const cacheStats = cacheService.stats()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // The comment here used to assert that `createdAt` is always a
    // serverTimestamp. It is not: 27 of 46 stored bookings carry an ISO string,
    // and a Firestore range filter never matches across types — so this query
    // returned 0 and "bookings today" was permanently zero.
    //
    // Filtering on a normalised value is correct for both shapes. Restore the
    // indexed range query once `npm run migrate:timestamps` has run everywhere.
    const snap = await db.collection('bookings').limit(500).get()

    const todaysBookings = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => !b.isDeleted)
      .filter((b) => (toDate(b.createdAt)?.getTime() ?? 0) >= today.getTime())
      .sort(byNewest('createdAt'))
      .slice(0, 200)

    let bookingsConfirmed = 0
    let bookingsFailed = 0
    for (const b of todaysBookings) {
      if (String(b.status ?? '').toLowerCase() === 'confirmed') bookingsConfirmed++
      else bookingsFailed++
    }

    const flightSearchCount = cacheService.getKeysByPrefix('flight:').length
    const trainSearchCount = cacheService.getKeysByPrefix('train:').length

    res.json({
      success: true,
      cacheStats: {
        ...cacheStats,
        flightSearchCount,
        trainSearchCount,
        bookingsConfirmed,
        bookingsFailed
      },
      bookingLogs: todaysBookings.slice(0, 20).map((b) => ({
        bookingId: b.bookingId ?? b.id,
        type: b.type ?? null,
        status: b.status ?? b.bookingStatus ?? null,
        totalAmount: Number(b.totalAmount) || 0,
        createdAt: toDate(b.createdAt)?.toISOString() ?? null
      }))
    })
  } catch (error) {
    console.error('Error fetching API health:', error.message)
    res.status(500).json({ success: false, message: 'Failed to load API health' })
  }
}

export const flushCache = async (_req, res) => {
  try {
    cacheService.clear()
    res.json({
      success: true,
      message: 'Cache flushed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error flushing cache:', error.message)
    res.status(500).json({ success: false, message: 'Failed to flush cache' })
  }
}
