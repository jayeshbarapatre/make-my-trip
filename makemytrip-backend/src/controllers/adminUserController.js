import { db } from '../config/firebase.js'
import { now, toDate } from '../utils/time.js'
import { Role, resolveRole } from '../config/roles.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import { revokeAllSessions } from '../services/tokenService.js'
import { respondIfDatastoreDown } from '../utils/datastoreErrors.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// Firestore cannot do case-insensitive contains, OR across fields, or offset
// pagination cheaply, so search and paging are applied in memory over the
// customer set. That is the same trade-off the rest of the admin surface makes.


const publicUser = (u, bookingCount) => ({
  id: u.id,
  name: u.name ?? null,
  email: u.email ?? null,
  phone: u.phone ?? null,
  role: resolveRole(u),
  accountStatus: u.accountStatus ?? 'active',
  createdAt: u.createdAt ?? null,
  // Kept under the key the existing admin UI reads.
  _count: { bookings: bookingCount }
})

export const getAllUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page) || 1)
    const perPage = Math.min(100, Math.max(1, parseInt(limit) || 20))

    const [usersSnap, bookingsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('bookings').get()
    ])

    // One pass over bookings instead of a per-user query.
    const bookingCounts = new Map()
    for (const doc of bookingsSnap.docs) {
      const b = doc.data()
      if (b.isDeleted || !b.userId) continue
      bookingCounts.set(b.userId, (bookingCounts.get(b.userId) ?? 0) + 1)
    }

    const term = String(search).trim().toLowerCase()

    let users = usersSnap.docs
      .map((d) => d.data())
      .filter((u) => !u.isDeleted)
      // The panel lists customers; admins and vendors have their own screens.
      .filter((u) => resolveRole(u) === Role.CUSTOMER)

    if (term) {
      users = users.filter((u) =>
        [u.name, u.email, u.phone].some((f) => String(f ?? '').toLowerCase().includes(term))
      )
    }

    users.sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))

    const total = users.length
    const start = (pageNum - 1) * perPage

    res.json({
      success: true,
      data: {
        users: users.slice(start, start + perPage).map((u) => publicUser(u, bookingCounts.get(u.id) ?? 0)),
        total,
        page: pageNum,
        totalPages: Math.max(1, Math.ceil(total / perPage))
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'User list')) return
    console.error('Get all users error:', err.message)
    res.status(500).json({ message: 'Failed to load users' })
  }
}

const findUserById = async (id) => {
  const snap = await db.collection('users').where('id', '==', id).limit(1).get()
  return snap.empty ? null : { ref: snap.docs[0].ref, data: snap.docs[0].data() }
}

export const deleteUser = async (req, res) => {
  try {
    const found = await findUserById(req.params.id)
    if (!found) return res.status(404).json({ message: 'User not found' })

    // Refuse to delete privileged accounts from the customer screen — that
    // should go through a deliberate role change, not a list-row action.
    if (resolveRole(found.data) !== Role.CUSTOMER) {
      return res.status(403).json({ message: 'Only customer accounts can be removed here' })
    }

    // Soft delete: bookings, refunds and audit rows reference this user, and
    // hard-deleting would orphan them.
    await found.ref.update({
      isDeleted: true,
      accountStatus: 'disabled',
      updatedAt: now(),
      updatedBy: req.adminId ?? null
    })

    // Disabling an account has to end its live sessions. Without this the user
    // keeps a working token until it expires, so "delete user" left the account
    // fully operational for up to a week.
    await revokeAllSessions(found.ref)

    writeAuditLog({
      req,
      action: AuditAction.USER_UPDATED,
      entity: 'users',
      entityId: req.params.id,
      oldValue: { accountStatus: found.data.accountStatus ?? 'active' },
      newValue: { isDeleted: true, accountStatus: 'disabled' }
    })

    res.json({ success: true, message: 'User deleted successfully' })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'User list')) return
    console.error('Delete user error:', err.message)
    res.status(500).json({ message: 'Failed to delete user' })
  }
}

export const getUserDetails = async (req, res) => {
  try {
    const found = await findUserById(req.params.id)
    if (!found) return res.status(404).json({ message: 'User not found' })

    const snap = await db.collection('bookings').where('userId', '==', req.params.id).get()

    const bookings = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => !b.isDeleted)
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
      .slice(0, 10)
      .map((b) => ({
        id: b.id,
        bookingId: b.bookingId ?? null,
        type: b.type ?? null,
        fromCity: b.fromCity ?? null,
        toCity: b.toCity ?? null,
        departureDate: b.departureDate ?? null,
        totalAmount: Number(b.totalAmount) || 0,
        status: b.status ?? b.bookingStatus ?? null,
        createdAt: b.createdAt ?? null
      }))

    const u = found.data
    res.json({
      success: true,
      data: { ...publicUser(u, bookings.length), bookings }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'User list')) return
    console.error('Get user details error:', err.message)
    res.status(500).json({ message: 'Failed to load user' })
  }
}
