import 'dotenv/config'
import '../src/config/firebase.js'
import { connectDB } from '../src/config/db.js'
import Admin from '../src/models/Admin.js'
import bcrypt from 'bcryptjs'

async function seedAdmin() {
  try {
    await connectDB()
    console.log('📦 MongoDB connected')

    const existing = await Admin.findOne({ email: 'admin@makemytrip.com' })
    if (existing) {
      console.log('✅ Admin account already exists')
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

    console.log('✅ Admin account created successfully!')
    console.log('📧 Email: admin@makemytrip.com')
    console.log('🔐 Password: admin123')
    console.log('👤 Role: superadmin')
    console.log('🌐 Access at: http://localhost:5173/admin/login')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seed error:', err.message)
    process.exit(1)
  }
}

seedAdmin()
