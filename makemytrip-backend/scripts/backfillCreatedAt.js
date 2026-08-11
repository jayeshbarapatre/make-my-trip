/**
 * Gives every inventory document a `createdAt`.
 *
 * Firestore's `orderBy` silently drops documents that lack the field being
 * ordered on. So the moment a listing is sorted or paginated by `createdAt`,
 * any record without one disappears from the admin panel — no error, no empty
 * state, just quietly missing rows. Seeded and hand-created records are the
 * usual offenders.
 *
 * Backfilling is the prerequisite for paginating those lists at all, which is
 * what stops the admin panel reading a whole collection per page load.
 *
 *   npm run migrate:created-at             # report what is missing
 *   npm run migrate:created-at -- --apply  # write it
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { now } from '../src/utils/time.js'
import assertNotProduction from './lib/prodGuard.js'

const COLLECTIONS = ['flights', 'hotels', 'buses', 'trains', 'cabs']
const apply = process.argv.includes('--apply')

const banner = (t) => console.log('\n' + '='.repeat(64) + '\n' + t + '\n' + '='.repeat(64))

const main = async () => {
  if (apply) assertNotProduction('This script writes to every inventory collection.')

  banner(apply ? 'BACKFILL createdAt' : 'BACKFILL createdAt (DRY RUN)')

  let totalMissing = 0

  for (const collection of COLLECTIONS) {
    const [total, ordered] = await Promise.all([
      db.collection(collection).count().get().then((s) => s.data().count),
      db.collection(collection).orderBy('createdAt', 'desc').count().get().then((s) => s.data().count)
    ])

    const missing = total - ordered
    totalMissing += missing
    console.log(`  ${collection.padEnd(8)} ${String(total).padStart(5)} documents, ${String(missing).padStart(4)} without createdAt`)

    if (!apply || missing === 0) continue

    // Only the documents that need it are read, by walking the collection and
    // skipping any that already have the field.
    const snap = await db.collection(collection).get()
    let batch = db.batch()
    let queued = 0

    for (const doc of snap.docs) {
      if (doc.data().createdAt !== undefined) continue
      batch.update(doc.ref, { createdAt: now() })
      queued++
      if (queued % 400 === 0) { await batch.commit(); batch = db.batch() }
    }

    if (queued % 400 !== 0) await batch.commit()
    console.log(`           -> wrote createdAt on ${queued}`)
  }

  banner(
    totalMissing === 0
      ? 'Nothing to do — every document already has createdAt'
      : apply
        ? `Done — ${totalMissing} document(s) backfilled`
        : `${totalMissing} document(s) would be updated. Re-run with --apply.`
  )
  return true
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('backfill failed:', err.message); process.exit(1) })
