import mongoose from 'mongoose'

const flightSchema = new mongoose.Schema({
  airline: { type: String, required: true },
  flightNumber: { type: String, required: true, unique: true },
  departure: {
    airport: String,
    city: String,
    time: String,
    date: String
  },
  arrival: {
    airport: String,
    city: String,
    time: String,
    date: String
  },
  duration: String,
  price: { type: Number, required: true },
  seats: { type: Number, default: 180 },
  seatsAvailable: { type: Number, default: 180 },
  baggage: String,
  stops: { type: Number, default: 0 },
  aircraft: String,
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const Flight = mongoose.models.Flight || mongoose.model('Flight', flightSchema)
export default Flight
