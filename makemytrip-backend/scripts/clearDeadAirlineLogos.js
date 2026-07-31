/**
 * Clears the dead `airlineLogo` hotlinks stored on flight documents.
 *
 * The stored URLs point at logos.makemytrip.com, a host that no longer resolves,
 * so every one of them is a broken external reference. Nothing renders the field
 * (the UI draws an airline-code badge from `airlineCode`), and the flight
 * controller already normalises a missing value to null — so clearing it removes
 * dead data without changing the API contract.
 *
 * Airline marks are trademarks we have no licence to redistribute, so they are
 * cleared rather than replaced with a bundled asset.
 *
 *   node scripts/clearDeadAirlineLogos.js --dry   # report only
 *   node scripts/clearDeadAirlineLogos.js         # apply (writes a backup first)
 */
import { writeFileSync } from 'fs'
import { db } from '../src/config/firebase.js'

const dry = process.argv.includes('--dry')

const snap = await db.collection('flights').get()
console.log(`Scanned ${snap.size} flight documents`)

const backup = []
snap.forEach((doc) => {
  const logo = doc.data().airlineLogo
  if (typeof logo === 'string' && /^https?:/i.test(logo)) {
    backup.push({ id: doc.id, airlineLogo: logo })
  }
})

console.log(`Documents carrying an external airlineLogo: ${backup.length}`)

if (!backup.length) {
  console.log('Nothing to do.')
  process.exit(0)
}

if (dry) {
  console.log(' e.g.', backup[0].id, '->', backup[0].airlineLogo)
  console.log('Dry run — nothing written.')
  process.exit(0)
}

const backupFile = `airline-logos-backup-${Date.now()}.json`
writeFileSync(backupFile, JSON.stringify(backup, null, 2))
console.log(`Backup written to ${backupFile}`)

let written = 0
for (let i = 0; i < backup.length; i += 400) {
  const batch = db.batch()
  backup.slice(i, i + 400).forEach(({ id }) =>
    batch.update(db.collection('flights').doc(id), { airlineLogo: null }))
  await batch.commit()
  written += Math.min(400, backup.length - i)
  console.log(`  committed ${written}/${backup.length}`)
}

console.log('Done — no flight document references an external logo host.')
process.exit(0)
