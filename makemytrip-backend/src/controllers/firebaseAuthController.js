import { db } from '../config/firebase.js'
import { now } from '../utils/time.js'
import { Role, AccountStatus, resolveRole, resolveAccountStatus } from '../config/roles.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js'
import * as otpService from '../services/otpService.js'
import { sendOtpSms, toE164, maskPhone, providerStatus } from '../services/sms/smsService.js'
import { normalizeEmail, findUserByEmail } from '../utils/identity.js'
import { validateEmail as sharedValidateEmail, describePasswordWeakness } from '../utils/validation.js'
import {
  issueSession,
  rotateSession,
  revokeSession,
  revokeAllSessions,
  listSessions,
  currentTokenVersion
} from '../services/tokenService.js'
import { respondIfDatastoreDown } from '../utils/datastoreErrors.js'

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not set. Add it to makemytrip-backend/.env before starting the server.')
}

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Opens a revocable session and returns the credentials the client stores.
 *
 * Replaces a bare 7-day `jwt.sign`. That token could not be revoked: logout was
 * a no-op, a password reset left every existing session working, and a stolen
 * token stayed valid for a week.
 */
const openSession = async (user, req) => {
  const principal = {
    id: user.id,
    email: user.email ?? null,
    role: resolveRole(user),
    accountStatus: resolveAccountStatus(user),
    tokenVersion: currentTokenVersion(user)
  }

  const session = await issueSession(principal, {
    userAgent: req?.headers?.['user-agent'] ?? null,
    ip: req?.ip ?? null
  })

  return session
}

// These were local re-implementations that had drifted below the shared policy:
// the email check accepted addresses of unbounded length, and the password check
// enforced only a length, while `describePasswordWeakness` (already used by the
// admin and vendor paths) also requires a digit and a lowercase letter. Two
// definitions of "valid password" in one codebase means the weaker one is the
// real one.
const validateEmail = sharedValidateEmail

const passwordProblem = (password) => describePasswordWeakness(password, { strict: false })

// ── FIREBASE REGISTER ──
export const firebaseRegister = async (req, res) => {
  try {
    const { name, password, phone } = req.body

    // Addresses are canonicalised before anything is keyed on them, so a
    // capitalised signup cannot create a second account or lock the owner out
    // of the lowercased OTP and password-reset paths.
    const email = normalizeEmail(req.body.email)

    console.log(`📝 Firebase Registration attempt for: ${email}`)

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields (name, email, password, phone) are required.' })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address format.' })
    }

    const weakPassword = passwordProblem(password)
    if (weakPassword) {
      return res.status(400).json({ message: weakPassword })
    }

    // The number is stored, indexed, and used as a login identifier, so it has
    // to be a number. Unvalidated, this field accepted arbitrary strings —
    // there is a live account whose phone is the literal text "password12".
    const phoneE164 = toE164(phone)
    if (!phoneE164) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' })
    }

    // Checked against both casings so a legacy mixed-case record still blocks a
    // duplicate signup for the same address.
    const existingUser = await findUserByEmail(db, req.body.email)
    if (existingUser) {
      console.log(`⚠️ Registration: Email ${email} already exists`)
      return res.status(409).json({ message: 'Email address already registered.' })
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10)
    const userId = `user_${Date.now()}`

    console.log(`💾 Creating Firestore document for ${email}...`)

    // Create user in Firestore
    await db.collection('users').doc(email).set({
      id: userId,
      email,
      name,
      phone,
      // Indexed, canonical form of the number. Phone login queries this field;
      // without it the lookup degrades to scanning the whole users collection.
      phoneE164,
      password: hashed,
      is_admin: false,
      role: Role.CUSTOMER,
      accountStatus: AccountStatus.ACTIVE,
      permissionsVersion: 1,
      // Bumped to invalidate every session for this account at once.
      tokenVersion: 1,
      revokedSessions: [],
      createdAt: now(),
      updatedAt: now(),
      isDeleted: false
    })

    console.log(`✅ Firebase Registration: Created user ${email} with ID ${userId}`)

    // Fire-and-forget: a mail outage must not fail an otherwise successful signup.
    // An ISO string, not a Timestamp: this is a template variable the email
    // renders, not a stored field.
    sendWelcomeEmail({ id: userId, name, email, createdAt: new Date().toISOString() })
      .then(r => r.success
        ? console.log(`📧 Welcome email delivered to ${email} (${r.messageId})`)
        : console.warn(`⚠️ Welcome email not delivered to ${email}: ${r.error}`))
      .catch(e => console.warn('⚠️ Welcome email error:', e.message))

    const session = await openSession(
      { id: userId, email, role: Role.CUSTOMER, accountStatus: AccountStatus.ACTIVE, tokenVersion: 1 },
      req
    )

    res.status(201).json({
      data: {
        user: { id: userId, name, email, phone, is_admin: false },
        token: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    // The internal message is logged, never returned: it carries Firestore
    // paths, field names and index hints that describe the datastore to an
    // attacker.
    console.error('Firebase Register error:', err.message)
    console.error('Stack:', err.stack)
    res.status(500).json({ message: 'Registration failed. Please try again.' })
  }
}

// ── FIREBASE LOGIN ──
export const firebaseLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    console.log(`🔐 Firebase Login attempt for: ${normalizeEmail(email)}`)

    const found = await findUserByEmail(db, email)

    if (!found) {
      console.log(`❌ Firebase Login: User not found in Firestore`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const user = found.data

    if (!user.password) {
      console.error(`❌ User ${email} has no password stored`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      console.log(`❌ Firebase Login: Invalid password`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // Checked after the password so this cannot be used to discover which
    // addresses are suspended without knowing the credential.
    //
    // Login previously ignored account status entirely: a suspended or banned
    // account still received a 7-day token. loadPrincipal blocks it on booking
    // routes, but any route guarded by `authenticate` alone accepted it.
    const accountStatus = resolveAccountStatus(user)
    if (accountStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `Your account is ${accountStatus}. Contact support if you believe this is an error.`
      })
    }

    const session = await openSession(user, req)
    console.log(`✅ Firebase Login successful`)

    res.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          is_admin: user.is_admin || false
        },
        token: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    console.error('Firebase Login error:', err.message)
    console.error('Stack:', err.stack)
    res.status(500).json({ message: 'Login failed. Please try again.' })
  }
}

// ── FIREBASE GET PROFILE ──
export const firebaseGetProfile = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const snapshot = await db.collection('users').where('id', '==', userId).limit(1).get()

    if (snapshot.empty) {
      return res.status(404).json({ message: 'User not found' })
    }

    const userFound = snapshot.docs[0].data()

    res.json({
      data: {
        user: {
          id: userFound.id,
          name: userFound.name,
          email: userFound.email,
          phone: userFound.phone,
          is_admin: userFound.is_admin || false
        }
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    console.error('Get profile error:', err)
    res.status(500).json({ message: 'Could not load your profile. Please try again.' })
  }
}

// ── FIREBASE LOGOUT ──
//
// Was a no-op that returned a success message while leaving the token valid for
// its full lifetime. It now ends the session server-side: the refresh token
// stops working, and the access token is rejected by the guards on its next use.
export const firebaseLogout = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    const found = await db.collection('users').where('id', '==', userId).limit(1).get()
    const userRef = found.empty ? null : found.docs[0].ref

    // `everywhere` ends every session for the account, for "sign out of all
    // devices" and for a user who believes their account is compromised.
    if (req.body?.everywhere === true) {
      const result = await revokeAllSessions(userRef)
      return res.json({
        success: true,
        message: 'Signed out of all devices.',
        data: { sessionsEnded: result.sessions ?? 0 }
      })
    }

    await revokeSession({ userRef, decoded: req.user })
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    console.error('Logout error:', err.message)
    res.status(500).json({ message: 'Logout failed. Please try again.' })
  }
}

// ── REFRESH ──
//
// Access tokens are short-lived so a stolen one expires quickly. This exchanges
// a long-lived refresh token for a fresh pair, rotating the refresh token so a
// stolen one cannot be used alongside the legitimate holder's indefinitely.
export const firebaseRefresh = async (req, res) => {
  try {
    const { refreshToken } = req.body

    const result = await rotateSession(refreshToken, async (userId) => {
      const snap = await db.collection('users').where('id', '==', userId).limit(1).get()
      return snap.empty ? null : snap.docs[0].data()
    })

    if (!result.ok) {
      return res.status(401).json({ success: false, code: result.code, message: result.message })
    }

    // A session must not outlive the account's right to it.
    const status = resolveAccountStatus(result.user)
    if (status !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `Your account is ${status}.`
      })
    }

    res.json({
      success: true,
      data: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          is_admin: result.user.is_admin || false
        }
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    console.error('Refresh error:', err.message)
    res.status(500).json({ success: false, message: 'Could not refresh your session.' })
  }
}

// ── ACTIVE SESSIONS ──
export const firebaseListSessions = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    const sessions = await listSessions(userId)

    res.json({
      success: true,
      data: sessions.map((s) => ({
        sid: s.sid,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
        userAgent: s.userAgent,
        current: s.sid === req.user?.sid
      }))
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    console.error('List sessions error:', err.message)
    res.status(500).json({ success: false, message: 'Could not load your sessions.' })
  }
}

// ── FIREBASE FORGOT PASSWORD ──
export const firebaseForgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' })
    }

    // otpService keys its documents on the lowercased identifier, so the
    // account lookup must use the same canonical form or a mixed-case account
    // silently receives no reset code at all.
    const address = normalizeEmail(email)
    const found = await findUserByEmail(db, email)

    // Always respond the same way so the endpoint can't be used to enumerate accounts
    const genericResponse = { success: true, message: 'If this email is registered, a reset code has been sent.' }

    if (!found) {
      console.log(`⚠️ Forgot password: address not registered`)
      return res.json(genericResponse)
    }

    const { otp, ttlMinutes, resendAfterSeconds } = await otpService.issueOtp({
      identifier: address,
      channel: 'email',
      purpose: 'password_reset'
    })

    const mail = await sendOTPEmail(address, otp, 'password_reset', ttlMinutes)
    if (!mail.success) {
      // Don't leave a live code behind for an email that never went out.
      await otpService.clearOtp({ identifier: address, channel: 'email', purpose: 'password_reset' })
      console.error(`❌ Password reset OTP email failed for ${address}: ${mail.error}`)
      return res.status(502).json({
        success: false,
        message: 'We could not send the reset code right now. Please try again in a moment.'
      })
    }

    console.log(`📧 Password reset OTP delivered to ${address}`)
    res.json({ ...genericResponse, data: { expiresInMinutes: ttlMinutes, resendAfterSeconds } })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    if (err.code === 'EOTPCOOLDOWN' || err.code === 'EOTPTHROTTLE') {
      return res.status(429).json({ success: false, message: err.message, retryAfter: err.retryAfter })
    }
    console.error('Forgot password error:', err.message)
    res.status(500).json({ message: 'Failed to process password reset request.' })
  }
}

// ── FIREBASE RESET PASSWORD ──
export const firebaseResetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body

    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' })
    }

    const weakPassword = passwordProblem(password)
    if (weakPassword) {
      return res.status(400).json({ message: weakPassword })
    }

    const address = normalizeEmail(email)

    const check = await otpService.verifyOtp({
      identifier: address,
      channel: 'email',
      purpose: 'password_reset',
      otp
    })

    if (!check.ok) {
      return res.status(400).json({ success: false, code: check.code, message: check.message })
    }

    // Resolve the account rather than assuming the canonical document exists:
    // a legacy mixed-case record must have its own password updated, not have a
    // new empty document created alongside it.
    const found = await findUserByEmail(db, email)
    if (!found) {
      return res.status(404).json({ success: false, message: 'No account is registered with this email address.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    await found.ref.update({
      password: hashed,
      updatedAt: now()
    })

    // Someone resetting a password is very often locking an intruder out. A
    // session that predates the reset must not survive it, so every existing
    // token for this account is invalidated.
    await revokeAllSessions(found.ref)

    console.log(`✅ Password reset successful for ${address}`)
    res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    console.error('Reset password error:', err.message)
    res.status(500).json({ message: 'Failed to reset password.' })
  }
}

// ── MOBILE OTP: SEND / RESEND ──
// Generates a real code, delivers it over a real SMS provider, and only then
// reports success. A delivery failure clears the code and returns an error.
export const firebaseSendMobileOtp = async (req, res) => {
  const { phone } = req.body

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Mobile number is required.' })
  }

  const e164 = toE164(phone)
  if (!e164) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PHONE',
      message: 'Enter a valid 10-digit mobile number.'
    })
  }

  let issued = null
  try {
    issued = await otpService.issueOtp({ identifier: e164, channel: 'sms', purpose: 'login' })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    if (err.code === 'EOTPCOOLDOWN' || err.code === 'EOTPTHROTTLE') {
      return res.status(429).json({
        success: false,
        code: err.code === 'EOTPCOOLDOWN' ? 'OTP_COOLDOWN' : 'OTP_THROTTLED',
        message: err.message,
        retryAfter: err.retryAfter
      })
    }
    console.error('Send OTP error (issue):', err.message)
    return res.status(500).json({ success: false, message: 'Could not generate a verification code. Please try again.' })
  }

  try {
    const delivery = await sendOtpSms(e164, issued.otp, issued.ttlMinutes)

    return res.json({
      success: true,
      message: delivery.live
        ? `Verification code sent to ${delivery.masked}`
        : `Verification code generated for ${delivery.masked}. SMS_PROVIDER is "console" — the code was printed to the server terminal, not delivered.`,
      data: {
        phone: e164,
        maskedPhone: delivery.masked,
        delivered: delivery.live,
        channel: 'sms',
        expiresInMinutes: issued.ttlMinutes,
        resendAfterSeconds: issued.resendAfterSeconds
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    // No live code may outlive a failed delivery.
    await otpService.clearOtp({ identifier: e164, channel: 'sms', purpose: 'login' })

    if (err.code === 'ESMSCONFIG') {
      console.error(`❌ SMS not configured — cannot send OTP to ${maskPhone(e164)}`)
      return res.status(503).json({
        success: false,
        code: 'SMS_NOT_CONFIGURED',
        message: 'SMS delivery is not configured on the server. Please sign in with email instead.'
      })
    }

    console.error(`❌ SMS delivery failed for ${maskPhone(e164)}: ${err.message}`)
    return res.status(502).json({
      success: false,
      code: 'SMS_DELIVERY_FAILED',
      message: 'We could not send the code to that number. Please check the number and try again.'
    })
  }
}

// ── EMAIL OTP: SEND / RESEND (passwordless email login) ──
export const firebaseSendEmailOtp = async (req, res) => {
  const { email } = req.body

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, code: 'INVALID_EMAIL', message: 'Enter a valid email address.' })
  }

  const address = normalizeEmail(email)

  let issued = null
  try {
    issued = await otpService.issueOtp({ identifier: address, channel: 'email', purpose: 'login' })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    if (err.code === 'EOTPCOOLDOWN' || err.code === 'EOTPTHROTTLE') {
      return res.status(429).json({
        success: false,
        code: err.code === 'EOTPCOOLDOWN' ? 'OTP_COOLDOWN' : 'OTP_THROTTLED',
        message: err.message,
        retryAfter: err.retryAfter
      })
    }
    console.error('Send email OTP error (issue):', err.message)
    return res.status(500).json({ success: false, message: 'Could not generate a verification code. Please try again.' })
  }

  const mail = await sendOTPEmail(address, issued.otp, 'login', issued.ttlMinutes)

  if (!mail.success) {
    await otpService.clearOtp({ identifier: address, channel: 'email', purpose: 'login' })
    console.error(`❌ OTP email failed for ${address}: ${mail.error}`)
    return res.status(502).json({
      success: false,
      code: 'EMAIL_DELIVERY_FAILED',
      message: 'We could not email your verification code. Please try again in a moment.'
    })
  }

  res.json({
    success: true,
    message: `Verification code sent to ${address}`,
    data: {
      email: address,
      delivered: true,
      channel: 'email',
      expiresInMinutes: issued.ttlMinutes,
      resendAfterSeconds: issued.resendAfterSeconds
    }
  })
}

/**
 * Resolves an account by mobile number.
 *
 * The indexed `phoneE164` lookup is the real path. The scan below it only
 * covers records written before that field existed, and it self-heals: any
 * legacy record it matches is backfilled so the next login for that number is
 * an indexed read.
 *
 * The scan used to be the ONLY path, capped at `limit(1000)` — which meant
 * that past a thousand accounts, phone login stopped working for whoever fell
 * outside the first page, and every single login read the entire collection.
 */
const findUserByPhone = async (e164) => {
  const indexed = await db.collection('users').where('phoneE164', '==', e164).limit(1).get()
  if (!indexed.empty) {
    return { ref: indexed.docs[0].ref, ...indexed.docs[0].data() }
  }

  // Legacy fallback: numbers stored raw, before canonicalisation. Matched on
  // the last 10 digits so formatting differences (+91, spaces, hyphens) hit.
  const tail = e164.slice(-10)
  const snap = await db.collection('users').select('phone').get()
  const hit = snap.docs.find((d) => {
    const p = String(d.data().phone || '').replace(/\D/g, '')
    return p && p.slice(-10) === tail
  })
  if (!hit) return null

  // Backfill so this number never costs a full scan again.
  await hit.ref.update({ phoneE164: e164, updatedAt: now() }).catch(() => {})

  const full = await hit.ref.get()
  return { ref: hit.ref, ...full.data() }
}

// ── VERIFY OTP (mobile login, email login, and password-reset pre-check) ──
export const firebaseVerifyOtp = async (req, res) => {
  try {
    const { phone, email, otp, purpose } = req.body

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification code is required.' })
    }

    // ── Email path ──
    if (!phone && email) {
      const address = normalizeEmail(email)

      // Forgot-password screens pre-validate the code before showing the
      // new-password step. The code is NOT consumed here — firebaseResetPassword
      // performs the authoritative check.
      //
      // This previously read the OTP document directly and asserted only that
      // it existed and had not expired, never comparing the submitted code. Any
      // value at all was answered with "Code accepted", so the screen this gates
      // opened for anyone who knew an address with a reset in flight. It now
      // runs the same hash comparison as the real check, and a wrong code burns
      // an attempt from the same budget.
      if (purpose === 'password_reset') {
        const preCheck = await otpService.verifyOtp({
          identifier: address,
          channel: 'email',
          purpose: 'password_reset',
          otp,
          consume: false
        })

        if (!preCheck.ok) {
          return res.status(400).json({
            success: false,
            code: preCheck.code,
            message: preCheck.message,
            attemptsRemaining: preCheck.attemptsRemaining
          })
        }

        return res.json({ success: true, message: 'Code accepted. Enter your new password.' })
      }

      const check = await otpService.verifyOtp({ identifier: address, channel: 'email', purpose: 'login', otp })
      if (!check.ok) {
        return res.status(400).json({ success: false, code: check.code, message: check.message, attemptsRemaining: check.attemptsRemaining })
      }

      const found = await findUserByEmail(db, address)
      if (!found) {
        return res.status(404).json({ success: false, code: 'NO_ACCOUNT', message: 'No account is registered with this email address.' })
      }
      const user = found.data

      // A passwordless login is still a login: account status gates it exactly
      // as the password path does, or OTP becomes a way around a suspension.
      const emailStatus = resolveAccountStatus(user)
      if (emailStatus !== AccountStatus.ACTIVE) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_NOT_ACTIVE',
          message: `Your account is ${emailStatus}. Contact support if you believe this is an error.`
        })
      }

      console.log(`✅ Email OTP verified for ${address}`)
      const emailSession = await openSession(user, req)
      return res.json({
        success: true,
        message: 'Verification successful.',
        data: {
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, is_admin: user.is_admin || false },
          token: emailSession.accessToken,
          refreshToken: emailSession.refreshToken,
          expiresAt: emailSession.expiresAt
        }
      })
    }

    // ── Mobile path ──
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Mobile number or email is required.' })
    }

    const e164 = toE164(phone)
    if (!e164) {
      return res.status(400).json({ success: false, code: 'INVALID_PHONE', message: 'Enter a valid 10-digit mobile number.' })
    }

    const check = await otpService.verifyOtp({ identifier: e164, channel: 'sms', purpose: 'login', otp })
    if (!check.ok) {
      console.log(`❌ OTP verification failed for ${maskPhone(e164)}: ${check.code}`)
      return res.status(400).json({ success: false, code: check.code, message: check.message, attemptsRemaining: check.attemptsRemaining })
    }

    console.log(`✅ Mobile OTP verified for ${maskPhone(e164)}`)

    let user = await findUserByPhone(e164)
    let isNewUser = false

    if (!user) {
      isNewUser = true
      const userId = `user_${Date.now()}`
      const placeholderEmail = normalizeEmail(`user_${e164.replace('+', '')}@makemytrip.local`)
      user = {
        id: userId,
        phone: e164,
        phoneE164: e164,
        email: placeholderEmail,
        name: 'Traveller',
        is_admin: false,
        role: Role.CUSTOMER,
        accountStatus: AccountStatus.ACTIVE,
        profileComplete: false,
        tokenVersion: 1,
        revokedSessions: [],
        createdAt: now(),
        updatedAt: now(),
        isDeleted: false
      }
      await db.collection('users').doc(placeholderEmail).set(user)
      console.log(`👤 New account created for ${maskPhone(e164)}`)
    }

    // Passwordless login is gated on account status too — otherwise a
    // suspended customer just signs in by SMS instead.
    const phoneStatus = resolveAccountStatus(user)
    if (phoneStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_NOT_ACTIVE',
        message: `Your account is ${phoneStatus}. Contact support if you believe this is an error.`
      })
    }

    const phoneSession = await openSession(user, req)

    res.json({
      success: true,
      message: 'Verification successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          is_admin: user.is_admin || false,
          profileComplete: user.profileComplete !== false
        },
        token: phoneSession.accessToken,
        refreshToken: phoneSession.refreshToken,
        expiresAt: phoneSession.expiresAt,
        isNewUser
      }
    })
  } catch (err) {
    if (respondIfDatastoreDown(res, err, 'Sign-in')) return
    console.error('Verify OTP error:', err.message)
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' })
  }
}

// ── DELIVERY CHANNEL STATUS (drives the login UI's channel availability) ──
export const otpChannelStatus = async (_req, res) => {
  const { isConfigured: emailReady } = await import('../services/emailService.js')
  const sms = providerStatus()
  res.json({
    success: true,
    data: {
      sms: { available: sms.live, provider: sms.provider },
      email: { available: emailReady() },
      ...otpService.otpConfig()
    }
  })
}
