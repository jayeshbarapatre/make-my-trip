import jwt from 'jsonwebtoken'
import { now } from '../utils/time.js'
import bcrypt from 'bcryptjs'
import { db } from '../config/firebase.js'
import { Role, AccountStatus, resolveRole, resolveAccountStatus, isPrivileged } from '../config/roles.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import { describePasswordWeakness, validateEmail } from '../utils/validation.js'
import { normalizeEmail, findUserByEmail } from '../utils/identity.js'
import { currentTokenVersion } from '../services/tokenService.js'
import { respondIfDatastoreDown } from '../utils/datastoreErrors.js'

// Migrated from Prisma/MongoDB to Firestore.
//
// The admin panel previously authenticated against a separate `prisma.user`
// table while every other identity lived in Firestore. That split meant an
// admin token could not be used against the RBAC-protected APIs at all, and
// the whole panel went down whenever MongoDB was unavailable. Admins are now
// ordinary `users` documents carrying an elevated role, so one token works
// everywhere and `loadPrincipal` can enforce status on them too.

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

// Shorter than the 7-day customer token: an admin session is higher value.
// `tv` must be present and current. authenticateAdmin compares it against the
// stored tokenVersion to enforce revocation; a token minted without the claim
// reads as version 1, so an admin whose sessions had ever been revoked could
// not sign back in.
const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: resolveRole(user),
      accountStatus: resolveAccountStatus(user),
      tv: currentTokenVersion(user)
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

const publicAdmin = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  role: resolveRole(user),
  // Retained so existing admin UI checks keep working.
  is_admin: true
})

const findUserById = async (id) => {
  const snap = await db.collection('users').where('id', '==', id).limit(1).get()
  return snap.empty ? null : { ref: snap.docs[0].ref, data: snap.docs[0].data() }
}

// Creating an administrator is a privilege-escalation operation, so it is only
// ever reachable by an already-authenticated super admin. The very first admin
// is provisioned out-of-band with `npm run admin:create`, which runs on the
// server with the service account and needs no HTTP surface at all.
//
// This endpoint was previously unauthenticated: any anonymous caller could POST
// here and receive a working admin token, which meant full read/write access to
// every user, booking and refund on the platform.
export const adminRegister = async (req, res) => {
  try {
    const actorRole = req.principal?.role
    if (actorRole !== Role.SUPER_ADMIN) {
      writeAuditLog({
        req,
        action: 'admin_register_denied',
        entity: 'users',
        entityId: req.body?.email ?? null,
        newValue: { attemptedBy: req.principal?.uid ?? 'anonymous', actorRole: actorRole ?? null },
        status: 'failure'
      })
      return res.status(403).json({
        message: 'Only a super admin may create administrator accounts'
      })
    }

    const { name, password } = req.body
    const email = normalizeEmail(req.body.email)

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const passwordProblem = describePasswordWeakness(password, { strict: true })
    if (passwordProblem) {
      return res.status(400).json({ message: passwordProblem })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }

    const ref = db.collection('users').doc(email)
    if (await findUserByEmail(db, email)) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const id = `admin_${Date.now()}`
    const hashed = await bcrypt.hash(password, 10)

    const doc = {
      id,
      name,
      email,
      phone: req.body.phone ?? null,
      password: hashed,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      is_admin: true,
      createdAt: now(),
      updatedAt: now(),
      createdBy: req.principal.uid,
      updatedBy: req.principal.uid,
      isDeleted: false
    }

    await ref.set(doc)

    writeAuditLog({
      req,
      action: 'admin_registered',
      entity: 'users',
      entityId: id,
      newValue: { email, role: Role.ADMIN, createdBy: req.principal.uid }
    })

    // Deliberately no token: the new admin authenticates with their own
    // credentials. Handing the creator a session for someone else's account
    // would make every admin action ambiguous in the audit trail.
    res.status(201).json({
      message: 'Admin created successfully',
      data: { admin: publicAdmin(doc) }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Admin sign-in')) return
    console.error('Admin register error:', err.message)
    res.status(500).json({ message: 'Registration failed' })
  }
}

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const found = await findUserByEmail(db, email)
    const user = found?.data ?? null

    // One message for every failure mode, so this cannot be used to discover
    // which addresses are registered or which of them are admins.
    const reject = () => res.status(401).json({ message: 'Invalid credentials or not an admin' })

    if (!user?.password) return reject()
    if (!isPrivileged(resolveRole(user))) return reject()
    if (!(await bcrypt.compare(password, user.password))) return reject()

    if (resolveAccountStatus(user) !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `This admin account is ${resolveAccountStatus(user)}.`
      })
    }

    writeAuditLog({
      req,
      action: AuditAction.LOGIN,
      entity: 'users',
      entityId: user.id,
      newValue: { email, role: resolveRole(user), portal: 'admin' }
    })

    res.json({
      message: 'Login successful',
      data: { admin: publicAdmin(user), token: signToken(user) }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Admin sign-in')) return
    console.error('Admin login error:', err.message)
    res.status(500).json({ message: 'Login failed' })
  }
}

export const getAdminProfile = async (req, res) => {
  try {
    const found = await findUserById(req.adminId)
    if (!found || !isPrivileged(resolveRole(found.data))) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    res.json({ data: { admin: publicAdmin(found.data) } })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Admin sign-in')) return
    console.error('Admin profile error:', err.message)
    res.status(500).json({ message: 'Could not load profile' })
  }
}

export const adminLogout = (req, res) => {
  writeAuditLog({ req, action: AuditAction.LOGOUT, entity: 'users', entityId: req.adminId })
  res.json({ message: 'Logged out successfully' })
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' })
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one number' })
    }

    const found = await findUserById(req.adminId)
    if (!found) return res.status(404).json({ message: 'Admin not found' })

    if (!(await bcrypt.compare(currentPassword, found.data.password))) {
      writeAuditLog({
        req,
        action: AuditAction.PASSWORD_RESET,
        entity: 'users',
        entityId: req.adminId,
        status: 'failure',
        newValue: { reason: 'wrong_current_password' }
      })
      return res.status(401).json({ message: 'Invalid current password' })
    }

    await found.ref.update({
      password: await bcrypt.hash(newPassword, 10),
      updatedAt: now(),
      updatedBy: req.adminId
    })

    writeAuditLog({ req, action: AuditAction.PASSWORD_RESET, entity: 'users', entityId: req.adminId })

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Admin sign-in')) return
    console.error('Admin change password error:', err.message)
    res.status(500).json({ message: 'Could not update password' })
  }
}
