/**
 * Converts stored ISO-string date fields to Firestore Timestamps.
 *
 * WHY: `createdAt` is written as `new Date().toISOString()` by some code paths
 * and `FieldValue.serverTimestamp()` by others. Firestore orders by TYPE before
 * value and a range filter never matches across types, so a mixed field cannot
 * be indexed or sorted meaningfully. Measured on this project: 27 of 46
 * bookings and 12 of 26 payments carried strings, which meant
 *
 *   - the admin "recent bookings" list ordered every string-dated booking ahead
 *     of every Timestamp-dated one, showing the newest bookings last;
 *   - `where('createdAt', '>=', today)` matched nothing, so "bookings today"
 *     was permanently zero.
 *
 * `src/utils/time.js` makes readers tolerate both shapes, so the application is
 * already correct without this migration. This script is what makes the fields
 * *indexable*, which is the prerequisite for replacing the in-memory sorts with
 * the composite indexes declared in firestore.indexes.json.
 *
 * SAFETY:
 *   - Dry run by default; --apply to write.
 *   - Only converts values it can parse as a date. Anything unparseable is
 *     reported and left untouched rather than guessed at.
 *   - Idempotent: a field already stored as a Timestamp is skipped.
 *
 * Run from makemytrip-backend:
 *   npm run migrate:timestamps
 *   npm run migrate:timestamps -- --apply
 */

import 'dotenv/config'
import { Timestamp } from 'firebase-admin/firestore'
import { db } from '../src/config/firebase.js'
import { toDate } from '../src/utils/time.js'
import assertNotProduction from './lib/prodGuard.js'

const banner = (t) => console.log('\n' + '='.repeat(64) + '\n' + t + '\n' + '='.repeat(64))

// Collections and the date fields each one stores.
const TARGETS = {
  bookings: ['createdAt', 'updatedAt', 'cancelledAt'],
  payments: ['createdAt', 'updatedAt'],
  refunds: ['createdAt', 'updatedAt'],
  users: ['createdAt', 'updatedAt'],
  sessions: ['createdAt', 'lastUsedAt', 'expiresAt', 'revokedAt'],
  emailLogs: ['createdAt', 'updatedAt'],
  audit_logs: ['createdAt'],
  coupons: ['createdAt', 'updatedAt']
}

const main = async () => {
  const apply = process.argv.includes('--apply')

  assertNotProduction('This migration rewrites stored date fields.')

  banner(apply ? 'TIMESTAMP MIGRATION (APPLYING)' : 'TIMESTAMP MIGRATION (DRY RUN)')

  let totalConverted = 0
  let totalUnparseable = 0

  for (const [collection, fields] of Object.entries(TARGETS)) {
    const snap = await db.collection(collection).get().catch(() => null)
    if (!snap || snap.empty) {
      console.log(`\n${collection}: empty, nothing to do`)
      continue
    }

    const pending = []
    const unparseable = []

    for (const doc of snap.docs) {
      const data = doc.data()
      const patch = {}

      for (const field of fields) {
        const value = data[field]
        if (value === undefined || value === null) continue
        // Already a Timestamp — nothing to do, and this is what makes the
        // script safe to re-run.
        if (typeof value?.toDate === 'function') continue

        const parsed = toDate(value)
        if (!parsed) {
          unparseable.push({ id: doc.id, field, value })
          continue
        }
        patch[field] = Timestamp.fromDate(parsed)
      }

      if (Object.keys(patch).length) pending.push({ ref: doc.ref, patch })
    }

    const fieldCount = pending.reduce((n, p) => n + Object.keys(p.patch).length, 0)
    console.log(`\n${collection}: ${snap.size} document(s)`)
    console.log(`  • ${pending.length} document(s) to convert (${fieldCount} field(s))`)
    if (unparseable.length) {
      console.log(`  • ${unparseable.length} unparseable value(s) — LEFT UNTOUCHED:`)
      unparseable.slice(0, 5).forEach((u) =>
        console.log(`      ${u.id}.${u.field} = ${JSON.stringify(u.value)?.slice(0, 60)}`)
      )
    }

    totalUnparseable += unparseable.length

    if (!apply || !pending.length) continue

    for (let i = 0; i < pending.length; i += 400) {
      const batch = db.batch()
      pending.slice(i, i + 400).forEach(({ ref, patch }) => batch.update(ref, patch))
      await batch.commit()
    }
    totalConverted += fieldCount
    console.log(`  ✓ converted ${fieldCount} field(s)`)
  }

  if (!apply) {
    banner('DRY RUN — nothing written. Re-run with --apply.')
    return
  }

  banner('TIMESTAMP MIGRATION COMPLETE')
  console.log(`  ${totalConverted} field(s) converted to Timestamp`)
  if (totalUnparseable) {
    console.log(`  ${totalUnparseable} unparseable value(s) left as-is — inspect these by hand.`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Timestamp migration failed:', err)
    process.exit(1)
  })
