import 'dotenv/config'
// import './config/firebase.js' // initialise Firebase Admin - using PostgreSQL/Prisma instead
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import flightRoutes from './routes/flights.js'
import busRoutes from './routes/buses.js'
import bookingRoutes from './routes/bookings.js'
import paymentRoutes from './routes/paymentRoutes.js'
import userRoutes from './routes/userRoutes.js'
import unifiedSearchRoutes from './routes/unifiedSearch.js'
import adminRoutes from './routes/adminRoutes.js'
import vendorRoutes from './routes/vendorRoutes.js'
import autocompleteRoutes from './routes/autocomplete.js'
import hotelRoutes from './routes/hotels.js'
import trainRoutes from './routes/trains.js'
import publicCmsRoutes from './routes/publicCmsRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

// Initialize MongoDB Connection (resilient fast failover)
connectDB()

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    // Allow localhost for development
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return callback(null, true)
    // Allow configured origins and any vercel.app subdomain
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static('public/uploads'))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/flights', flightRoutes)
app.use('/api/v1/flights', flightRoutes)
app.use('/api/buses', busRoutes)
app.use('/api/v1/buses', busRoutes)
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

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
