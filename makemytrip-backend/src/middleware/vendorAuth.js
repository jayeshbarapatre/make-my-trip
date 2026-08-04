import jwt from 'jsonwebtoken'
import { db } from '../config/firebase.js'
import { Role, AccountStatus, resolveRole, resolveAccountStatus, permissionsForRole } from '../config/roles.js'
import { assertSessionLive } from '../services/tokenService.js'

// Migrated from Prisma to Firestore.
//
// Role, status and vendorId are re-read on every request rather than trusted
// from the token, so suspending a vendor or revoking their approval takes
// effect immediately instead of when their 8-hour token expires.
//
// req.vendorId is the tenant id every inventory query scopes on — it comes from
// the stored user document, never from the request.

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

export const authenticateVendor = async (req, res, next) => {
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
    const snap = await db.collection('users').where('id', '==', decoded.id).limit(1).get()
    if (snap.empty) {
      return res.status(403).json({ message: 'Forbidden: Vendor access required' })
    }

    const user = snap.docs[0].data()

    // Revocation, on the document already fetched — see tokenService.
    const live = assertSessionLive(decoded, user)
    if (!live.valid) {
      return res.status(401).json({ code: live.code, message: live.message })
    }

    const role = resolveRole(user)

    if (role !== Role.VENDOR) {
      return res.status(403).json({ message: 'Forbidden: Vendor access required' })
    }

    const accountStatus = resolveAccountStatus(user)
    if (accountStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `This vendor account is ${accountStatus}.`
      })
    }

    // An approved vendor always has a vendorId. Without one, every inventory
    // query would scope on `undefined` and could match another tenant's rows,
    // so refuse rather than guess.
    if (!user.vendorId) {
      return res.status(403).json({
        code: 'VENDOR_NOT_PROVISIONED',
        message: 'This vendor account has no vendor ID assigned. Contact support.'
      })
    }

    req.vendorId = user.vendorId
    req.user = { ...user, password: undefined, id: user.id, role }
    req.principal = {
      uid: user.id,
      email: user.email ?? null,
      role,
      accountStatus,
      permissions: permissionsForRole(role),
      vendorId: user.vendorId
    }

    next()
  } catch (err) {
    console.error('authenticateVendor failed:', err.message)
    res.status(500).json({ message: 'Authorization check failed' })
  }
}

export const vendorOnly = (req, res, next) => {
  if (!req.vendorId) {
    return res.status(403).json({ message: 'Forbidden: Vendor authentication required' })
  }
  next()
}
