#!/usr/bin/env node

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5000

const isProduction = process.env.NODE_ENV === 'production'
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()).filter(Boolean)

// Origins are matched against the explicit allowlist only.
//
// This previously allowed any `*.vercel.app` host with credentials enabled,
// which let anyone deploy a site to Vercel and call this API as a trusted
// origin. Localhost is still allowed outside production for local development.
const isAllowedOrigin = (origin) => {
  if (allowedOrigins.includes(origin)) return true
  if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true
  return false
}

app.use(cors({
  origin: (origin, callback) => {
    // No Origin header: same-origin, curl, or a server-to-server call.
    if (!origin) return callback(null, true)
    if (isAllowedOrigin(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

// Security headers. Set explicitly rather than via helmet to avoid adding a
// dependency for six headers, and because the API serves JSON plus uploaded
// images only — it has no inline scripts to whitelist.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

// The Razorpay webhook is HMAC-signed over the exact bytes it sent. Parsing and
// re-serialising that body changes key order and whitespace, so the signature
// could never verify — this MUST stay ahead of express.json. Both mount paths
// are covered because every route is registered under /api and /api/v1.
const rawJson = express.raw({ type: 'application/json', limit: '256kb' })
app.use('/api/payment/webhook', rawJson)
app.use('/api/v1/payment/webhook', rawJson)

// Bounded body size: an unbounded JSON parser lets one request exhaust memory.
app.use(express.json({ limit: '256kb' }))
app.use(express.urlencoded({ extended: true, limit: '256kb' }))
// Uploaded files are user-supplied. uploadMiddleware pins the stored extension
// to the declared type so nothing executable can be written here, and these
// headers are the second line of defence if that ever regresses:
//
//   nosniff                  stops the browser guessing a type
//   CSP sandbox              neuters script/plugins even if HTML is served
//   Content-Disposition      makes anything unexpected download, not render
//
// Serving user uploads from the API origin at all is the underlying weakness —
// a separate asset host or bucket is the durable fix (roadmap M28).
app.use('/uploads', express.static('public/uploads', {
  index: false,
  dotfiles: 'deny',
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(filePath)) {
      res.setHeader('Content-Disposition', 'attachment')
    }
  }
}))

// Health check - always available
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Routes are registered before the port is opened. Listening first left a
// window in which every real request fell through to the 404 handler, which
// during a redeploy surfaces as sporadic "Route not found" errors to users.
let server

async function initializeApp() {
  try {
    // Validate every secret before anything else imports one. The per-module
    // guards that used to do this fired on first import, so a compromised or
    // missing credential surfaced at the first customer request instead of at
    // boot. Throws ESECRETS, which the catch below turns into a clean exit.
    const { assertSecrets } = await import('./config/secrets.js')
    assertSecrets({ isProduction })

    // Resolve req.ip before any rate limiter can read it. Express defaults to
    // treating the TCP peer as the client, so behind a proxy every caller
    // collapsed into one bucket and per-IP limits protected nobody.
    // Throws ETRUSTPROXY on an unsafe or unparseable value.
    const { applyTrustProxy } = await import('./config/proxy.js')
    applyTrustProxy(app, { isProduction })

    // Import all modules
    const { getRedis } = await import('./config/redis.js')
    const { verifyConnection } = await import('./services/emailService.js')
    const { reportError } = await import('./services/errorReporter.js')

    // Global flood ceiling, ahead of every route. Per-route policies sit after
    // their auth middleware so they can bucket by account; that leaves requests
    // rejected at 401 unmetered, which this layer covers. Mounted after
    // trust-proxy resolution so it buckets on the real client address.
    const { baselineLimiter } = await import('./middleware/rateLimiter.js')
    app.use(baselineLimiter)

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
    const documentRoutes = (await import('./routes/documents.js')).default
    const clientErrorRoutes = (await import('./routes/clientErrors.js')).default

    // Firestore is the only database and initialises itself on first import of
    // config/firebase.js. The `connectDB()` call that stood here was a no-op
    // left over from the Mongoose era.

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
    app.use('/api/documents', documentRoutes)
    app.use('/api/v1/documents', documentRoutes)
    app.use('/api/client-errors', clientErrorRoutes)
    app.use('/api/v1/client-errors', clientErrorRoutes)

    // 404 handler
    app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))

    // Central error handler. Without one, Express's default handler replies with
    // the raw stack trace, and any route that threw returned an HTML error page
    // to an API client. Internal detail is logged, never sent.
    app.use((err, req, res, _next) => {
      if (err?.message === 'Not allowed by CORS') {
        return res.status(403).json({ success: false, message: 'Origin not allowed' })
      }
      if (err?.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'Request body is too large' })
      }
      if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Malformed JSON body' })
      }

      console.error(`💥 Unhandled error on ${req.method} ${req.originalUrl}:`, err?.stack || err)

      const status = err?.status || 500

      // Capture it somewhere queryable. console.error alone means the first
      // report of an outage is a customer email.
      reportError({
        error: err,
        source: 'server',
        severity: status >= 500 ? 'error' : 'warning',
        context: {
          method: req.method,
          path: req.originalUrl,
          statusCode: status,
          userId: req.user?.id ?? null
        }
      })

      res.status(status).json({
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      })
    })

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
    // A failed secret or trust-proxy check has already printed an itemised,
    // actionable report; a stack trace on top only buries what must be fixed.
    if (err?.code === 'ETRUSTPROXY') {
      console.error(`\n❌ Startup aborted — invalid TRUST_PROXY configuration:\n\n   • ${err.message}\n`)
    } else if (err?.code !== 'ESECRETS') {
      console.error('❌ Failed to initialize app:', err.message)
      console.error(err.stack)
    }
    // A half-registered app serves 404s for real endpoints. Fail loudly instead
    // of pretending to be healthy.
    throw err
  }
}

initializeApp()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`)
    })

    server.on('error', (err) => {
      console.error('❌ Server error:', err.message)
      process.exit(1)
    })
  })
  .catch(() => {
    console.error('❌ Startup aborted — not accepting traffic')
    process.exit(1)
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
  server?.close(() => process.exit(0))
})
