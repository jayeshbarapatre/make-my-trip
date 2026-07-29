/**
 * Rewrites every externally hosted hotel image URL stored in Firestore to a local
 * photograph served from the frontend's public/images folder.
 *
 * Only the `image` and `images` fields are touched — names, prices, ratings,
 * amenities and availability are left exactly as they are.
 *
 *   node scripts/relocalizeHotelImages.js --dry     # report only, no writes
 *   node scripts/relocalizeHotelImages.js           # apply (writes a backup first)
 */
import { writeFileSync } from 'fs'
import { db } from '../src/config/firebase.js'

const PHOTOS = [
  'hotel-luxury-exterior', 'hotel-room', 'hotel-pool', 'hotel-lobby', 'hotel-restaurant',
  'hotel-suite', 'hotel-room-2', 'hotel-reception', 'hotel-rooftop', 'hotel-pool-2',
  'hotel-room-3', 'hotel-resort', 'hotel-restaurant-2', 'hotel-bathroom',
].map((k) => `/images/hotels/${k}-800.webp`)

const isExternal = (u) => typeof u === 'string' && /^https?:/i.test(u)

// Stable per-document offset so a hotel keeps the same photographs between runs.
const offsetFor = (id) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % PHOTOS.length
}

const dry = process.argv.includes('--dry')

const snap = await db.collection('hotels').get()
console.log(`Scanned ${snap.size} hotel documents`)

const backup = []
const updates = []

snap.forEach((doc) => {
  const h = doc.data()
  const base = offsetFor(doc.id)
  const patch = {}

  if (Array.isArray(h.images) && h.images.some(isExternal)) {
    patch.images = h.images.map((u, i) => (isExternal(u) ? PHOTOS[(base + i) % PHOTOS.length] : u))
  }
  if (isExternal(h.image)) {
    patch.image = PHOTOS[base]
  }
  // A listing with no photograph at all still gets one.
  if (!h.image && (!Array.isArray(h.images) || h.images.length === 0)) {
    patch.image = PHOTOS[base]
    patch.images = [PHOTOS[base], PHOTOS[(base + 1) % PHOTOS.length], PHOTOS[(base + 2) % PHOTOS.length]]
  }

  if (Object.keys(patch).length) {
    backup.push({ id: doc.id, image: h.image ?? null, images: h.images ?? null })
    updates.push({ id: doc.id, patch })
  }
})

console.log(`Documents needing an image rewrite: ${updates.length}`)

if (dry) {
  updates.slice(0, 3).forEach((u) => console.log(' e.g.', u.id, JSON.stringify(u.patch).slice(0, 160)))
  console.log('Dry run — nothing written.')
  process.exit(0)
}

const backupFile = `hotel-images-backup-${Date.now()}.json`
writeFileSync(backupFile, JSON.stringify(backup, null, 2))
console.log(`Backup of previous image fields written to ${backupFile}`)

let written = 0
for (let i = 0; i < updates.length; i += 400) {
  const batch = db.batch()
  updates.slice(i, i + 400).forEach(({ id, patch }) => batch.update(db.collection('hotels').doc(id), patch))
  await batch.commit()
  written += Math.min(400, updates.length - i)
  console.log(`  committed ${written}/${updates.length}`)
}

console.log('Done — all stored hotel images now point at local photographs.')
process.exit(0)
