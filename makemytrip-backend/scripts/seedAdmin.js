import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import bcrypt from 'bcryptjs'

async function seedAdmin() {
  const email = 'jayeshbarapatre4923@gmail.com'
  // using the exact password from the UI
  const password = await bcrypt.hash('Jayesh@123456', 10)
  
  const id = 'user_demo_admin'
  const doc = {
    id,
    name: 'Jayesh Admin',
    email,
    password,
    role: 'admin',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false
  }

  await db.collection('users').doc(email).set(doc)
  console.log(`✅ Seeded demo admin account: ${email}`)
}

seedAdmin().then(() => process.exit(0)).catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
