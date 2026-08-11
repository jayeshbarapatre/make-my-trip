import { db } from '../config/firebase.js'
import { toDate } from '../utils/time.js'
import { respondIfDatastoreDown } from '../utils/datastoreErrors.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// These handlers used to read every document in users, flights, hotels and
// bookings and fold them in memory — 1,352 reads for a single dashboard load
// against real data. Six such loads exhausted a tenth of the free tier's daily
// allowance, and one working session exhausted the lot: the database then
// refuses every read, so login and search stop too.
//
// Firestore does have aggregations (count/sum/average), despite what the note
// here used to claim. A count costs one read regardless of how many documents
// it spans, so the same figures now cost single digits.
//
// The arithmetic below reproduces the in-memory predicates exactly:
//   nonDeleted = total − (isDeleted == true)
//   active     = nonDeleted − (isActive == false AND isDeleted != true)
// `== false` and `== true` are used rather than `!=` because a Firestore
// inequality silently drops documents where the field is absent, and most of
// these documents have neither flag set.

const CANCELLED = new Set(['cancelled', 'refunded'])

const countOf = async (collection) => {
  const snap = await db.collection(collection).count().get()
  return snap.data().count
}

/** Counts matching documents in one read, whatever the collection size. */
const countWhere = async (collection, ...clauses) => {
  let q = db.collection(collection)
  for (const [field, op, value] of clauses) q = q.where(field, op, value)
  return (await q.count().get()).data().count
}

/**
 * Totals for one inventory collection, in four reads instead of one per row.
 * Mirrors `activeDocs(...)` + `.filter(x => x.isActive !== false)`.
 */
const inventoryTotals = async (collection) => {
  const [total, deleted, inactive, inactiveDeleted] = await Promise.all([
    countOf(collection),
    countWhere(collection, ['isDeleted', '==', true]),
    countWhere(collection, ['isActive', '==', false]),
    countWhere(collection, ['isActive', '==', false], ['isDeleted', '==', true])
  ])

  const live = total - deleted
  const inactiveLive = inactive - inactiveDeleted
  return { total: live, active: live - inactiveLive, inactive: inactiveLive }
}

const activeDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => !x.isDeleted)

// Booking timestamps are ISO strings on records written by the Firestore
// controllers, and Timestamps on those written via FieldValue.serverTimestamp().

export const getDashboardStats = async (req, res) => {
  try {
    // Inventory is counted, not read. Bookings are still read in full: the
    // revenue total and the per-type breakdown need each row, and that
    // collection is the one that stays small.
    const [totalUsers, flightTotals, hotelTotals, bookingsSnap] = await Promise.all([
      countOf('users'),
      inventoryTotals('flights'),
      inventoryTotals('hotels'),
      db.collection('bookings').get()
    ])

    const bookings = activeDocs(bookingsSnap)

    const activeFlights = flightTotals.active
    const activeHotels = hotelTotals.active

    const breakdown = { flight: 0, hotel: 0, bus: 0, cab: 0, train: 0 }
    let totalRevenue = 0

    for (const b of bookings) {
      if (breakdown[b.type] !== undefined) breakdown[b.type] += 1
      if (!CANCELLED.has(String(b.status ?? '').toLowerCase())) {
        totalRevenue += Number(b.totalAmount) || 0
      }
    }

    res.json({
      data: {
        summary: {
          totalUsers,
          totalBookings: bookings.length,
          totalFlights: flightTotals.total,
          totalHotels: hotelTotals.total,
          totalRevenue
        },
        active: {
          activeFlights,
          inactiveFlights: flightTotals.inactive,
          activeHotels,
          inactiveHotels: hotelTotals.inactive
        },
        bookingsBreakdown: breakdown
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Dashboard')) return
    console.error('Dashboard stats error:', err.message)
    res.status(500).json({ message: 'Failed to load dashboard statistics' })
  }
}

export const getRevenueData = async (req, res) => {
  try {
    const labels = []
    const revenueMap = new Map()

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setDate(1) // avoid month-end rollover (e.g. 31 Mar minus 1 month)
      date.setMonth(date.getMonth() - i)
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
      revenueMap.set(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, 0)
    }

    const startDate = new Date()
    startDate.setDate(1)
    startDate.setMonth(startDate.getMonth() - 11)
    startDate.setHours(0, 0, 0, 0)

    const snap = await db.collection('bookings').get()

    let total = 0
    let count = 0

    for (const doc of snap.docs) {
      const b = doc.data()
      if (b.isDeleted) continue
      if (CANCELLED.has(String(b.status ?? '').toLowerCase())) continue

      const created = toDate(b.createdAt)
      if (!created || created < startDate) continue

      const amount = Number(b.totalAmount) || 0
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`

      if (revenueMap.has(key)) revenueMap.set(key, revenueMap.get(key) + amount)

      total += amount
      count += 1
    }

    res.json({
      data: { labels, revenues: [...revenueMap.values()], total, count }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Dashboard')) return
    console.error('Revenue data error:', err.message)
    res.status(500).json({ message: 'Failed to fetch revenue data' })
  }
}

export const getRecentBookings = async (req, res) => {
  try {
    // No orderBy on createdAt: the field is a string on some documents and a
    // Timestamp on others, so Firestore would order them inconsistently. Sort
    // in memory on a normalised date instead.
    const snap = await db.collection('bookings').get()

    const bookings = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => !b.isDeleted)
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
      .slice(0, 10)
      .map((b) => ({
        id: b.bookingId || b.id,
        userName: b.userName || 'Unknown',
        email: b.userEmail || 'N/A',
        type: b.type,
        amount: Number(b.totalAmount) || 0,
        status: b.status || b.bookingStatus || 'unknown',
        date: toDate(b.createdAt)?.toISOString() ?? null
      }))

    res.json({ data: { bookings } })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Dashboard')) return
    console.error('Recent bookings error:', err.message)
    res.status(500).json({ message: 'Failed to load recent bookings' })
  }
}

export const getAvailabilityStats = async (req, res) => {
  try {
    const snap = await db.collection('flights').get()

    let available = 0
    let total = 0

    for (const doc of snap.docs) {
      const f = doc.data()
      if (f.isDeleted) continue
      const seats = Number(f.seats) || 0
      total += seats
      available += f.seatsAvailable !== undefined ? Number(f.seatsAvailable) || 0 : seats
    }

    res.json({ data: { flights: { available, total } } })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Dashboard')) return
    console.error('Availability stats error:', err.message)
    res.status(500).json({ message: 'Failed to load availability' })
  }
}
