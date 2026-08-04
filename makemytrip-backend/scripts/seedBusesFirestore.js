/**
 * Seed Firestore with realistic bus inventory for development/testing.
 *
 * ROOT CAUSE this fixes: the Bus Results page showed "0 of 0 buses" on routes
 * that demonstrably had inventory. Two defects combined:
 *
 *  1. This script wrote `from`/`to` but never the denormalised `fromCanonical`/
 *     `toCanonical`/`routeIndexed` fields that `inventorySearch.js` queries. The
 *     admin and vendor create paths DO write them, so the collection ended up
 *     partially indexed — and the indexed equality filter cannot match a
 *     document that has no `fromCanonical` at all. Every bus seeded here was
 *     invisible to search.
 *  2. Hyderabad → Chennai had no inventory on any route list.
 *
 * Inventory is now built through `routeIndexFields()`, the same helper the admin
 * and vendor paths use, so seeded buses are searchable the moment they land.
 *
 * Buses are recurring services: one document sells on many travel dates, and
 * seats are held per date in the `availability` subcollection. So this seeds ~15
 * buses per route rather than one per route per day, and marks them
 * `datedAvailability` so the per-date path is used.
 *
 * Idempotent: re-running does not duplicate buses (deterministic document ids).
 *
 * Run from makemytrip-backend:
 *   npm run seed:buses              # upsert bus inventory
 *   npm run seed:buses -- --clear   # wipe the buses collection first
 *
 * PRODUCTION RULE: development/test inventory only. It is NOT hard-coded in any
 * React component — it lives in Firestore and can be replaced with real vendor
 * inventory at any time via `--clear`.
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { ROUTES, OPERATORS, BUS_TYPES, buildAllBuses } from './lib/busInventory.js'
import assertNotProduction from './lib/prodGuard.js'

const banner = (t) => console.log('\n' + '='.repeat(64) + '\n' + t + '\n' + '='.repeat(64))

const clearCollection = async () => {
  let deleted = 0
  for (;;) {
    const snap = await db.collection('buses').limit(400).get()
    if (snap.empty) break
    const batch = db.batch()
    snap.docs.forEach((d) => batch.delete(d.ref))
    await batch.commit()
    deleted += snap.size
    if (snap.size < 400) break
  }
  return deleted
}

/** Upsert by deterministic id — idempotent, and costs no reads. */
const writeBuses = async (docs) => {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch()
    for (const { id, data } of docs.slice(i, i + 400)) {
      batch.set(db.collection('buses').doc(id), data, { merge: true })
    }
    await batch.commit()
  }
  return docs.length
}

const main = async () => {
  // --clear bulk-deletes the entire buses collection; never let it run on prod.
  assertNotProduction('This seed script inserts and can delete bus inventory.')

  banner('FIRESTORE BUS SEED (dev/test inventory)')

  // ~15 per route × 13 routes ≈ 195 buses, comfortably over the 100 minimum and
  // enough spread for filters to be meaningful on every route.
  const allDocs = buildAllBuses(15)

  console.log(`Built ${allDocs.length} buses across ${ROUTES.length} routes.`)
  for (const r of ROUTES) console.log(`  • ${r.from} → ${r.to} (${r.km} km)`)
  console.log(`\nOperators: ${OPERATORS.map((o) => o.name).join(', ')}`)
  console.log(`Classes:   ${BUS_TYPES.map((t) => t.name).join(', ')}`)

  if (process.argv.includes('--clear')) {
    console.log('\n--clear: wiping the buses collection...')
    console.log(`  Deleted ${await clearCollection()} existing buses.`)
  }

  console.log('\nWriting (idempotent upsert on deterministic id)...')
  console.log(`  ✓ ${await writeBuses(allDocs)} buses written`)

  banner('✅ BUS SEED COMPLETE')
  console.log('  Verify search:   npm run test:buses')
  console.log('  Results page:    http://localhost:5173/buses/results?from=Chennai&to=Bengaluru')
  console.log('  Remove dev data: npm run seed:buses -- --clear')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
