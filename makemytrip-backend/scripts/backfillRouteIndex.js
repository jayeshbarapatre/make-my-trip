/**
 * Writes the denormalised route fields that make inventory search indexable.
 *
 * WHY: Firestore has no case-insensitive or substring matching, so every search
 * controller pulled its entire collection and filtered in memory — 509 reads for
 * one train search, ~1,596 for a cross-vertical page, roughly 31 searches before
 * the free-tier daily quota is gone.
 *
 * Adding `fromCanonical` / `toCanonical` (and `cityCanonical` for hotels) turns
 * the route filter into an equality query. Three equality filters need no
 * composite index; Firestore merges the automatic single-field ones.
 *
 * The canonical form also reunites inventory that is currently split across
 * spellings — trains and flights hold both "Delhi" and "New Delhi", so either
 * search previously missed half the records.
 *
 * `src/services/inventorySearch.js` probes for the `routeIndexed` flag once per
 * process and falls back to the old scan until this has run, so deploying the
 * new search before this migration degrades performance rather than breaking.
 *
 * SAFETY: dry run by default; idempotent (a document whose canonical values are
 * already correct is skipped); reports any document it cannot resolve rather
 * than guessing.
 *
 * Run from makemytrip-backend:
 *   npm run migrate:route-index
 *   npm run migrate:route-index -- --apply
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { canonicalCity } from '../src/utils/cities.js'
import { routeFieldsFor, ROUTE_INDEX_FLAG } from '../src/services/inventorySearch.js'
import { now } from '../src/utils/time.js'
import assertNotProduction from './lib/prodGuard.js'

const COLLECTIONS = ['flights', 'trains', 'buses', 'cabs', 'hotels']
const banner = (t) => console.log('\n' + '='.repeat(64) + '\n' + t + '\n' + '='.repeat(64))

const firstOf = (data, keys) => {
  for (const k of keys) if (data?.[k]) return data[k]
  return null
}

const main = async () => {
  const apply = process.argv.includes('--apply')

  assertNotProduction('This migration rewrites inventory documents.')

  banner(apply ? 'ROUTE INDEX BACKFILL (APPLYING)' : 'ROUTE INDEX BACKFILL (DRY RUN)')

  let totalPatched = 0
  let totalUnresolved = 0

  for (const collection of COLLECTIONS) {
    const spec = routeFieldsFor(collection)
    const snap = await db.collection(collection).get()

    const pending = []
    const unresolved = []

    for (const doc of snap.docs) {
      const data = doc.data()
      const patch = {}

      if (spec.city) {
        const city = firstOf(data, spec.legacyCity)
        if (!city) { unresolved.push({ id: doc.id, reason: 'no city field' }); continue }
        const canonical = canonicalCity(city)
        if (data[spec.city] !== canonical) patch[spec.city] = canonical
      } else {
        const from = firstOf(data, spec.legacyFrom)
        const to = firstOf(data, spec.legacyTo)
        if (!from || !to) { unresolved.push({ id: doc.id, reason: 'missing from/to' }); continue }

        const cf = canonicalCity(from)
        const ct = canonicalCity(to)
        if (data[spec.from] !== cf) patch[spec.from] = cf
        if (data[spec.to] !== ct) patch[spec.to] = ct
      }

      if (data[ROUTE_INDEX_FLAG] !== true) patch[ROUTE_INDEX_FLAG] = true

      // `isActive` absent means active everywhere in this codebase, but the
      // indexed query filters on it server-side — so it has to become explicit
      // or those documents would vanish from search.
      if (data.isActive === undefined) patch.isActive = true

      if (Object.keys(patch).length) {
        patch.updatedAt = now()
        pending.push({ ref: doc.ref, patch })
      }
    }

    console.log(`\n${collection}: ${snap.size} document(s)`)
    console.log(`  • ${pending.length} to patch`)
    if (unresolved.length) {
      console.log(`  • ${unresolved.length} unresolved — LEFT UNTOUCHED:`)
      unresolved.slice(0, 5).forEach((u) => console.log(`      ${u.id}: ${u.reason}`))
    }
    totalUnresolved += unresolved.length

    if (!apply || !pending.length) continue

    for (let i = 0; i < pending.length; i += 400) {
      const batch = db.batch()
      pending.slice(i, i + 400).forEach(({ ref, patch }) => batch.update(ref, patch))
      await batch.commit()
    }
    totalPatched += pending.length
    console.log(`  ✓ patched ${pending.length}`)
  }

  if (!apply) {
    banner('DRY RUN — nothing written. Re-run with --apply.')
    return
  }

  banner('ROUTE INDEX BACKFILL COMPLETE')
  console.log(`  ${totalPatched} document(s) patched`)
  if (totalUnresolved) console.log(`  ${totalUnresolved} unresolved — inspect by hand`)
  console.log('\n  Indexed search is now active. Verify with: npm run verify:search')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Route index backfill failed:', err)
    process.exit(1)
  })
