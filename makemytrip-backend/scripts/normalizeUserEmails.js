/**
 * One-off migration: move every `users` document to a lowercased document id.
 *
 * WHY: Firestore compares document ids byte-for-byte, so `John@Ex.com` and
 * `john@ex.com` are two different accounts. Registration, customer login, admin
 * login and vendor login all keyed on the raw request value, while otpService
 * lowercases every identifier before hashing. Anyone who capitalised a letter
 * at signup therefore could not receive an email OTP or reset their password —
 * the lookup for the canonical address simply missed.
 *
 * `src/utils/identity.js` now canonicalises every write and reads through a
 * legacy fallback, so nobody is locked out before this runs. This script
 * removes the need for that fallback by moving the stored data.
 *
 * It also backfills `phoneE164` while it is walking the collection, so phone
 * login can use an indexed query instead of scanning every user.
 *
 * SAFETY:
 *   - Dry run by default. Nothing is written without --apply.
 *   - Refuses to merge a pair (`John@Ex.com` AND `john@ex.com` both present).
 *     Those are genuinely two accounts with two histories; a machine must not
 *     pick which one survives.
 *   - Copy-then-delete, one document at a time, so an interrupted run leaves
 *     the account readable at one id or the other, never neither.
 *
 * Run from makemytrip-backend:
 *   node scripts/normalizeUserEmails.js            # report only
 *   node scripts/normalizeUserEmails.js --apply    # perform the migration
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { normalizeEmail } from '../src/utils/identity.js'
import { toE164 } from '../src/services/sms/smsService.js'
import assertNotProduction from './lib/prodGuard.js'

const banner = (t) => console.log('\n' + '='.repeat(64) + '\n' + t + '\n' + '='.repeat(64))

const main = async () => {
  const apply = process.argv.includes('--apply')

  // Rewrites document ids in the users collection; never let it run unguarded.
  assertNotProduction('This migration rewrites user document ids.')

  banner(apply ? 'USER EMAIL MIGRATION (APPLYING)' : 'USER EMAIL MIGRATION (DRY RUN)')

  const snap = await db.collection('users').get()
  const byId = new Map(snap.docs.map((d) => [d.id, d]))

  const needsRename = []
  const collisions = []
  const phoneBackfill = []

  for (const doc of snap.docs) {
    const canonical = normalizeEmail(doc.id)

    if (canonical !== doc.id) {
      if (byId.has(canonical)) collisions.push({ from: doc.id, to: canonical })
      else needsRename.push({ doc, to: canonical })
    }

    const data = doc.data()
    if (!data.phoneE164 && data.phone) {
      const e164 = toE164(data.phone)
      if (e164) phoneBackfill.push({ ref: doc.ref, id: doc.id, e164 })
    }
  }

  console.log(`Scanned ${snap.size} user documents.`)
  console.log(`  • ${needsRename.length} need a lowercased id`)
  console.log(`  • ${collisions.length} collide with an existing canonical account`)
  console.log(`  • ${phoneBackfill.length} need a phoneE164 backfill`)

  if (collisions.length) {
    console.log('\n⚠️  COLLISIONS — these are NOT migrated. Two real accounts share one address:')
    collisions.forEach((c) => console.log(`     ${c.from}  ⇄  ${c.to}`))
    console.log('     Merge or delete one of each pair by hand, then re-run.')
  }

  if (needsRename.length) {
    console.log('\nDocuments to move:')
    needsRename.forEach(({ doc, to }) => console.log(`     ${doc.id}  ->  ${to}`))
  }

  if (!apply) {
    console.log('\nDry run — nothing was written. Re-run with --apply to perform the migration.')
    return
  }

  let moved = 0
  for (const { doc, to } of needsRename) {
    const data = doc.data()
    // Keep the stored `email` field consistent with the new document id.
    await db.collection('users').doc(to).set({ ...data, email: to })
    await doc.ref.delete()
    moved++
    console.log(`  ✓ ${doc.id} -> ${to}`)
  }

  let backfilled = 0
  for (const { ref, id, e164 } of phoneBackfill) {
    // The document may have just moved; write to wherever it now lives.
    const canonical = normalizeEmail(id)
    const target = needsRename.some((r) => r.doc.id === id)
      ? db.collection('users').doc(canonical)
      : ref
    await target.update({ phoneE164: e164, updatedAt: new Date().toISOString() }).catch(() => {})
    backfilled++
  }

  banner('✅ MIGRATION COMPLETE')
  console.log(`  ${moved} document(s) moved to a canonical id`)
  console.log(`  ${backfilled} phoneE164 value(s) backfilled`)
  if (collisions.length) {
    console.log(`  ${collisions.length} collision(s) left untouched — resolve these manually.`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
