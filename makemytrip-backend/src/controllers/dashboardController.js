import { db } from '../config/firebase.js'
import { toDate } from '../utils/time.js'
import { respondIfDatastoreDown } from '../utils/datastoreErrors.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// Firestore has no aggregate/group-by, so these handlers read the relevant
// collections once and fold them in memory. The collections are small enough
// for that; if they grow, the right move is a maintained counters document
// rather than paging the whole collection here.

const CANCELLED = new Set(['cancelled', 'refunded'])

const countOf = async (collection) => {
  const snap = await db.collection(collection).count().get()
  return snap.data().count
}

const activeDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => !x.isDeleted)

// Booking timestamps are ISO strings on records written by the Firestore
// controllers, and Timestamps on those written via FieldValue.serverTimestamp().

export const getDashboardStats = async (req, res) => {
  try {
    const [usersSnap, flightsSnap, hotelsSnap, bookingsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('flights').get(),
      db.collection('hotels').get(),
      db.collection('bookings').get()
    ])

    const flights = activeDocs(flightsSnap)
    const hotels = activeDocs(hotelsSnap)
    const bookings = activeDocs(bookingsSnap)

    const activeFlights = flights.filter((f) => f.isActive !== false).length
    const activeHotels = hotels.filter((h) => h.isActive !== false).length

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
          totalUsers: usersSnap.size,
          totalBookings: bookings.length,
          totalFlights: flights.length,
          totalHotels: hotels.length,
          totalRevenue
        },
        active: {
          activeFlights,
          inactiveFlights: flights.length - activeFlights,
          activeHotels,
          inactiveHotels: hotels.length - activeHotels
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
