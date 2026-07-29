import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from '../config/firebase.js'
import { Role, AccountStatus, resolveRole, resolveAccountStatus, isPrivileged } from '../config/roles.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'

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
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: resolveRole(user), accountStatus: resolveAccountStatus(user) },
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

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const ref = db.collection('users').doc(email)
    const existing = await ref.get()
    if (existing.exists) {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
      isDeleted: false
    }

    await ref.set(doc)

    writeAuditLog({
      req,
      action: 'admin_registered',
      entity: 'users',
      entityId: id,
      newValue: { email, role: Role.ADMIN }
    })

    res.status(201).json({
      message: 'Admin created successfully',
      data: { admin: publicAdmin(doc), token: signToken(doc) }
    })
  } catch (err) {
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

    const snap = await db.collection('users').doc(email).get()
    const user = snap.exists ? snap.data() : null

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
      updatedAt: new Date().toISOString(),
      updatedBy: req.adminId
    })

    writeAuditLog({ req, action: AuditAction.PASSWORD_RESET, entity: 'users', entityId: req.adminId })

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Admin change password error:', err.message)
    res.status(500).json({ message: 'Could not update password' })
  }
}
