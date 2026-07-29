#!/usr/bin/env node
// Creates or promotes an admin in Firestore.
//
// Replaces the previous Mongoose version — admins are now ordinary `users`
// documents with an elevated role, so one identity works across the admin
// panel and every RBAC-protected API.
//
//   npm run admin:create -- --email a@b.com --password 'Str0ngPass' --name "Ops Lead"
//   npm run admin:create -- --email existing@user.com --promote
//   npm run admin:create -- --email a@b.com --password '...' --super

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { db } from '../src/config/firebase.js'
import { Role, AccountStatus } from '../src/config/roles.js'

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? null : process.argv[i + 1]
}
const flag = (name) => process.argv.includes(`--${name}`)

const email = arg('email')
const password = arg('password')
const name = arg('name') ?? 'Administrator'
const role = flag('super') ? Role.SUPER_ADMIN : Role.ADMIN

const fail = (msg) => {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

const run = async () => {
  if (!email) fail('--email is required')

  const ref = db.collection('users').doc(email)
  const snap = await ref.get()

  if (snap.exists) {
    if (!flag('promote') && !password) {
      fail(`${email} already exists. Pass --promote to grant it the ${role} role, or --password to also reset the password.`)
    }

    const patch = {
      role,
      is_admin: true,
      accountStatus: AccountStatus.ACTIVE,
      updatedAt: new Date().toISOString()
    }
    if (password) {
      if (password.length < 8) fail('Password must be at least 8 characters')
      patch.password = await bcrypt.hash(password, 10)
    }

    await ref.update(patch)
    console.log(`✅ ${email} promoted to ${role}${password ? ' (password reset)' : ''}`)
    return
  }

  if (!password) fail('--password is required when creating a new admin')
  if (password.length < 8) fail('Password must be at least 8 characters')

  await ref.set({
    id: `admin_${Date.now()}`,
    name,
    email,
    phone: arg('phone') ?? null,
    password: await bcrypt.hash(password, 10),
    role,
    accountStatus: AccountStatus.ACTIVE,
    is_admin: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false
  })

  console.log(`✅ Created ${role}: ${email}`)
  console.log('   Sign in at /admin/login')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Failed:', err.message)
    process.exit(1)
  })
