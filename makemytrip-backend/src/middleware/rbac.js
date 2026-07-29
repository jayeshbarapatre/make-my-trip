import { db } from '../config/firebase.js'
import {
  AccountStatus,
  Role,
  isPrivileged,
  permissionsForRole,
  resolveAccountStatus,
  resolveRole,
  roleHasPermission
} from '../config/roles.js'

// `authenticate` establishes *who* the caller is from the JWT. These guards
// establish what they may do. They are deliberately separate so a route can
// never be protected by identity alone.

const forbidden = (res, message = 'You do not have permission to perform this action') =>
  res.status(403).json({ success: false, message })

/**
 * Re-reads role and account status from Firestore rather than trusting the
 * token. A token issued before a suspension would otherwise keep working for
 * its full 7-day lifetime.
 */
export const loadPrincipal = async (req, res, next) => {
  const userId = req.user?.id || req.userId
  if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' })

  try {
    let doc = null

    // Users are keyed by email, so look up by the indexed `id` field.
    const byId = await db.collection('users').where('id', '==', userId).limit(1).get()
    if (!byId.empty) doc = byId.docs[0].data()

    if (!doc && req.user?.email) {
      const byEmail = await db.collection('users').doc(req.user.email).get()
      if (byEmail.exists) doc = byEmail.data()
    }

    if (!doc) return res.status(401).json({ success: false, message: 'Account no longer exists' })

    const role = resolveRole(doc)
    const accountStatus = resolveAccountStatus(doc)

    if (accountStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `Your account is ${accountStatus}. Contact support if you believe this is an error.`
      })
    }

    req.principal = {
      uid: userId,
      email: doc.email ?? req.user?.email ?? null,
      role,
      accountStatus,
      permissions: permissionsForRole(role),
      vendorId: doc.vendorId ?? null
    }

    // Keep req.user in sync so audit logging and downstream handlers see the
    // authoritative role rather than whatever the token claimed.
    req.user = { ...req.user, id: userId, role, accountStatus }

    next()
  } catch (err) {
    console.error('loadPrincipal failed:', err.message)
    res.status(500).json({ success: false, message: 'Authorization check failed' })
  }
}

export const requirePermission = (...required) => (req, res, next) => {
  const role = req.principal?.role
  if (!role) return res.status(401).json({ success: false, message: 'Authentication required' })
  if (required.every((p) => roleHasPermission(role, p))) return next()
  return forbidden(res)
}

export const requireRole = (...roles) => (req, res, next) => {
  const role = req.principal?.role
  if (!role) return res.status(401).json({ success: false, message: 'Authentication required' })
  if (roles.includes(role)) return next()
  return forbidden(res)
}

export const requireAdmin = requireRole(Role.ADMIN, Role.SUPER_ADMIN)

/**
 * Vendor isolation. Admins pass through; a vendor may only touch documents
 * carrying their own vendorId. Call with the document under `resourceLoader`
 * so the check happens against stored data, never against a client-supplied id.
 */
export const requireOwnVendorResource = (resourceLoader) => async (req, res, next) => {
  const principal = req.principal
  if (!principal) return res.status(401).json({ success: false, message: 'Authentication required' })
  if (isPrivileged(principal.role)) return next()

  if (principal.role !== Role.VENDOR) return forbidden(res)

  try {
    const resource = await resourceLoader(req)
    if (!resource) return res.status(404).json({ success: false, message: 'Not found' })

    const ownerId = resource.vendorId ?? resource.ownerId ?? null
    if (!ownerId || ownerId !== principal.vendorId) {
      return forbidden(res, 'This item belongs to another vendor')
    }

    req.resource = resource
    next()
  } catch (err) {
    console.error('Vendor ownership check failed:', err.message)
    res.status(500).json({ success: false, message: 'Authorization check failed' })
  }
}

/** Ownership guard for customer-owned documents (bookings, refunds, tickets). */
export const requireOwnRecord = (resourceLoader, ownerField = 'userId') => async (req, res, next) => {
  const principal = req.principal
  if (!principal) return res.status(401).json({ success: false, message: 'Authentication required' })
  if (isPrivileged(principal.role)) return next()

  try {
    const resource = await resourceLoader(req)
    if (!resource) return res.status(404).json({ success: false, message: 'Not found' })

    if (resource[ownerField] !== principal.uid) {
      // 404 rather than 403: confirming existence would leak that another
      // user holds this booking id.
      return res.status(404).json({ success: false, message: 'Not found' })
    }

    req.resource = resource
    next()
  } catch (err) {
    console.error('Record ownership check failed:', err.message)
    res.status(500).json({ success: false, message: 'Authorization check failed' })
  }
}
