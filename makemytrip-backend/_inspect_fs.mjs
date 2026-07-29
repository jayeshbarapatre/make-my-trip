import { db } from './src/config/firebase.js'

const snap = await db.collection('hotels').get()
console.log('hotels documents in Firestore:', snap.size)

let ext = 0, local = 0, none = 0
const extUrls = new Set()
const cities = new Map()
let stringRating = 0

snap.forEach((d) => {
  const h = d.data()
  cities.set(h.city, (cities.get(h.city) || 0) + 1)
  if (typeof h.rating === 'string') stringRating++
  const all = [...(h.images || []), ...(h.image ? [h.image] : [])]
  if (!all.length) none++
  all.forEach((u) => {
    if (typeof u === 'string' && /^https?:/i.test(u)) { ext++; extUrls.add(u) }
    else local++
  })
})

console.log('image refs -> external:', ext, '| local:', local, '| docs with no image:', none)
console.log('distinct external URLs:', extUrls.size)
console.log('docs with string rating:', stringRating)
console.log('cities:', [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15))
process.exit(0)
