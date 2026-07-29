import { db } from '../config/firebase.js'
import { Role, isPrivileged } from '../config/roles.js'

// Reports read across users, so scoping is not optional. Every query here is
// built from the caller's principal — a vendor's query is narrowed to their own
// vendorId before it ever reaches Firestore, rather than filtered afterwards.

const toDate = (value) => {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const withinRange = (value, from, to) => {
  const d = toDate(value)
  if (!d) return false
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

export const parseRange = ({ from, to }) => {
  const fromDate = from ? new Date(from) : null
  const toDate_ = to ? new Date(to) : null
  // An end date with no time component should include that whole day.
  if (toDate_ && /^\d{4}-\d{2}-\d{2}$/.test(to)) toDate_.setHours(23, 59, 59, 999)

  return {
    from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null,
    to: toDate_ && !Number.isNaN(toDate_.getTime()) ? toDate_ : null
  }
}

const CANCELLED = new Set(['cancelled', 'refunded'])

/**
 * Loads bookings the principal is allowed to see.
 * - admin / super_admin: everything
 * - vendor: only bookings against their own inventory
 * - customer: only their own
 */
const loadScopedBookings = async (principal, { from, to }) => {
  let query = db.collection('bookings')

  if (principal.role === Role.VENDOR) {
    if (!principal.vendorId) return []
    query = query.where('vendorId', '==', principal.vendorId)
  } else if (!isPrivileged(principal.role)) {
    query = query.where('userId', '==', principal.uid)
  }

  const snap = await query.get()

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((b) => !b.isDeleted)
    .filter((b) => (from || to ? withinRange(b.createdAt, from, to) : true))
}

export const bookingReport = async (principal, range) => {
  const bookings = await loadScopedBookings(principal, range)

  return bookings
    .map((b) => ({
      bookingId: b.bookingId ?? b.id,
      pnr: b.pnr ?? null,
      type: b.type ?? null,
      status: b.status ?? b.bookingStatus ?? null,
      paymentStatus: b.paymentStatus ?? null,
      fromCity: b.fromCity ?? null,
      toCity: b.toCity ?? null,
      departureDate: b.departureDate ?? null,
      totalAmount: Number(b.totalAmount) || 0,
      userEmail: b.userEmail ?? null,
      createdAt: b.createdAt ?? null
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export const revenueReport = async (principal, range) => {
  const bookings = await loadScopedBookings(principal, range)

  // Group by calendar day and booking type so the numbers reconcile with the
  // booking report above rather than being computed from a different source.
  const buckets = new Map()

  for (const b of bookings) {
    const created = toDate(b.createdAt)
    if (!created) continue

    const day = created.toISOString().slice(0, 10)
    const type = b.type ?? 'unknown'
    const key = `${day}__${type}`

    if (!buckets.has(key)) {
      buckets.set(key, {
        date: day,
        type,
        bookings: 0,
        cancelled: 0,
        grossRevenue: 0,
        netRevenue: 0
      })
    }

    const bucket = buckets.get(key)
    const amount = Number(b.totalAmount) || 0
    const isCancelled = CANCELLED.has(String(b.status ?? '').toLowerCase())

    bucket.bookings += 1
    bucket.grossRevenue += amount
    if (isCancelled) bucket.cancelled += 1
    else bucket.netRevenue += amount
  }

  return Array.from(buckets.values()).sort(
    (a, b) => b.date.localeCompare(a.date) || a.type.localeCompare(b.type)
  )
}

export const refundReport = async (principal, range) => {
  let query = db.collection('refunds')

  if (principal.role === Role.VENDOR) {
    if (!principal.vendorId) return []
    query = query.where('vendorId', '==', principal.vendorId)
  } else if (!isPrivileged(principal.role)) {
    query = query.where('userId', '==', principal.uid)
  }

  const snap = await query.get()

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => !r.isDeleted)
    .filter((r) => (range.from || range.to ? withinRange(r.createdAt, range.from, range.to) : true))
    .map((r) => ({
      refundId: r.refundId ?? r.id,
      bookingId: r.bookingId ?? null,
      type: r.type ?? null,
      status: r.status ?? null,
      grossAmount: Number(r.grossAmount) || 0,
      cancellationFee: Number(r.cancellationFee) || 0,
      refundAmount: Number(r.refundAmount) || 0,
      gatewayRefundId: r.gatewayRefundId ?? null,
      policy: r.policy ?? null,
      createdAt: r.createdAt ?? null
    }))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
}

/** Admin-only: users have no vendor or per-customer view. */
export const userReport = async (range) => {
  const snap = await db.collection('users').get()

  return snap.docs
    .map((d) => d.data())
    .filter((u) => !u.isDeleted)
    .filter((u) => (range.from || range.to ? withinRange(u.createdAt, range.from, range.to) : true))
    .map((u) => ({
      userId: u.id ?? null,
      name: u.name ?? null,
      email: u.email ?? null,
      phone: u.phone ?? null,
      role: u.role ?? 'customer',
      accountStatus: u.accountStatus ?? 'active',
      createdAt: u.createdAt ?? null
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

/** Admin-only: per-vendor revenue rollup. */
export const vendorReport = async (range) => {
  const bookings = await loadScopedBookings(
    { role: Role.ADMIN, uid: null, vendorId: null },
    range
  )

  const byVendor = new Map()

  for (const b of bookings) {
    const vendorId = b.vendorId ?? 'unassigned'
    if (!byVendor.has(vendorId)) {
      byVendor.set(vendorId, { vendorId, bookings: 0, cancelled: 0, grossRevenue: 0, netRevenue: 0 })
    }
    const row = byVendor.get(vendorId)
    const amount = Number(b.totalAmount) || 0
    row.bookings += 1
    row.grossRevenue += amount
    if (CANCELLED.has(String(b.status ?? '').toLowerCase())) row.cancelled += 1
    else row.netRevenue += amount
  }

  return Array.from(byVendor.values()).sort((a, b) => b.netRevenue - a.netRevenue)
}

export const dashboardSummary = async (principal, range) => {
  const [bookings, refunds] = await Promise.all([
    bookingReport(principal, range),
    refundReport(principal, range)
  ])

  const cancelled = bookings.filter((b) => CANCELLED.has(String(b.status ?? '').toLowerCase()))
  const grossRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0)
  const cancelledValue = cancelled.reduce((sum, b) => sum + b.totalAmount, 0)
  const refundedOut = refunds
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.refundAmount, 0)

  const byType = {}
  for (const b of bookings) {
    const t = b.type ?? 'unknown'
    byType[t] = byType[t] || { bookings: 0, revenue: 0 }
    byType[t].bookings += 1
    byType[t].revenue += b.totalAmount
  }

  return {
    totalBookings: bookings.length,
    cancelledBookings: cancelled.length,
    grossRevenue,
    netRevenue: grossRevenue - cancelledValue,
    refundsCompleted: refunds.filter((r) => r.status === 'completed').length,
    refundsPending: refunds.filter((r) => !['completed', 'rejected', 'failed'].includes(r.status)).length,
    refundedAmount: refundedOut,
    averageBookingValue: bookings.length ? Math.round(grossRevenue / bookings.length) : 0,
    byType
  }
}
