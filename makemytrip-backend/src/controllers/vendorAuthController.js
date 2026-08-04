import jwt from 'jsonwebtoken'
import { now } from '../utils/time.js'
import bcrypt from 'bcryptjs'
import { db } from '../config/firebase.js'
import { Role, AccountStatus, resolveRole, resolveAccountStatus } from '../config/roles.js'
import { writeAuditLog, AuditAction } from '../services/auditLog.js'
import { normalizeEmail, findUserByEmail } from '../utils/identity.js'
import { currentTokenVersion } from '../services/tokenService.js'

// Migrated from Prisma/MongoDB to Firestore, mirroring the admin migration.
//
// Vendors are `users` documents with role=vendor and a vendorId, so the same
// token works against the RBAC-protected APIs and the vendorId that every
// inventory query scopes on comes from one place.
//
// Self-service registration no longer grants vendor access on the spot — that
// would let anyone create a vendor account and publish inventory. New vendors
// go through the application workflow in vendorRequestController; an approved
// application is what grants the role.

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

// `tv` must be present and current — see the matching note in
// adminAuthController. authenticateVendor enforces revocation against it.
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

const publicVendor = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone ?? null,
  vendorId: u.vendorId ?? null,
  vendorName: u.vendorName ?? u.businessName ?? null,
  vendorType: u.vendorType ?? 'hotel',
  vendorStatus: u.accountStatus ?? AccountStatus.ACTIVE,
  // Retained for existing vendor UI checks.
  is_vendor: true
})

const findUserById = async (id) => {
  const snap = await db.collection('users').where('id', '==', id).limit(1).get()
  return snap.empty ? null : { ref: snap.docs[0].ref, data: snap.docs[0].data() }
}

export const vendorRegister = async (req, res) => {
  try {
    const { name, password, businessName } = req.body
    const email = normalizeEmail(req.body.email)

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const ref = db.collection('users').doc(email)
    if (await findUserByEmail(db, email)) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const id = `user_${Date.now()}`
    const doc = {
      id,
      name,
      email,
      phone: req.body.phone ?? null,
      password: await bcrypt.hash(password, 10),
      // Created as a customer. The vendor role is granted only when an admin
      // approves the application below.
      role: Role.CUSTOMER,
      accountStatus: AccountStatus.ACTIVE,
      vendorType: req.body.vendorType ?? 'hotel',
      createdAt: now(),
      updatedAt: now(),
      isDeleted: false
    }

    await ref.set(doc)

    // Open the onboarding application in the same shape the admin queue reads.
    const applicationRef = db.collection('vendor_requests').doc(`vr_${id}`)
    await applicationRef.set({
      userId: id,
      userEmail: email,
      businessName: businessName?.trim() || name,
      businessType: doc.vendorType,
      contactPhone: doc.phone,
      status: 'pending',
      rejectionReason: null,
      changeRequestNote: null,
      history: [{ status: 'pending', at: new Date().toISOString(), by: id, note: 'Submitted via vendor signup' }],
      createdAt: now(),
      updatedAt: now(),
      createdBy: id,
      updatedBy: id,
      isDeleted: false
    })

    writeAuditLog({
      req,
      action: 'vendor_request_submitted',
      entity: 'vendor_requests',
      entityId: `vr_${id}`,
      newValue: { email, businessName: businessName ?? name }
    })

    res.status(201).json({
      message: 'Your vendor application has been submitted and is pending review.',
      data: {
        vendor: { id, name, email, vendorType: doc.vendorType, vendorStatus: 'pending', is_vendor: false },
        token: signToken(doc),
        applicationStatus: 'pending'
      }
    })
  } catch (err) {
    console.error('Vendor register error:', err.message)
    res.status(500).json({ message: 'Registration failed' })
  }
}

export const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const found = await findUserByEmail(db, email)
    const user = found?.data ?? null

    // One message for every failure mode so this cannot be used to enumerate
    // which addresses exist or which of them are vendors.
    const reject = () => res.status(401).json({ message: 'Invalid credentials or not a vendor' })

    if (!user?.password) return reject()
    if (!(await bcrypt.compare(password, user.password))) return reject()

    if (resolveRole(user) !== Role.VENDOR) {
      // Distinguish "applied but not approved yet" so the UI can say something
      // useful, without revealing anything to a non-owner of the account.
      const application = await db.collection('vendor_requests').doc(`vr_${user.id}`).get()
      if (application.exists) {
        const status = application.data().status
        return res.status(403).json({
          code: 'APPLICATION_' + String(status).toUpperCase(),
          message: status === 'rejected'
            ? `Your vendor application was rejected. ${application.data().rejectionReason ?? ''}`.trim()
            : status === 'changes_requested'
              ? `Your application needs changes. ${application.data().changeRequestNote ?? ''}`.trim()
              : 'Your vendor application is still pending review.'
        })
      }
      return reject()
    }

    if (resolveAccountStatus(user) !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `This vendor account is ${resolveAccountStatus(user)}.`
      })
    }

    writeAuditLog({
      req,
      action: AuditAction.LOGIN,
      entity: 'users',
      entityId: user.id,
      newValue: { email, role: Role.VENDOR, portal: 'vendor' }
    })

    res.json({
      message: 'Login successful',
      data: { vendor: publicVendor(user), token: signToken(user) }
    })
  } catch (err) {
    console.error('Vendor login error:', err.message)
    res.status(500).json({ message: 'Login failed' })
  }
}

export const getVendorProfile = async (req, res) => {
  try {
    const found = await findUserById(req.principal?.uid)
    if (!found || resolveRole(found.data) !== Role.VENDOR) {
      return res.status(404).json({ message: 'Vendor not found' })
    }
    res.json({ data: { vendor: publicVendor(found.data) } })
  } catch (err) {
    console.error('Vendor profile error:', err.message)
    res.status(500).json({ message: 'Could not load profile' })
  }
}

export const vendorLogout = (req, res) => {
  writeAuditLog({ req, action: AuditAction.LOGOUT, entity: 'users', entityId: req.principal?.uid })
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

    const found = await findUserById(req.principal?.uid)
    if (!found) return res.status(404).json({ message: 'Vendor not found' })

    if (!(await bcrypt.compare(currentPassword, found.data.password))) {
      writeAuditLog({
        req,
        action: AuditAction.PASSWORD_RESET,
        entity: 'users',
        entityId: req.principal?.uid,
        status: 'failure',
        newValue: { reason: 'wrong_current_password' }
      })
      return res.status(401).json({ message: 'Invalid current password' })
    }

    await found.ref.update({
      password: await bcrypt.hash(newPassword, 10),
      updatedAt: now(),
      updatedBy: req.principal?.uid
    })

    writeAuditLog({ req, action: AuditAction.PASSWORD_RESET, entity: 'users', entityId: req.principal?.uid })

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Vendor change password error:', err.message)
    res.status(500).json({ message: 'Could not update password' })
  }
}
