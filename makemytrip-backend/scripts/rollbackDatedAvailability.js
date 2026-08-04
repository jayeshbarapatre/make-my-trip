/**
 * Reverses scripts/backfillDatedAvailability.js.
 *
 * Clearing the `datedAvailability` flag sends bookingService back to the legacy
 * scalar counters (`roomsAvailable` / `seatsAvailable`), which the migration
 * never modified. Inventory therefore keeps selling throughout a rollback.
 *
 * WHAT IT DOES NOT DO BY DEFAULT: delete the `availability/{date}`
 * subcollections. Those documents are the only record of which nights are
 * actually sold. Deleting them while bookings reference those dates would drop
 * the reservations silently, so they are preserved unless --purge is passed —
 * and a re-run of the migration picks them straight back up, because
 * reservation counts live in those documents rather than being recomputed.
 *
 * SAFETY
 *   - Dry run by default; --apply is required to write.
 *   - Idempotent: an item already reverted is skipped.
 *   - Restart safe: independent per document, no cursor.
 *   - --purge is refused unless combined with --apply and --i-understand-purge,
 *     because it is the one genuinely destructive option here.
 *
 * Run from makemytrip-backend:
 *   npm run rollback:dated-availability
 *   npm run rollback:dated-availability -- --apply
 *   npm run rollback:dated-availability -- --apply --only=hotels
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { FieldValue } from 'firebase-admin/firestore'
import assertNotProduction from './lib/prodGuard.js'
import { DAILY_INVENTORY_FIELD, DATED_FLAG, AVAILABILITY_SUBCOLLECTION } from '../src/services/availability.js'

const APPLY = process.argv.includes('--apply')
const PURGE = process.argv.includes('--purge')
const PURGE_CONFIRMED = process.argv.includes('--i-understand-purge')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]

const COLLECTIONS = ['hotels', 'buses', 'trains']
const BATCH_LIMIT = 400

const purgeAvailability = async (docRef) => {
  const sub = await docRef.collection(AVAILABILITY_SUBCOLLECTION).get()
  if (sub.empty) return 0

  let batch = db.batch()
  let pending = 0
  for (const d of sub.docs) {
    batch.delete(d.ref)
    if (++pending >= BATCH_LIMIT) {
      await batch.commit()
      batch = db.batch()
      pending = 0
    }
  }
  if (pending > 0) await batch.commit()
  return sub.size
}

const rollbackCollection = async (name) => {
  const snap = await db.collection(name).get()
  const report = { name, total: snap.size, reverted: 0, skipped: 0, purged: 0 }

  let batch = db.batch()
  let pending = 0

  for (const doc of snap.docs) {
    const data = doc.data()

    if (data[DATED_FLAG] !== true && data[DAILY_INVENTORY_FIELD] === undefined) {
      report.skipped++
      continue
    }

    report.reverted++

    if (APPLY) {
      batch.update(doc.ref, {
        [DATED_FLAG]: FieldValue.delete(),
        [DAILY_INVENTORY_FIELD]: FieldValue.delete(),
        datedAvailabilityMigratedAt: FieldValue.delete(),
        datedAvailabilityRolledBackAt: new Date().toISOString()
      })
      pending++

      if (pending >= BATCH_LIMIT) {
        await batch.commit()
        batch = db.batch()
        pending = 0
      }

      if (PURGE) report.purged += await purgeAvailability(doc.ref)
    }
  }

  if (APPLY && pending > 0) await batch.commit()

  return report
}

const main = async () => {
  assertNotProduction('This rollback rewrites inventory documents.')

  if (PURGE && !(APPLY && PURGE_CONFIRMED)) {
    console.error('⛔ --purge deletes every availability/{date} document, which is the only record')
    console.error('   of which nights are sold. Bookings referencing those dates would lose their')
    console.error('   reservation. Pass --apply --purge --i-understand-purge if that is intended.')
    process.exit(1)
  }

  if (ONLY && !COLLECTIONS.includes(ONLY)) {
    console.error(`Unknown collection "${ONLY}". Choose one of: ${COLLECTIONS.join(', ')}`)
    process.exit(1)
  }

  console.log(APPLY
    ? '⚙️  Rolling back dated availability…\n'
    : '🔍 Dry run — nothing will be written. Re-run with --apply to commit.\n')

  for (const name of (ONLY ? [ONLY] : COLLECTIONS)) {
    const r = await rollbackCollection(name)
    console.log(`${name}`)
    console.log(`   documents          ${r.total}`)
    console.log(`   ${APPLY ? 'reverted' : 'to revert'}         ${r.reverted}`)
    console.log(`   already legacy     ${r.skipped}`)
    if (PURGE) console.log(`   availability docs deleted  ${r.purged}`)
    console.log()
  }

  console.log(PURGE
    ? '✅ Rollback complete. Availability history was purged.'
    : '✅ Rollback complete. availability/{date} documents were preserved — re-running the\n' +
      '   migration restores dated selling with reservation counts intact.')

  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Rollback failed:', err.message)
  process.exit(1)
})
