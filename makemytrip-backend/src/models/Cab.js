import mongoose from 'mongoose'

const cabSchema = new mongoose.Schema({
  operatorName: { type: String, required: true },
  cabNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Economy', 'Premium', 'XL', 'Luxury'], required: true },
  baseFare: { type: Number, required: true },
  perKmRate: { type: Number, required: true },
  perMinuteRate: { type: Number, required: true },
  location: String,
  currentCity: String,
  isActive: { type: Boolean, default: true },
  cabs: { type: Number, default: 20 },
  cabs_available: { type: Number, default: 20 },
  image: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const Cab = mongoose.models.Cab || mongoose.model('Cab', cabSchema)
export default Cab
