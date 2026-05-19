import mongoose from 'mongoose'

const busSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  operatorName: { type: String, required: true },
  busNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['AC', 'Non-AC', 'Sleeper', 'Luxury'], required: true },
  departure: {
    city: String,
    time: String,
    date: String
  },
  arrival: {
    city: String,
    time: String,
    date: String
  },
  duration: String,
  price: { type: Number, required: true },
  seats: { type: Number, default: 45 },
  seatsAvailable: { type: Number, default: 45 },
  amenities: [String],
  image: String,
  isActive: { type: Boolean, default: true },
  listingStatus: { type: String, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
  rejectionReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const Bus = mongoose.models.Bus || mongoose.model('Bus', busSchema)
export default Bus
