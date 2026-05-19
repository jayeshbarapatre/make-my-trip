import mongoose from 'mongoose'

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: { type: String, required: true },
  businessName: String,
  businessType: {
    type: String,
    enum: ['HOTEL', 'FLIGHT', 'BUS', 'CAB', 'MULTI'],
    default: 'HOTEL'
  },
  businessRegistration: String,
  taxId: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  bankAccount: {
    accountHolder: String,
    accountNumber: String,
    ifsc: String,
    bankName: String
  },
  documentsVerified: { type: Boolean, default: false },
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
    default: 'ACTIVE'
  },
  totalListings: { type: Number, default: 0 },
  approvedListings: { type: Number, default: 0 },
  rejectedListings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema)
export default Vendor
