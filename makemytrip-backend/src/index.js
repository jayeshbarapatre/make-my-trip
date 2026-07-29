#!/usr/bin/env node

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5000

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim())

// Setup middleware immediately
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return callback(null, true)
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static('public/uploads'))

// Health check - always available
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Start server FIRST
const server = app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`)
  console.log(`📦 Loading application modules...`)

  // THEN load all modules asynchronously (non-blocking)
  initializeApp()
})

async function initializeApp() {
  try {
    // Import all modules
    const { connectDB } = await import('./config/db.js')
    const { getRedis } = await import('./config/redis.js')
    const { verifyConnection } = await import('./services/emailService.js')

    // Import routes
    const authRoutes = (await import('./routes/auth.js')).default
    const flightRoutes = (await import('./routes/flights.js')).default
    const busRoutes = (await import('./routes/buses.js')).default
    const cabRoutes = (await import('./routes/cabs.js')).default
    const bookingRoutes = (await import('./routes/bookings.js')).default
    const paymentRoutes = (await import('./routes/paymentRoutes.js')).default
    const userRoutes = (await import('./routes/userRoutes.js')).default
    const unifiedSearchRoutes = (await import('./routes/unifiedSearch.js')).default
    const adminRoutes = (await import('./routes/adminRoutes.js')).default
    const vendorRoutes = (await import('./routes/vendorRoutes.js')).default
    const autocompleteRoutes = (await import('./routes/autocomplete.js')).default
    const hotelRoutes = (await import('./routes/hotels.js')).default
    const trainRoutes = (await import('./routes/trains.js')).default
    const publicCmsRoutes = (await import('./routes/publicCmsRoutes.js')).default
    const refundRoutes = (await import('./routes/refunds.js')).default
    const { publicReviewRouter, reviewRouter, wishlistRouter } = await import('./routes/engagement.js')
    const reportRoutes = (await import('./routes/reports.js')).default
    const { supportRouter, couponRouter } = await import('./routes/support.js')
    const vendorRequestRoutes = (await import('./routes/vendorRequests.js')).default

    // Initialize database (non-blocking)
    connectDB()

    // Register all routes
    app.use('/api/auth', authRoutes)
    app.use('/api/v1/auth', authRoutes)
    app.use('/api/flights', flightRoutes)
    app.use('/api/v1/flights', flightRoutes)
    app.use('/api/buses', busRoutes)
    app.use('/api/v1/buses', busRoutes)
    app.use('/api/cabs', cabRoutes)
    app.use('/api/v1/cabs', cabRoutes)
    app.use('/api/bookings', bookingRoutes)
    app.use('/api/v1/bookings', bookingRoutes)
    app.use('/api/payment', paymentRoutes)
    app.use('/api/v1/payment', paymentRoutes)
    app.use('/api/user', userRoutes)
    app.use('/api/v1/user', userRoutes)
    app.use('/api/search', unifiedSearchRoutes)
    app.use('/api/v1/search', unifiedSearchRoutes)
    app.use('/api/admin', adminRoutes)
    app.use('/api/v1/admin', adminRoutes)
    app.use('/api/vendor', vendorRoutes)
    app.use('/api/v1/vendor', vendorRoutes)
    app.use('/api/autocomplete', autocompleteRoutes)
    app.use('/api/v1/autocomplete', autocompleteRoutes)
    app.use('/api/hotels', hotelRoutes)
    app.use('/api/v1/hotels', hotelRoutes)
    app.use('/api/trains', trainRoutes)
    app.use('/api/v1/trains', trainRoutes)
    app.use('/api/cms', publicCmsRoutes)
    app.use('/api/v1/cms', publicCmsRoutes)
    app.use('/api/refunds', refundRoutes)
    app.use('/api/v1/refunds', refundRoutes)
    // Public ratings mount first so /reviews/subject/:id stays unauthenticated.
    app.use('/api/reviews', publicReviewRouter)
    app.use('/api/v1/reviews', publicReviewRouter)
    app.use('/api/reviews', reviewRouter)
    app.use('/api/v1/reviews', reviewRouter)
    app.use('/api/wishlists', wishlistRouter)
    app.use('/api/v1/wishlists', wishlistRouter)
    app.use('/api/reports', reportRoutes)
    app.use('/api/v1/reports', reportRoutes)
    app.use('/api/support', supportRouter)
    app.use('/api/v1/support', supportRouter)
    app.use('/api/coupons', couponRouter)
    app.use('/api/v1/coupons', couponRouter)
    app.use('/api/vendor-requests', vendorRequestRoutes)
    app.use('/api/v1/vendor-requests', vendorRequestRoutes)

    // 404 handler
    app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))

    console.log('✅ All modules loaded successfully')

    // Initialize Redis connection (non-blocking)
    try {
      getRedis()
      console.log('🔗 Redis connection initiated')
    } catch (err) {
      console.warn('⚠️ Redis unavailable:', err.message)
    }

    // Verify SMTP up front so a misconfiguration is visible at boot, not at first booking
    verifyConnection().then(result => {
      if (result.ok) {
        console.log(`📧 SMTP ready — ${result.user} via ${result.host}`)
      } else {
        console.warn(`⚠️ SMTP NOT READY — transactional email will fail: ${result.reason}`)
      }
    })

    const { providerStatus } = await import('./services/sms/smsService.js')
    const sms = providerStatus()
    console.log(sms.live
      ? `📲 SMS ready — provider: ${sms.provider}`
      : `⚠️ SMS NOT READY — provider "${sms.provider}"${sms.configured ? ' (console driver: codes print to this terminal, nothing is delivered)' : ' is not configured; mobile OTP will return 503'}`)
  } catch (err) {
    console.error('❌ Failed to initialize app:', err.message)
    console.error(err.stack)
  }
}

// Error handlers
server.on('error', (err) => {
  console.error('❌ Server error:', err.message)
})

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason)
})

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  server.close()
})
