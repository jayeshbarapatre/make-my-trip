import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import bcrypt from 'bcryptjs'

async function seedVendor() {
  const email = 'jayeshbarapatre@gmail.com'
  const password = await bcrypt.hash('Jayesh@123456', 10)
  
  const id = 'user_demo_vendor'
  const doc = {
    id,
    vendorId: 'vendor_demo_jayesh',
    name: 'Jayesh Vendor',
    email,
    phone: '+919876543210',
    password,
    role: 'vendor',
    accountStatus: 'active',
    vendorType: 'hotel',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false
  }

  await db.collection('users').doc(email).set(doc)
  console.log(`✅ Seeded demo vendor account: ${email}`)
}

seedVendor().then(() => process.exit(0)).catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
