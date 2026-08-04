/**
 * Migrates hotels, buses and trains to per-travel-date inventory.
 *
 * WHY: these three carried a single scalar counter (`roomsAvailable` /
 * `seatsAvailable`) with no date attached, so a 50-room hotel sold 50 bookings
 * in total rather than 50 per night. Two guests with non-overlapping stays
 * competed for the same number, and cancelling a January booking returned a
 * room to July. Flights were never affected — each flight document already
 * represents one dated departure.
 *
 * WHAT IT WRITES: two fields on each inventory document.
 *
 *   dailyInventory     the per-date capacity
 *                        hotels/buses -> { total: n }
 *                        trains       -> { classes: { SL: n, '3A': n, … } }
 *   datedAvailability  true — the flag src/services/bookingService.js reads to
 *                      decide which reservation path to use
 *
 * It does NOT create availability documents. Those are written lazily on first
 * reservation; pre-materialising a rolling year would cost hundreds of
 * thousands of documents that only record "nobody has booked this yet".
 *
 * It does NOT remove the legacy counters. They stay untouched so the change is
 * reversible and so a half-migrated collection keeps selling: bookingService
 * falls back to the legacy path for any item without the flag.
 *
 * SAFETY
 *   - Dry run by default; --apply is required to write.
 *   - Idempotent: an item already carrying a correct dailyInventory is skipped,
 *     so re-running after an interruption resumes rather than double-counting.
 *   - Restart safe: each document is independent; there is no cursor to lose.
 *   - Transaction safe: capacity is derived only from fields already on the
 *     document, so a concurrent booking cannot be overwritten.
 *   - Rollback: scripts/rollbackDatedAvailability.js
 *
 * Run from makemytrip-backend:
 *   npm run migrate:dated-availability
 *   npm run migrate:dated-availability -- --apply
 *   npm run migrate:dated-availability -- --apply --only=hotels
 */

import 'dotenv/config'
import { pathToFileURL } from 'url'
import { db } from '../src/config/firebase.js'
import assertNotProduction from './lib/prodGuard.js'
import { DAILY_INVENTORY_FIELD, DATED_FLAG } from '../src/services/availability.js'

const APPLY = process.argv.includes('--apply')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]

const BATCH_LIMIT = 400

/** Default coach mix for a train that does not declare its own classes. */
const DEFAULT_TRAIN_CLASSES = { SL: 72, '3A': 64, '2A': 48 }

const COLLECTIONS = {
  hotels: {
    label: 'hotel',
    // Ordered by trustworthiness: an explicit total beats a live remaining count.
    capacityFields: ['totalRooms', 'rooms', 'roomsAvailable'],
    classed: false
  },
  buses: {
    label: 'bus',
    capacityFields: ['totalSeats', 'seats', 'seatsAvailable'],
    classed: false
  },
  trains: {
    label: 'train',
    capacityFields: ['totalSeats', 'seats', 'seatsAvailable'],
    classed: true
  }
}

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Derives per-date capacity from whatever the document already carries.
 * Returns null when nothing usable is present, so the item is reported rather
 * than silently given a made-up number.
 */
export const deriveInventory = (data, spec) => {
  if (spec.classed) {
    // A train that already lists its coach composition keeps it.
    const declared = data.classes ?? data.coachClasses ?? data.seatsByClass
    if (declared && typeof declared === 'object' && !Array.isArray(declared)) {
      const classes = {}
      for (const [code, value] of Object.entries(declared)) {
        const seats = num(value?.total ?? value?.seats ?? value)
        if (seats !== null) classes[String(code).toUpperCase()] = seats
      }
      if (Object.keys(classes).length) return { classes }
    }

    // Otherwise split the scalar across the standard mix, preserving the total
    // so capacity neither grows nor shrinks in the migration.
    //
    // `find` yields undefined (not null) when no field carries a number, so both
    // must be rejected — returning { total: undefined } here would flag the item
    // as migrated while leaving it with no capacity, i.e. silently unbookable.
    const total = spec.capacityFields.map((f) => num(data[f])).find((v) => v !== null)
    if (total === null || total === undefined) return null

    const template = DEFAULT_TRAIN_CLASSES
    const templateTotal = Object.values(template).reduce((a, b) => a + b, 0)
    const classes = {}
    let assigned = 0
    const codes = Object.keys(template)

    codes.forEach((code, i) => {
      const share = i === codes.length - 1
        ? total - assigned // last class absorbs the rounding remainder
        : Math.round((template[code] / templateTotal) * total)
      classes[code] = Math.max(0, share)
      assigned += classes[code]
    })

    return { classes }
  }

  const total = spec.capacityFields.map((f) => num(data[f])).find((v) => v !== null)
  return (total === null || total === undefined) ? null : { total }
}

/** True when the stored inventory already matches what we would write. */
const alreadyCorrect = (data, desired) => {
  if (data[DATED_FLAG] !== true) return false
  const current = data[DAILY_INVENTORY_FIELD]
  if (!current || typeof current !== 'object') return false
  return JSON.stringify(current) === JSON.stringify(desired)
}

const migrateCollection = async (name, spec) => {
  const snap = await db.collection(name).get()
  const report = { name, total: snap.size, migrated: 0, skipped: 0, unresolved: [] }

  let batch = db.batch()
  let pending = 0

  for (const doc of snap.docs) {
    const data = doc.data()

    if (data.isDeleted === true) {
      report.skipped++
      continue
    }

    const desired = deriveInventory(data, spec)
    if (desired === null) {
      report.unresolved.push(doc.id)
      continue
    }

    if (alreadyCorrect(data, desired)) {
      report.skipped++
      continue
    }

    report.migrated++

    if (APPLY) {
      batch.set(doc.ref, {
        [DAILY_INVENTORY_FIELD]: desired,
        [DATED_FLAG]: true,
        datedAvailabilityMigratedAt: new Date().toISOString()
      }, { merge: true })
      pending++

      if (pending >= BATCH_LIMIT) {
        await batch.commit()
        batch = db.batch()
        pending = 0
      }
    }
  }

  if (APPLY && pending > 0) await batch.commit()

  return report
}

const main = async () => {
  // Matches the other migrations: blocked against production unless the project
  // is allowlisted or --i-know-this-runs-on-production is passed.
  assertNotProduction('This migration rewrites inventory documents.')

  const targets = ONLY ? { [ONLY]: COLLECTIONS[ONLY] } : COLLECTIONS
  if (ONLY && !COLLECTIONS[ONLY]) {
    console.error(`Unknown collection "${ONLY}". Choose one of: ${Object.keys(COLLECTIONS).join(', ')}`)
    process.exit(1)
  }

  console.log(APPLY
    ? '⚙️  Applying dated-availability migration…\n'
    : '🔍 Dry run — nothing will be written. Re-run with --apply to commit.\n')

  let unresolvedTotal = 0

  for (const [name, spec] of Object.entries(targets)) {
    const r = await migrateCollection(name, spec)
    unresolvedTotal += r.unresolved.length

    console.log(`${name}`)
    console.log(`   documents      ${r.total}`)
    console.log(`   ${APPLY ? 'migrated' : 'to migrate'}     ${r.migrated}`)
    console.log(`   already done   ${r.skipped}`)
    if (r.unresolved.length) {
      console.log(`   ⚠️  no capacity  ${r.unresolved.length} — ${r.unresolved.slice(0, 5).join(', ')}${r.unresolved.length > 5 ? ' …' : ''}`)
    }
    console.log()
  }

  if (unresolvedTotal) {
    console.log(`⚠️  ${unresolvedTotal} document(s) declare no room or seat count and were left on the legacy path.`)
    console.log('   They keep selling through the old counter. Give them a capacity and re-run.\n')
  }

  console.log(APPLY
    ? '✅ Migration complete. Verify with: npm run verify:dated-availability'
    : 'ℹ️  Dry run finished. Re-run with --apply to write.')

  process.exit(0)
}

// Only run when invoked directly. Importing this module (the test suite pins
// deriveInventory, which is the part that can silently change capacity) must
// not kick off a migration.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('❌ Migration failed:', err.message)
    console.error('   Nothing is left half-written: documents are committed in independent batches,')
    console.error('   and re-running skips everything already migrated.')
    process.exit(1)
  })
}
