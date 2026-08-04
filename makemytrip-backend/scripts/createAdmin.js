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
import { describePasswordWeakness } from '../src/utils/validation.js'
import { normalizeEmail, findUserByEmail } from '../src/utils/identity.js'

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? null : process.argv[i + 1]
}
const flag = (name) => process.argv.includes(`--${name}`)

// Canonicalised so `--email Ops@Co.com` promotes the existing account rather
// than creating a second admin the owner can never log into.
const email = normalizeEmail(arg('email'))
const password = arg('password')
const name = arg('name') ?? 'Administrator'
const role = flag('super') ? Role.SUPER_ADMIN : Role.ADMIN

const fail = (msg) => {
  console.error(`❌ ${msg}`)
  process.exit(1)
}

const run = async () => {
  if (!email) fail('--email is required')

  const existing = await findUserByEmail(db, email)
  const ref = existing?.ref ?? db.collection('users').doc(email)

  if (existing) {
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
      const weakness = describePasswordWeakness(password, { strict: true })
      if (weakness) fail(weakness)
      patch.password = await bcrypt.hash(password, 10)
    }

    await ref.update(patch)
    console.log(`✅ ${email} promoted to ${role}${password ? ' (password reset)' : ''}`)
    return
  }

  if (!password) fail('--password is required when creating a new admin')

  // Same strict policy the API enforces — the bootstrap script must not be a
  // weaker door into the same privilege level.
  const newWeakness = describePasswordWeakness(password, { strict: true })
  if (newWeakness) fail(newWeakness)

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
