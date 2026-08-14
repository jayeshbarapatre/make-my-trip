#!/usr/bin/env node
// Creates or promotes a vendor in Firestore.
//
// Usage:
//   node scripts/createVendor.js --email vendor@example.com --password 'Str0ngPass!' --name "Hotel Vendor"
//   node scripts/createVendor.js --email existing@user.com --promote
//   node scripts/createVendor.js --email existing@user.com --promote --vendortype hotel

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../src/config/firebase.js'
import { Role, AccountStatus } from '../src/config/roles.js'
import { normalizeEmail, findUserByEmail } from '../src/utils/identity.js'
import { now } from '../src/utils/time.js'

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? null : process.argv[i + 1]
}
const flag = (name) => process.argv.includes(`--${name}`)

const email = normalizeEmail(arg('email'))
const password = arg('password')
const name = arg('name') ?? 'Vendor'
const vendorType = arg('vendortype') ?? 'hotel'

const fail = (msg) => {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

const run = async () => {
  if (!email) fail('--email is required')

  const existing = await findUserByEmail(db, email)
  const ref = existing?.ref ?? db.collection('users').doc(email)
  const existingData = existing?.data ?? null

  // Generate a vendor ID
  const vendorId = existingData?.vendorId ?? `vendor_${Date.now()}`

  if (existing) {
    const patch = {
      role: Role.VENDOR,
      accountStatus: AccountStatus.ACTIVE,
      vendorId,
      vendorType,
      vendorName: name !== 'Vendor' ? name : (existingData?.vendorName ?? existingData?.name ?? name),
      is_vendor: true,
      updatedAt: now()
    }
    if (password) {
      patch.password = await bcrypt.hash(password, 10)
    }

    await ref.update(patch)
    console.log(`✅ ${email} promoted to VENDOR`)
    console.log(`   vendorId: ${vendorId}`)
    console.log(`   vendorType: ${vendorType}`)
    if (password) console.log('   Password reset successfully')
    return
  }

  if (!password) fail('--password is required when creating a new vendor')

  const userId = `user_${Date.now()}`
  await ref.set({
    id: userId,
    name,
    email,
    phone: arg('phone') ?? null,
    password: await bcrypt.hash(password, 10),
    role: Role.VENDOR,
    accountStatus: AccountStatus.ACTIVE,
    vendorId,
    vendorType,
    vendorName: name,
    is_vendor: true,
    // Timestamps, not ISO strings. Firestore orders by type before value and a
    // range filter never matches across types, so an account written as a string
    // is invisible to every dated query and sorts as a separate group. Accounts
    // created here used to be exactly that, until the next migrate:timestamps
    // run happened to rescue them.
    createdAt: now(),
    updatedAt: now(),
    isDeleted: false
  })

  console.log(`✅ Created VENDOR: ${email}`)
  console.log(`   vendorId: ${vendorId}`)
  console.log(`   vendorType: ${vendorType}`)
  console.log('   Sign in at /vendor/login')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Failed:', err.message)
    process.exit(1)
  })
