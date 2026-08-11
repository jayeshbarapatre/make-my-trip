import jwt from 'jsonwebtoken'
import { db } from '../config/firebase.js'
import { AccountStatus, isPrivileged, resolveRole, resolveAccountStatus, permissionsForRole } from '../config/roles.js'
import { assertSessionLive } from '../services/tokenService.js'

// Migrated from Prisma to Firestore so the admin panel shares one identity
// store with the rest of the platform. Role and status are re-read on every
// request rather than trusted from the token, so revoking an admin takes
// effect immediately instead of when their 8-hour token expires.

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

export const authenticateAdmin = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' })
  }

  let decoded
  try {
    decoded = jwt.verify(header.slice(7), JWT_SECRET)
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired' })
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid or tampered token' })
    }
    return res.status(401).json({ message: 'Authentication failed' })
  }

  try {
    // Users collection is keyed by email address — a direct doc fetch is
    // O(1) and requires no index, unlike a .where('id', ...) collection scan.
    const email = decoded.email
    if (!email) {
      return res.status(403).json({ message: 'Forbidden: Token missing email claim' })
    }
    const docSnap = await db.collection('users').doc(email.toLowerCase().trim()).get()
    if (!docSnap.exists) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' })
    }

    const user = docSnap.data()

    // Same revocation signal as the customer guard, on the document this
    // handler already fetched. An admin whose access is pulled loses it on the
    // next request, not when their token happens to expire.
    const live = assertSessionLive(decoded, user)
    if (!live.valid) {
      return res.status(401).json({ code: live.code, message: live.message })
    }

    const role = resolveRole(user)

    if (!isPrivileged(role)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' })
    }

    const accountStatus = resolveAccountStatus(user)
    if (accountStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `This admin account is ${accountStatus}.`
      })
    }

    req.adminId = user.id
    req.user = { ...user, password: undefined, id: user.id, role }
    // Populated so admin routes can reuse the shared RBAC guards and audit
    // logging without a second lookup.
    req.principal = {
      uid: user.id,
      email: user.email ?? null,
      role,
      accountStatus,
      permissions: permissionsForRole(role),
      vendorId: user.vendorId ?? null
    }

    next()
  } catch (err) {
    console.error('authenticateAdmin failed:', err.message)
    res.status(500).json({ message: 'Authorization check failed' })
  }
}

export const adminOnly = (req, res, next) => {
  if (!req.adminId) {
    return res.status(403).json({ message: 'Forbidden: Admin authentication required' })
  }
  next()
}
