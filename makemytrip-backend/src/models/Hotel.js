import mongoose from 'mongoose'

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  location: String,
  description: String,
  image: String,
  images: [String],
  rating: { type: Number, min: 1, max: 5, default: 4 },
  reviews: { type: Number, default: 0 },
  price: { type: Number, required: true },
  pricePerNight: { type: Number, required: true },
  rooms: { type: Number, default: 50 },
  roomsAvailable: { type: Number, default: 50 },
  amenities: [String],
  checkin: String,
  checkout: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', hotelSchema)
export default Hotel
