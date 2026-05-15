import mongoose from 'mongoose'

let isMongoConnected = false

export const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/makemytrip'
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000 // Fast failover in 2s
    })
    isMongoConnected = true
    console.log('MongoDB connected successfully via Mongoose!')
  } catch (err) {
    isMongoConnected = false
    console.warn('⚠️ WARNING: Local MongoDB connection failed. Falling back to in-memory/JSON store fail-safe!')
  }
}

export const getMongoConnectionStatus = () => isMongoConnected
