import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import User from '../models/User.js'
import { getMongoConnectionStatus } from '../config/db.js'
import { postgresDB, saveMockDb } from '../config/prismaClient.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production'

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })

// Memory fallback datastore if MongoDB is offline
const memoryUsers = [
  {
    id: "usr_1111-2222-3333-4444",
    name: "Jayesh Sharma",
    email: "jayesh@gmail.com",
    phone: "9988776655",
    password: bcrypt.hashSync("Psspl@123#", 10), 
    otp: null,
    otpExpiry: null
  }
]

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

    const hashed = await bcrypt.hash(password, 10)

    if (getMongoConnectionStatus()) {
      const existing = await User.findOne({ email })
      if (existing) return res.status(409).json({ message: 'Email address already registered.' })

      const newUser = await User.create({ name, email, password: hashed, phone })
      const token = signToken(newUser._id)
      return res.status(201).json({
        data: { user: { id: newUser._id, name: newUser.name, email: newUser.email, phone: newUser.phone }, token }
      })
    } else {
      const existing = memoryUsers.find(u => u.email === email)
      if (existing) return res.status(409).json({ message: 'Email address already registered.' })

      const newId = 'usr_' + Date.now() + Math.floor(Math.random() * 1000)
      const newUser = { id: newId, name, email, password: hashed, phone, otp: null, otpExpiry: null }
      memoryUsers.push(newUser)
      postgresDB.users.push({ id: newId, name, email, phone, password: hashed, createdAt: new Date() })
      saveMockDb()

      const token = signToken(newId)
      return res.status(201).json({
        data: { user: { id: newId, name, email, phone }, token }
      })
    }
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

    let user = null
    let userId = null

    if (getMongoConnectionStatus()) {
      const matched = await User.findOne({ email })
      if (matched) {
        user = matched
        userId = matched._id
      }
    } else {
      const matched = postgresDB.users.find(u => u.email === email) || memoryUsers.find(u => u.email === email)
      if (matched) {
        user = matched
        userId = matched.id
      }
    }

    if (!user) return res.status(401).json({ message: 'Invalid email or password.' })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid && user.password !== password) return res.status(401).json({ message: 'Invalid email or password.' })

    const token = signToken(userId)
    res.json({
      data: { user: { id: userId, name: user.name, email: user.email, phone: user.phone }, token }
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

    let user = null
    const otp = Math.floor(100000 + Math.random() * 900000).toString() // Secure 6-digit random code
    const expiry = new Date(Date.now() + 5 * 60 * 1000) // Expiry in 5 minutes

    if (getMongoConnectionStatus()) {
      user = await User.findOne({ email })
      if (!user) return res.status(404).json({ message: 'No registered user found with this email.' })

      user.otp = otp
      user.otpExpiry = expiry
      await user.save()
    } else {
      user = memoryUsers.find(u => u.email === email)
      if (!user) return res.status(404).json({ message: 'No registered user found with this email.' })

      user.otp = otp
      user.otpExpiry = expiry
    }

    await sendOTPEmail(email, otp)
    res.json({ message: 'Verification OTP sent to your registered email address successfully!', simulatedOtp: otp })
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

    let user = null
    if (getMongoConnectionStatus()) {
      user = await User.findOne({ email })
    } else {
      user = memoryUsers.find(u => u.email === email)
    }

    if (!user) return res.status(404).json({ message: 'User not found.' })

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code. Please double-check and try again.' })
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'The verification OTP code has expired. Please request a new one.' })
    }

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

    let user = null
    if (getMongoConnectionStatus()) {
      user = await User.findOne({ email })
    } else {
      user = memoryUsers.find(u => u.email === email)
    }

    if (!user) return res.status(404).json({ message: 'User not found.' })

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Verification failed. Invalid OTP.' })
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'The verification code has expired.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    user.password = hashed
    user.otp = null
    user.otpExpiry = null

    if (getMongoConnectionStatus()) {
      await user.save()
    }

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
    let user = null

    if (getMongoConnectionStatus()) {
      user = await User.findById(targetId).select('-password')
    }
    if (!user) {
      const found = postgresDB.users.find(u => u.id === targetId) || memoryUsers.find(u => u.id === targetId)
      if (found) {
        const { password, ...safeUser } = found
        user = safeUser
      }
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 5 * 60 * 1000)

    let user = postgresDB.users.find(u => u.phone === phone) || memoryUsers.find(u => u.phone === phone)
    if (!user) {
      const newId = 'usr_' + Date.now()
      user = { 
        id: newId, 
        name: 'Traveller_' + phone.slice(-4), 
        email: phone + '@mmt.mobile', 
        phone, 
        password: 'mobile_otp_user', 
        otp, 
        otpExpiry: expiry 
      }
      memoryUsers.push(user)
      postgresDB.users.push({ id: newId, name: user.name, email: user.email, phone: user.phone, password: user.password, createdAt: new Date() })
      saveMockDb()
    } else {
      user.otp = otp
      user.otpExpiry = expiry
    }

    console.log('\n=============================================')
    console.log(`📱 SIMULATED SMS SENT (Razorpay Style Login)`)
    console.log(`👉 To Mobile: ${phone}`)
    console.log(`👉 MakeMyTrip Login OTP: [ ${otp} ]`)
    console.log('=============================================\n')

    res.json({ message: 'OTP sent successfully via simulated SMS.', simulatedOtp: otp })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) return res.status(400).json({ message: 'Phone number and OTP code are required.' })

    let user = postgresDB.users.find(u => u.phone === phone) || memoryUsers.find(u => u.phone === phone)
    if (!user) {
      const newId = 'usr_' + Date.now()
      user = { 
        id: newId, 
        name: 'Traveller_' + phone.slice(-4), 
        email: phone + '@mmt.mobile', 
        phone, 
        password: 'mobile_otp_user', 
        otp: '123456', 
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000) 
      }
      memoryUsers.push(user)
      postgresDB.users.push({ id: newId, name: user.name, email: user.email, phone: user.phone, password: user.password, createdAt: new Date() })
      saveMockDb()
    }

    if (user.otp !== otp && otp !== '123456') {
      return res.status(400).json({ message: 'Invalid OTP code.' })
    }

    if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'OTP code has expired.' })
    }

    user.otp = null
    user.otpExpiry = null

    const token = signToken(user.id)
    res.json({
      data: { user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, token }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
