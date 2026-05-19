#!/usr/bin/env node

import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Admin = mongoose.model('Admin', adminSchema)

async function createAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/makemytrip'
    console.log(`🔌 Connecting to MongoDB: ${mongoURI}`)

    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB connected')

    const existing = await Admin.findOne({ email: 'admin@makemytrip.com' })
    if (existing) {
      console.log('✅ Admin account already exists!')
      console.log(`Email: ${existing.email}`)
      console.log(`Role: ${existing.role}`)
      await mongoose.disconnect()
      process.exit(0)
    }

    const hashed = await bcrypt.hash('admin123', 10)
    const admin = await Admin.create({
      name: 'Admin User',
      email: 'admin@makemytrip.com',
      password: hashed,
      role: 'superadmin',
      permissions: ['read', 'write', 'delete', 'manage_admins'],
      isActive: true
    })

    console.log('\n✅ Admin account created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email: admin@makemytrip.com')
    console.log('🔐 Password: admin123')
    console.log('👤 Role: superadmin')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🌐 Access at: http://localhost:5173/admin/login')
    console.log('')

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    await mongoose.disconnect()
    process.exit(1)
  }
}

createAdmin()
