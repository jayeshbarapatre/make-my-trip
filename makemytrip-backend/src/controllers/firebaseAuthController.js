import { db } from '../config/firebase.js'
import { Role, AccountStatus, resolveRole, resolveAccountStatus } from '../config/roles.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js'
import * as otpService from '../services/otpService.js'
import { sendOtpSms, toE164, maskPhone, providerStatus } from '../services/sms/smsService.js'

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not set. Add it to makemytrip-backend/.env before starting the server.')
}

const JWT_SECRET = process.env.JWT_SECRET

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email ?? null,
      role: resolveRole(user),
      accountStatus: resolveAccountStatus(user)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const validatePassword = (password) => {
  return password && password.length >= 8
}

// ── FIREBASE REGISTER ──
export const firebaseRegister = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    console.log(`📝 Firebase Registration attempt for: ${email}`)

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields (name, email, password, phone) are required.' })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address format.' })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    // Check if user exists
    const existingUser = await db.collection('users').doc(email).get()
    if (existingUser.exists) {
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
      password: hashed,
      is_admin: false,
      role: Role.CUSTOMER,
      accountStatus: AccountStatus.ACTIVE,
      permissionsVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    })

    console.log(`✅ Firebase Registration: Created user ${email} with ID ${userId}`)

    // Fire-and-forget: a mail outage must not fail an otherwise successful signup.
    sendWelcomeEmail({ id: userId, name, email, createdAt: new Date().toISOString() })
      .then(r => r.success
        ? console.log(`📧 Welcome email delivered to ${email} (${r.messageId})`)
        : console.warn(`⚠️ Welcome email not delivered to ${email}: ${r.error}`))
      .catch(e => console.warn('⚠️ Welcome email error:', e.message))

    const token = signToken({ id: userId, email, role: Role.CUSTOMER, accountStatus: AccountStatus.ACTIVE })
    res.status(201).json({
      data: {
        user: { id: userId, name, email, phone, is_admin: false },
        token
      }
    })
  } catch (err) {
    console.error('Firebase Register error:', err.message)
    console.error('Stack:', err.stack)
    res.status(500).json({ message: `Registration failed: ${err.message}` })
  }
}

// ── FIREBASE LOGIN ──
export const firebaseLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    console.log(`🔐 Firebase Login attempt for: ${email}`)

    // Get user from Firestore (stored by email as document ID)
    const userDoc = await db.collection('users').doc(email).get()

    if (!userDoc.exists) {
      console.log(`❌ Firebase Login: User ${email} not found in Firestore`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const user = userDoc.data()
    console.log(`✅ Firebase Login: Found user ${email}`)

    if (!user.password) {
      console.error(`❌ User ${email} has no password stored`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      console.log(`❌ Firebase Login: Invalid password for ${email}`)
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = signToken(user)
    console.log(`✅ Firebase Login successful for ${email}`)

    res.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          is_admin: user.is_admin || false
        },
        token
      }
    })
  } catch (err) {
    console.error('Firebase Login error:', err.message)
    console.error('Stack:', err.stack)
    res.status(500).json({ message: `Login failed: ${err.message}` })
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
    console.error('Get profile error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── FIREBASE LOGOUT ──
export const firebaseLogout = async (req, res) => {
  try {
    // JWT is stateless, logout happens on client by removing token
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── FIREBASE FORGOT PASSWORD ──
export const firebaseForgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' })
    }

    const userDoc = await db.collection('users').doc(email).get()

    // Always respond the same way so the endpoint can't be used to enumerate accounts
    const genericResponse = { success: true, message: 'If this email is registered, a reset code has been sent.' }

    if (!userDoc.exists) {
      console.log(`⚠️ Forgot password: ${email} not registered`)
      return res.json(genericResponse)
    }

    const { otp, ttlMinutes, resendAfterSeconds } = await otpService.issueOtp({
      identifier: email,
      channel: 'email',
      purpose: 'password_reset'
    })

    const mail = await sendOTPEmail(email, otp, 'password_reset', ttlMinutes)
    if (!mail.success) {
      // Don't leave a live code behind for an email that never went out.
      await otpService.clearOtp({ identifier: email, channel: 'email', purpose: 'password_reset' })
      console.error(`❌ Password reset OTP email failed for ${email}: ${mail.error}`)
      return res.status(502).json({
        success: false,
        message: 'We could not send the reset code right now. Please try again in a moment.'
      })
    }

    console.log(`📧 Password reset OTP delivered to ${email}`)
    res.json({ ...genericResponse, data: { expiresInMinutes: ttlMinutes, resendAfterSeconds } })
  } catch (err) {
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

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    const check = await otpService.verifyOtp({
      identifier: email,
      channel: 'email',
      purpose: 'password_reset',
      otp
    })

    if (!check.ok) {
      return res.status(400).json({ success: false, code: check.code, message: check.message })
    }

    const hashed = await bcrypt.hash(password, 10)
    await db.collection('users').doc(email).update({
      password: hashed,
      updatedAt: new Date().toISOString()
    })

    console.log(`✅ Password reset successful for ${email}`)
    res.json({ success: true, message: 'Password reset successfully. Please log in with your new password.' })
  } catch (err) {
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

  const address = email.trim().toLowerCase()

  let issued = null
  try {
    issued = await otpService.issueOtp({ identifier: address, channel: 'email', purpose: 'login' })
  } catch (err) {
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

const findUserByPhone = async (e164) => {
  // Numbers may have been stored before normalisation, so match on the last 10 digits.
  const tail = e164.slice(-10)
  const snap = await db.collection('users').limit(1000).get()
  const hit = snap.docs.find(d => {
    const p = String(d.data().phone || '').replace(/\D/g, '')
    return p && p.slice(-10) === tail
  })
  return hit ? { ref: hit.ref, ...hit.data() } : null
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
      const address = email.trim().toLowerCase()

      // Forgot-password screens pre-validate the code before showing the new-password step.
      // The code is NOT consumed here — firebaseResetPassword performs the authoritative check.
      if (purpose === 'password_reset') {
        const key = `password_reset_email_${address.replace(/[^a-z0-9+@._-]/gi, '')}`
        const doc = await db.collection('otps').doc(key).get()

        if (!doc.exists) {
          return res.status(400).json({ success: false, code: 'OTP_NOT_FOUND', message: 'No reset code found. Please request a new one.' })
        }
        if (new Date(doc.data().expiresAt) < new Date()) {
          return res.status(400).json({ success: false, code: 'OTP_EXPIRED', message: 'This reset code has expired. Please request a new one.' })
        }
        return res.json({ success: true, message: 'Code accepted. Enter your new password.' })
      }

      const check = await otpService.verifyOtp({ identifier: address, channel: 'email', purpose: 'login', otp })
      if (!check.ok) {
        return res.status(400).json({ success: false, code: check.code, message: check.message, attemptsRemaining: check.attemptsRemaining })
      }

      const userDoc = await db.collection('users').doc(address).get()
      if (!userDoc.exists) {
        return res.status(404).json({ success: false, code: 'NO_ACCOUNT', message: 'No account is registered with this email address.' })
      }
      const user = userDoc.data()

      console.log(`✅ Email OTP verified for ${address}`)
      return res.json({
        success: true,
        message: 'Verification successful.',
        data: {
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, is_admin: user.is_admin || false },
          token: signToken(user)
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
      const placeholderEmail = `user_${e164.replace('+', '')}@makemytrip.local`
      user = {
        id: userId,
        phone: e164,
        email: placeholderEmail,
        name: 'Traveller',
        is_admin: false,
        role: Role.CUSTOMER,
        accountStatus: AccountStatus.ACTIVE,
        profileComplete: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      }
      await db.collection('users').doc(placeholderEmail).set(user)
      console.log(`👤 New account created for ${maskPhone(e164)}`)
    }

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
        token: signToken(user),
        isNewUser
      }
    })
  } catch (err) {
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
