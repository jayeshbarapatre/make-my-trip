import mongoose from 'mongoose'

const flightSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  airline: { type: String, required: true },
  flightNumber: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  price: { type: Number, required: true },
  seatsAvailable: { type: Number, default: 180 },
  listingStatus: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
    default: 'DRAFT'
  },
  rejectionReason: String,
  submittedAt: Date,
  approvedAt: Date,
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const Flight = mongoose.models.Flight || mongoose.model('Flight', flightSchema)
export default Flight
