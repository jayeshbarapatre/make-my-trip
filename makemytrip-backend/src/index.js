import 'dotenv/config'
import './config/firebase.js' // initialise Firebase Admin
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import flightRoutes from './routes/flights.js'
import bookingRoutes from './routes/bookings.js'
import paymentRoutes from './routes/paymentRoutes.js'
import userRoutes from './routes/userRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

// Initialize MongoDB Connection (resilient fast failover)
connectDB()

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/flights', flightRoutes)
app.use('/api/v1/flights', flightRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/v1/bookings', bookingRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/v1/payment', paymentRoutes)
app.use('/api/user', userRoutes)
app.use('/api/v1/user', userRoutes)

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }))

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
