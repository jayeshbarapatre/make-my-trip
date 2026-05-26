# Complete Demo Authentication + Email System Guide

## Overview

This guide covers the complete implementation of a **demo-mode authentication + email system** for a travel booking app (MakeMyTrip-like). The system supports:
- ✅ Mobile OTP login (static OTP: `123456`)
- ✅ Email/password authentication
- ✅ Demo email redirection (all emails → fixed address)
- ✅ User email storage in database
- ✅ Easy production migration

---

# Part A: Backend Implementation (Node.js + Express + Prisma)

## 1. Database Schema

```prisma
// prisma/schema.prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String?   // Nullable for OTP-only users
  phone         String    @unique
  otp           String?   // Current OTP code
  otpExpiry     DateTime? // OTP expiration time
  is_admin      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  bookings      Booking[]

  @@index([email])
  @@index([phone])
}

model Booking {
  id              String    @id @default(cuid())
  bookingId       String    @unique // e.g., MMT-FL-123456
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            String    // "flight" or "hotel"
  userEmail       String    // User's actual email (stored)
  userName        String?   // User's name
  fromCity        String
  toCity          String
  departureDate   String
  returnDate      String?
  travellers      Json      // Passenger/guest details
  totalAmount     Float
  pnr             String    // Booking reference
  status          String    @default("confirmed") // "confirmed", "cancelled"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([userEmail])
}
```

## 2. Environment Configuration

```env
# .env file
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-change-in-production

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/makemytrip"

# Email System (DEMO MODE)
EMAIL_DEMO_MODE=true
DEMO_EMAIL_RECIPIENT=jayesh.barapatre@prakashinfotech.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 3. Backend API Endpoints

### A. Mobile OTP Login Flow

#### POST `/auth/send-otp`
Requests OTP for mobile number login.

```javascript
// routes/auth.js
import { Router } from 'express'
import { sendMobileOtp, verifyMobileOtp, loginWithEmail } from '../controllers/authController.js'

const router = Router()

router.post('/send-otp', sendMobileOtp)        // Request OTP
router.post('/verify-otp', verifyMobileOtp)    // Verify OTP + Login
router.post('/login', loginWithEmail)          // Email/password login
router.post('/signup', registerUser)           // Register

export default router
```

```javascript
// controllers/authController.js
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../config/prismaClient.js'

const JWT_SECRET = process.env.JWT_SECRET
const signToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })

// ── Send OTP (Mobile Login) ──
export const sendMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' })

    // Find or create user
    let user = await prisma.user.findFirst({ where: { phone } })
    if (!user) {
      return res.status(404).json({ 
        message: 'No account found. Please register first.',
        action: 'register'
      })
    }

    // In DEMO mode, we don't actually send SMS
    // In production, you'd call Twilio/AWS SNS here
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry: expiry }
    })

    // ⚠️ DEMO MODE: Log OTP to console (for testing)
    console.log(`\n📱 DEMO MODE - OTP for ${phone}: ${otp}`)
    console.log('   (In production, this would be sent via SMS)\n')

    res.json({
      message: 'OTP sent to your registered mobile number.',
      demo: {
        staticOtp: '123456',
        instruction: 'In DEMO mode, use OTP: 123456'
      }
    })
  } catch (err) {
    console.error('Send OTP error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── Verify OTP + Login ──
export const verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required.' })
    }

    const user = await prisma.user.findFirst({ where: { phone } })
    if (!user) return res.status(404).json({ message: 'User not found.' })

    // ✅ DEMO MODE: Accept static OTP '123456'
    const isStaticOtpValid = process.env.NODE_ENV !== 'production' && otp === '123456'
    const isRealOtpValid = user.otp === otp && new Date() <= user.otpExpiry

    if (!isStaticOtpValid && !isRealOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP code.' })
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null }
    })

    const token = signToken(user.id)
    console.log(`✅ User ${phone} logged in via OTP${isStaticOtpValid ? ' (DEMO static OTP)' : ''}`)

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, phone },
        token
      }
    })
  } catch (err) {
    console.error('Verify OTP error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── Register User ──
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required.' })
    }

    // Password is optional (can login with OTP only)
    if (password && password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return res.status(409).json({ message: 'Email already registered.' })

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        is_admin: false
      }
    })

    const token = signToken(newUser.id)
    console.log(`✅ User registered: ${email}`)

    res.status(201).json({
      success: true,
      data: {
        user: { id: newUser.id, name: newUser.name, email, phone },
        token
      }
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: err.message })
  }
}

// ── Login with Email + Password ──
export const loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' })

    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account uses OTP login only.',
        action: 'use-otp'
      })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return res.status(401).json({ message: 'Invalid email or password.' })

    const token = signToken(user.id)
    console.log(`✅ User ${email} logged in with password`)

    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email, phone: user.phone },
        token
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: err.message })
  }
}
```

### B. Booking with Email Override

```javascript
// controllers/bookingController.js
import prisma from '../config/prismaClient.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

export const createBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    if (!userId) return res.status(401).json({ message: 'Authentication required.' })

    const {
      type,           // 'flight' or 'hotel'
      fromCity,
      toCity,
      departureDate,
      returnDate,
      travellers,
      totalAmount,
      userEmail,      // User's actual email (will be overridden in email sending)
      userName
    } = req.body

    if (!type || !totalAmount || !userEmail) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    // Generate booking reference
    const bookingId = 'MMT-' + (type === 'hotel' ? 'HT-' : 'FL-') + 
                     Math.floor(100000 + Math.random() * 900000)
    const pnr = (type === 'hotel' ? 'HTL-' : 'PNR-') + 
               Math.floor(100000 + Math.random() * 900000)

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        userId,
        type,
        bookingId,
        pnr,
        userEmail,      // Store user's actual email
        userName,
        fromCity,
        toCity,
        departureDate,
        returnDate,
        travellers,
        totalAmount,
        status: 'confirmed'
      }
    })

    // Send email (will be redirected to demo address in demo mode)
    // This is non-blocking - if email fails, booking still succeeds
    sendBookingConfirmationEmail({
      ...booking,
      userEmail,
      userName
    }).catch(err => console.error('Email send failed:', err))

    console.log(`✅ Booking created: ${bookingId} for user ${userId}`)

    res.status(201).json({
      success: true,
      data: booking
    })
  } catch (err) {
    console.error('Booking error:', err)
    res.status(500).json({ message: err.message })
  }
}
```

## 4. Email Service (Demo Mode)

```javascript
// services/emailService.js
import nodemailer from 'nodemailer'

const DEMO_MODE = process.env.EMAIL_DEMO_MODE === 'true'
const DEMO_EMAIL = process.env.DEMO_EMAIL_RECIPIENT || 'jayesh.barapatre@prakashinfotech.com'

// Email transporter (optional - can use mock in demo)
const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not configured. Emails will be logged only.')
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
}

const transporter = createTransporter()

export const sendBookingConfirmationEmail = async (booking) => {
  try {
    const userEmail = booking.userEmail
    
    if (!userEmail) {
      console.error('❌ No user email provided')
      return { success: false }
    }

    // ✅ DEMO MODE: Override recipient
    const actualRecipient = DEMO_MODE ? DEMO_EMAIL : userEmail
    const bookingType = booking.type === 'flight' ? 'Flight' : 'Hotel'

    // Log email info
    console.log(`\n📧 Booking Confirmation Email:`)
    console.log(`   Mode: ${DEMO_MODE ? '🎯 DEMO' : '🚀 PRODUCTION'}`)
    console.log(`   User Email (stored): ${userEmail}`)
    console.log(`   Actual Recipient: ${actualRecipient}`)
    console.log(`   Booking ID: ${booking.bookingId}`)
    console.log(`   Type: ${bookingType}\n`)

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #003580; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1 style="margin: 0;">MakeMyTrip</h1>
          <p style="margin: 10px 0 0 0;">${bookingType} Booking Confirmed ✓</p>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${booking.userName || 'Guest'},</h2>
          <p>Your ${bookingType.toLowerCase()} booking has been successfully confirmed!</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f0f0f0;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Booking ID:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking.bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>PNR/Reference:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking.pnr}</td>
            </tr>
            <tr style="background: #f0f0f0;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Route:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${booking.fromCity} → ${booking.toCity}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">₹${booking.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <div style="background: #e8f4f8; border-left: 4px solid #003580; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Demo Mode Notice:</strong> This is a test booking confirmation.</p>
          </div>
        </div>

        <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;"><strong>Booking Confirmation Sent To:</strong> ${userEmail}</p>
          <p style="margin: 5px 0 0 0;">© 2026 MakeMyTrip. All rights reserved.</p>
          ${DEMO_MODE ? '<p style="margin: 5px 0 0 0; color: #ff6b6b;"><strong>[DEMO MODE]</strong> Email redirected to admin address.</p>' : ''}
        </div>
      </div>
    `

    // Send email if transporter available
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `MakeMyTrip <${process.env.SMTP_USER}>`,
          to: actualRecipient,
          subject: `${bookingType} Booking Confirmation - ${booking.bookingId}`,
          html: htmlContent
        })
        console.log(`✅ Email sent to ${actualRecipient}`)
      } catch (err) {
        console.warn(`⚠️ Email send failed (non-blocking): ${err.message}`)
      }
    } else {
      console.log(`📧 [TEST MODE] Email would be sent to: ${actualRecipient}`)
    }

    return { success: true }
  } catch (err) {
    console.error('Email service error:', err)
    return { success: false }
  }
}
```

---

# Part B: Frontend Implementation (React)

## 1. Login Page Component

```jsx
// pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [authMode, setAuthMode] = useState('email') // 'email' or 'mobile'
  const [step, setStep] = useState(1)                // 1: Input, 2: OTP
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Email/Password state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  
  // Mobile/OTP state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')

  // ── Email/Password Login ──
  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const endpoint = isRegister ? '/auth/signup' : '/auth/login'
      const payload = isRegister 
        ? { name, email, password, phone: '0000000000' }
        : { email, password }

      const res = await api.post(endpoint, payload)
      const token = res.data.data.token
      const user = res.data.data.user

      login(token, user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  // ── Mobile OTP: Send OTP ──
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!phone) {
      setError('Phone number is required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/send-otp', { phone })
      setStep(2) // Move to OTP verification
      console.log('📱 OTP sent. Demo OTP: 123456')
    } catch (err) {
      const message = err.response?.data?.message
      if (message?.includes('not found')) {
        setError('No account found. Please register first.')
      } else {
        setError(message || 'Failed to send OTP.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Mobile OTP: Verify OTP ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/verify-otp', { phone, otp })
      const token = res.data.data.token
      const user = res.data.data.user

      login(token, user)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Left Panel */}
        <div className="login-left">
          <h1>makemytrip</h1>
          <p>Every Great Journey Starts With a Search.</p>
        </div>

        {/* Right Panel */}
        <div className="login-right">
          {/* Auth Mode Toggle */}
          <div className="auth-mode-toggle">
            <button 
              className={authMode === 'email' ? 'active' : ''}
              onClick={() => { setAuthMode('email'); setStep(1); setError('') }}
            >
              📧 Email / Password
            </button>
            <button 
              className={authMode === 'mobile' ? 'active' : ''}
              onClick={() => { setAuthMode('mobile'); setStep(1); setError('') }}
            >
              📱 Mobile + OTP
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Email/Password Mode */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailLogin} className="auth-form">
              <h2>{isRegister ? 'Register' : 'Login'}</h2>
              
              {isRegister && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : isRegister ? 'Create Account' : 'Login'}
              </button>

              <p className="toggle-link">
                {isRegister ? 'Already have account?' : "Don't have an account?"}
                <button 
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                >
                  {isRegister ? 'Login' : 'Register'}
                </button>
              </p>
            </form>
          )}

          {/* Mobile OTP Mode */}
          {authMode === 'mobile' && (
            <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="auth-form">
              <h2>Login with OTP</h2>

              {step === 1 ? (
                // Step 1: Phone Number Input
                <>
                  <label>📱 Enter Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength="10"
                    required
                  />
                  <button type="submit" disabled={loading || phone.length !== 10}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </>
              ) : (
                // Step 2: OTP Verification
                <>
                  <label>🔐 Enter 6-Digit OTP</label>
                  <p className="helper-text">
                    📱 OTP sent to {phone}
                    <button type="button" onClick={() => setStep(1)}>Change</button>
                  </p>
                  
                  <div className="demo-notice">
                    <strong>💡 DEMO MODE:</strong> Use OTP: <code>123456</code>
                  </div>

                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength="6"
                    required
                    autoFocus
                  />
                  
                  <button type="submit" disabled={loading || otp.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                </>
              )}
            </form>
          )}

          <div className="security-badge">
            🔒 256-bit SSL Encrypted
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 2. Login Page Styles

```css
/* styles/LoginPage.css */
.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #003580 0%, #0052a3 100%);
  padding: 20px;
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 900px;
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-left {
  background: linear-gradient(135deg, #003580 0%, #0052a3 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-left h1 {
  font-size: 32px;
  margin-bottom: 20px;
  font-weight: bold;
}

.login-left p {
  font-size: 18px;
  line-height: 1.6;
}

.login-right {
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Auth Mode Toggle */
.auth-mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 30px;
}

.auth-mode-toggle button {
  padding: 10px 15px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.auth-mode-toggle button.active {
  border-color: #003580;
  background: #003580;
  color: white;
}

/* Form Styles */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.auth-form h2 {
  margin: 0 0 15px 0;
  font-size: 24px;
  color: #003580;
}

.auth-form input {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.auth-form input:focus {
  outline: none;
  border-color: #003580;
  box-shadow: 0 0 0 3px rgba(0, 53, 128, 0.1);
}

.auth-form label {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.auth-form button[type="submit"] {
  padding: 12px;
  background: #003580;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.auth-form button[type="submit"]:hover:not(:disabled) {
  background: #0052a3;
}

.auth-form button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Helper Text */
.helper-text {
  font-size: 13px;
  color: #666;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.helper-text button {
  background: none;
  border: none;
  color: #003580;
  cursor: pointer;
  text-decoration: underline;
  font-size: 13px;
}

/* Demo Notice */
.demo-notice {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  color: #856404;
  margin: 10px 0;
}

.demo-notice code {
  background: #ffe5a1;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 600;
  font-size: 14px;
}

/* Error Box */
.error-box {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
}

/* Toggle Link */
.toggle-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.toggle-link button {
  background: none;
  border: none;
  color: #003580;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 600;
}

/* Security Badge */
.security-badge {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
  }

  .login-left {
    padding: 40px 20px;
  }

  .login-right {
    padding: 30px 20px;
  }
}
```

## 3. Auth Context

```jsx
// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(true)

  // Restore session on app load
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [token])

  const login = (newToken, userData) => {
    setToken(newToken)
    setUser(userData)
    localStorage.setItem('authToken', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('authToken')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

---

# Part C: Complete Testing Checklist

## Demo Mode Testing

### 1. Mobile + OTP Login Flow
```
✓ Register user with phone: 9876543210
✓ Navigate to login → Select "Mobile + OTP"
✓ Enter phone: 9876543210
✓ Click "Send OTP"
✓ Backend logs: "DEMO MODE - OTP: 123456"
✓ Enter OTP: 123456
✓ Click "Verify & Login"
✓ Login successful → Redirect to home
```

### 2. Email + Password Login Flow
```
✓ Register with email: abc@gmail.com, password: Password123
✓ Navigate to login → Select "Email / Password"
✓ Enter email and password
✓ Click "Login"
✓ Login successful → Redirect to home
```

### 3. Booking with Email Override
```
✓ Login as user with email: abc@gmail.com
✓ Search and book flight
✓ On booking page, system shows: userEmail: abc@gmail.com
✓ Submit booking
✓ Backend logs:
   📧 Booking Confirmation Email:
      Mode: 🎯 DEMO
      User Email (stored): abc@gmail.com
      Actual Recipient: jayesh.barapatre@prakashinfotech.com
✓ Email received at: jayesh.barapatre@prakashinfotech.com
✓ Email shows: "Booking done by: abc@gmail.com"
```

---

# Part D: OTP Validation Logic

## Frontend Validation

```javascript
// utils/validation.js
export const validateOtp = (otp) => {
  return otp && otp.length === 6 && /^\d{6}$/.test(otp)
}

export const validatePhone = (phone) => {
  return phone && phone.length === 10 && /^\d{10}$/.test(phone)
}

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePassword = (password) => {
  return password && password.length >= 8
}
```

## Backend Validation

```javascript
// middleware/validate.js
export const validateOtp = (req, res, next) => {
  const { otp } = req.body
  
  if (!otp || typeof otp !== 'string') {
    return res.status(400).json({ message: 'OTP is required.' })
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'OTP must be a 6-digit number.' })
  }
  
  next()
}

export const validatePhone = (req, res, next) => {
  const { phone } = req.body
  
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ message: 'Phone number is required.' })
  }
  
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone must be a 10-digit number.' })
  }
  
  next()
}
```

---

# Part E: Production Migration Guide

## Step 1: Disable Static OTP

```javascript
// authController.js - PRODUCTION VERSION
export const verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body
    const user = await prisma.user.findFirst({ where: { phone } })
    
    // ❌ REMOVE THIS in production:
    // const isStaticOtpValid = process.env.NODE_ENV !== 'production' && otp === '123456'
    
    // ✅ ONLY accept real OTPs:
    const isRealOtpValid = user.otp === otp && new Date() <= user.otpExpiry

    if (!isRealOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP code.' })
    }
    // ... rest of code
  }
}
```

## Step 2: Enable Real SMS Service

```javascript
// services/smsService.js
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export const sendSmsOtp = async (phone, otp) => {
  try {
    await twilioClient.messages.create({
      body: `Your MakeMyTrip OTP is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`
    })
    console.log(`✅ OTP sent to ${phone} via Twilio`)
  } catch (err) {
    console.error('SMS send failed:', err)
    throw err
  }
}
```

Update `sendMobileOtp`:

```javascript
export const sendMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body
    const user = await prisma.user.findFirst({ where: { phone } })
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry: expiry }
    })

    // ✅ PRODUCTION: Send real SMS
    if (process.env.NODE_ENV === 'production') {
      await sendSmsOtp(phone, otp)  // Use Twilio/AWS SNS/etc
    } else {
      // DEMO: Log to console
      console.log(`📱 DEMO OTP: ${otp}`)
    }

    res.json({ message: 'OTP sent to your phone.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP.' })
  }
}
```

## Step 3: Disable Email Override

```javascript
// services/emailService.js - PRODUCTION VERSION
const DEMO_MODE = process.env.EMAIL_DEMO_MODE === 'true' && 
                  process.env.NODE_ENV !== 'production'

export const sendBookingConfirmationEmail = async (booking) => {
  // ✅ ALWAYS send to user's email in production
  const actualRecipient = DEMO_MODE ? DEMO_EMAIL : booking.userEmail
  
  // ... rest of code
}
```

## Step 4: Environment Configuration

```env
# .env.production
NODE_ENV=production
EMAIL_DEMO_MODE=false
DEMO_EMAIL_RECIPIENT=          # Leave empty

# Real SMS Service
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Real Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=official-noreply@makemytrip.com
SMTP_PASS=real-app-password

JWT_SECRET=strong-random-secret-here
```

## Step 5: Security Checklist for Production

```markdown
✓ NODE_ENV=production
✓ EMAIL_DEMO_MODE=false
✓ JWT_SECRET changed (use 32+ char random string)
✓ Database credentials secured
✓ SSL certificates installed
✓ Twilio/SMS service configured and tested
✓ Email service configured and tested
✓ Rate limiting enabled
✓ CORS configured to specific domain only
✓ Input validation on all endpoints
✓ Logs don't contain sensitive data
✓ Database backups configured
✓ Error responses don't leak info
```

---

# Summary: Demo vs Production

| Feature | Demo | Production |
|---------|------|-----------|
| Static OTP (123456) | ✅ Works | ❌ Disabled |
| Real OTP | ✅ Works | ✅ Required |
| SMS Service | ❌ Mocked | ✅ Real (Twilio) |
| Email Override | ✅ To demo address | ❌ To user email |
| Admin Email Log | ✅ Shows all | ❌ Secure logging |
| NODE_ENV | `development` | `production` |

---

# Quick Start Commands

```bash
# Backend
cd makemytrip-backend
npm install
npm run db:migrate   # Setup database
npm run dev         # Start server

# Frontend
cd makemytrip-frontend
npm install
npm run dev         # Start dev server

# Test Demo Flow
# 1. Open http://localhost:5173
# 2. Register → Login with mobile
# 3. OTP: 123456
# 4. Book flight → Email redirected to admin address
```

---

This guide provides everything needed to implement and deploy a complete demo + production-ready authentication and email system! 🚀
