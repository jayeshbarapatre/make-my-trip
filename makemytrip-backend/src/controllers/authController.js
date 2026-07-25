import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import prisma from '../config/prismaClient.js'

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const validatePassword = (password) => {
  return password && password.length >= 8
}

// Simulated SMTP / mailer logging helper
const sendOTPEmail = async (email, otp) => {
  console.log('\n=============================================')
  console.log(`✉️  SIMULATED EMAIL SENT`)
  console.log(`👉 To: ${email}`)
  console.log(`👉 Verification OTP Code: [ ${otp} ] (Expires in 5 minutes)`)
  console.log('=============================================\n')

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    
    await transporter.sendMail({
      from: '"MakeMyTrip Auth" <support@makemytrip.local>',
      to: email,
      subject: 'MakeMyTrip Password Reset Verification Code',
      text: `Your password reset OTP verification code is ${otp}. This code is valid for 5 minutes.`,
      html: `<div style="font-family:sans-serif; padding:20px; border:1px solid #ddd; max-width:500px;">
               <h2>MakeMyTrip Auth Support</h2>
               <p>We received a password reset request for your account. Use the code below to reset your password:</p>
               <h1 style="color:#EB2026; font-size:32px; letter-spacing:4px;">${otp}</h1>
               <p>This verification code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
             </div>`
    })
  } catch (err) {
    // Suppress SMTP transport errors to keep backend stable
  }
}

// ── 1. Register / Signup ──
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields (name, email, password, phone) are required.' })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address format.' })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    const db = req.mockPrisma || prisma
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ message: 'Email address already registered.' })

    const hashed = await bcrypt.hash(password, 10)
    const newUser = await db.user.create({
      data: { name, email, password: hashed, phone, is_admin: false }
    })

    const token = signToken(newUser.id)
    res.status(201).json({
      data: { user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone, is_admin: false }, token }
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── 2. Login ──
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const db = req.mockPrisma || prisma
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return res.status(401).json({ message: 'Invalid email or password.' })

    const token = signToken(user.id)
    res.json({
      data: { user: { id: user.id, name: user.name, email: user.email, phone: user.phone, is_admin: user.is_admin }, token }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── 3. Forgot Password (OTP Generation) ──
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email address is required.' })

    const db = req.mockPrisma || prisma
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ message: 'No registered user found with this email.' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 5 * 60 * 1000)

    await db.user.update({ where: { email }, data: { otp, otpExpiry: expiry } })
    await sendOTPEmail(email, otp)
    res.json({ message: 'Verification OTP sent to your registered email address successfully!' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── 4. Verify OTP (Handles both Forgot Password & Mobile OTP) ──
export const verifyOtp = async (req, res) => {
  if (req.body.phone) {
    return verifyMobileOtp(req, res)
  }

  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP code are required.' })

    const db = req.mockPrisma || prisma
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ message: 'User not found.' })

    // Allow static OTP '123456' in development mode for testing
    const isStaticOtpValid = process.env.NODE_ENV !== 'production' && otp === '123456'
    const isStoredOtpValid = user.otp === otp && new Date() <= user.otpExpiry

    if (!isStaticOtpValid && !isStoredOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP code. Please double-check and try again.' })
    }

    console.log(`✅ OTP verified for ${email}${isStaticOtpValid ? ' (using static OTP for testing)' : ''}`)
    res.json({ message: 'OTP verified successfully! You may proceed to reset your password.' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── 5. Reset Password ──
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body
    if (!email || !otp || !password) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' })
    }

    const db = req.mockPrisma || prisma
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ message: 'User not found.' })

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Verification failed. Invalid OTP.' })
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'The verification code has expired.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    await db.user.update({
      where: { email },
      data: { password: hashed, otp: null, otpExpiry: null }
    })

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── 6. Get User Profile (Protected) ──
export const getProfile = async (req, res) => {
  try {
    const targetId = req.userId || req.user?.id
    const db = req.mockPrisma || prisma
    const user = await db.user.findUnique({
      where: { id: targetId }
    })
    if (user) {
      user = { id: user.id, name: user.name, email: user.email, phone: user.phone, is_admin: user.is_admin }
    }

    if (!user) return res.status(404).json({ message: 'User profile not found.' })

    res.json({ data: { user } })
  } catch (err) {
    console.error('Profile fetch error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const logout = (_req, res) => res.json({ message: 'Logged out successfully.' })

// ── 7. Razorpay-style Mobile OTP Login Handlers ──
export const sendMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ message: 'Mobile number is required.' })

    const db = req.mockPrisma || prisma
    let user = (await db.user.findMany()).find(u => u.phone === phone)
    let otp = Math.floor(100000 + Math.random() * 900000).toString()

    if (!user) {
      user = await db.user.create({
        data: {
          name: 'Guest User',
          email: `mobile_${phone}@makemytrip.local`,
          phone,
          password: 'temp',
          is_admin: false,
          otp,
          otpExpiry: new Date(Date.now() + 5 * 60 * 1000)
        }
      })
    } else {
      const expiry = new Date(Date.now() + 5 * 60 * 1000)
      await db.user.update({
        where: { id: user.id },
        data: { otp, otpExpiry: expiry }
      })
    }

    console.log('\n=============================================')
    console.log(`📱 SIMULATED SMS SENT (Razorpay Style Login)`)
    console.log(`👉 To Mobile: ${phone}`)
    console.log(`👉 MakeMyTrip Login OTP: [ ${otp} ]`)
    console.log('=============================================\n')

    res.json({
      message: 'OTP sent successfully via simulated SMS.'
    })
  } catch (err) {
    console.error('Send OTP error:', err.message)
    res.status(500).json({ message: 'Failed to send OTP: ' + err.message })
  }
}

export const verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) return res.status(400).json({ message: 'Phone number and OTP code are required.' })

    const db = req.mockPrisma || prisma
    let user = (await db.user.findMany()).find(u => u.phone === phone)
    if (!user) {
      return res.status(404).json({ message: 'No account found with this phone number.' })
    }

    // Allow static OTP '123456' in development mode for testing
    const isStaticOtpValid = process.env.NODE_ENV !== 'production' && otp === '123456'
    const isStoredOtpValid = user.otp === otp && (!user.otpExpiry || new Date() <= user.otpExpiry)

    if (!isStaticOtpValid && !isStoredOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP code.' })
    }

    await db.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null }
    })

    const token = signToken(user.id)
    console.log(`✅ Mobile OTP verified for ${phone}${isStaticOtpValid ? ' (using static OTP for testing)' : ''}`)
    res.json({
      data: { user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, token }
    })
  } catch (err) {
    console.error('Verify OTP error:', err.message)
    res.status(500).json({ message: 'OTP verification failed: ' + err.message })
  }
}

export const promoteToAdmin = async (req, res) => {
  try {
    if (!req.adminId) {
      return res.status(403).json({ message: 'Forbidden: Admin authorization required' })
    }

    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const db = req.mockPrisma || prisma
    const user = await db.user.update({
      where: { email },
      data: { is_admin: true }
    })

    res.json({ message: `User ${user.name} is now an admin`, data: { user } })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(500).json({ message: err.message })
  }
}
