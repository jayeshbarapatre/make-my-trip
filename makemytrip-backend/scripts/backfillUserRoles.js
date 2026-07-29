#!/usr/bin/env node
// Backfills role / accountStatus / audit fields onto user documents created
// before RBAC existed. Idempotent: re-running touches only documents that are
// still missing the fields.
//
//   npm run migrate:roles          preview changes
//   npm run migrate:roles -- --commit   apply them

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { Role, AccountStatus, resolveRole } from '../src/config/roles.js'

const COMMIT = process.argv.includes('--commit')

const run = async () => {
  const snapshot = await db.collection('users').get()
  console.log(`Scanned ${snapshot.size} user documents\n`)

  const pending = []

  snapshot.forEach((doc) => {
    const data = doc.data()
    const patch = {}

    if (!data.role) patch.role = resolveRole(data)
    if (!data.accountStatus) patch.accountStatus = AccountStatus.ACTIVE
    if (data.isDeleted === undefined) patch.isDeleted = false
    if (!data.updatedAt) patch.updatedAt = data.createdAt || new Date().toISOString()

    if (Object.keys(patch).length) pending.push({ ref: doc.ref, id: doc.id, patch })
  })

  if (!pending.length) {
    console.log('✅ Nothing to backfill — every user already has role and accountStatus.')
    return
  }

  for (const { id, patch } of pending) {
    console.log(`  ${id}: ${JSON.stringify(patch)}`)
  }
  console.log(`\n${pending.length} document(s) need updating.`)

  if (!COMMIT) {
    console.log('\nDry run. Re-run with --commit to apply.')
    return
  }

  // Firestore caps a batch at 500 writes.
  for (let i = 0; i < pending.length; i += 450) {
    const batch = db.batch()
    for (const { ref, patch } of pending.slice(i, i + 450)) batch.update(ref, patch)
    await batch.commit()
    console.log(`Committed ${Math.min(i + 450, pending.length)}/${pending.length}`)
  }

  console.log('\n✅ Backfill complete.')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Backfill failed:', err)
    process.exit(1)
  })
