/**
 * Seed Firestore with realistic outstation cab inventory for development/testing.
 *
 * ROOT CAUSE this fixes: /cabs/results showed "0 of 0 cabs" for Delhi → Jaipur.
 * The search controller was fine — the only seeded cabs (scripts/seedCabsFirebase.js)
 * ran city → "Airport"/"Hotel"/"Beach" pseudo-routes with ₹30-₹500 fares, so no
 * intercity search could ever match one.
 *
 * Shape notes (these matter, they are load-bearing for search and pricing):
 *   - `from`/`to` are matched with a substring `includes`, so pickups are stored
 *     as "New Delhi" — that matches a search for "Delhi" AND for "New Delhi".
 *   - `available` MUST be a boolean; the public search treats a number as unavailable.
 *   - `price` is the WHOLE one-way fare for the route, and `perKmRate` is
 *     deliberately NOT stored. pricingService computes `price + perKmRate × km`,
 *     so storing both would charge the distance twice.
 *   - `distanceKm` is the route reference pricingService validates the client's
 *     claimed trip distance against (±25% under / +50% over).
 *
 * Idempotent: doc ids are derived from route + cab type, so re-running updates
 * in place instead of duplicating.
 *
 * Run from makemytrip-backend:
 *   node scripts/seedCabsFirestore.js            # upsert outstation cabs
 *   node scripts/seedCabsFirestore.js --clear    # wipe the cabs collection first
 *
 * PRODUCTION RULE: development/test inventory only. It lives in Firestore, not
 * in any React component, and can be replaced by real vendor inventory anytime.
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import assertNotProduction from './lib/prodGuard.js'

const banner = (t) => console.log('\n' + '='.repeat(60) + '\n' + t + '\n' + '='.repeat(60))
const now = () => new Date().toISOString()

// One-way road distances (km), seeded in both directions.
const ROUTES = [
  { a: 'New Delhi', b: 'Jaipur', km: 280 },
  { a: 'New Delhi', b: 'Agra', km: 233 },
  { a: 'New Delhi', b: 'Chandigarh', km: 245 },
  { a: 'New Delhi', b: 'Dehradun', km: 250 },
  { a: 'New Delhi', b: 'Rishikesh', km: 240 },
  { a: 'New Delhi', b: 'Manali', km: 530 },
  { a: 'Agra', b: 'Jaipur', km: 240 },
  { a: 'Jaipur', b: 'Udaipur', km: 395 },
  { a: 'Jaipur', b: 'Jodhpur', km: 335 },
  { a: 'Jodhpur', b: 'Jaisalmer', km: 285 },
  { a: 'Mumbai', b: 'Pune', km: 150 },
  { a: 'Mumbai', b: 'Goa', km: 590 },
  { a: 'Pune', b: 'Goa', km: 440 },
  { a: 'Bengaluru', b: 'Chennai', km: 350 },
  { a: 'Bengaluru', b: 'Hyderabad', km: 570 },
  { a: 'Chandigarh', b: 'Shimla', km: 115 },
  { a: 'Shimla', b: 'Manali', km: 250 },
  { a: 'Amritsar', b: 'Chandigarh', km: 230 },
  { a: 'Ahmedabad', b: 'Vadodara', km: 110 },
  { a: 'Ahmedabad', b: 'Surat', km: 265 },
  { a: 'Kochi', b: 'Thiruvananthapuram', km: 200 },
  { a: 'Kolkata', b: 'Bhubaneswar', km: 440 },
  { a: 'Lucknow', b: 'Varanasi', km: 320 },
  { a: 'Indore', b: 'Bhopal', km: 195 }
]

// hire = fixed component, perKm = distance component. Both are folded into the
// stored `price`; see the header note on why perKmRate is not persisted.
const CAB_TYPES = [
  { type: 'Hatchback', hire: 350, perKm: 10, capacity: 4, luggage: 2, models: ['Maruti WagonR', 'Hyundai Santro', 'Tata Indica'] },
  { type: 'Sedan', hire: 450, perKm: 12, capacity: 4, luggage: 3, models: ['Maruti Swift Dzire', 'Toyota Etios', 'Honda Amaze'] },
  { type: 'SUV', hire: 700, perKm: 15, capacity: 6, luggage: 4, models: ['Maruti Ertiga', 'Mahindra Marazzo', 'Toyota Rumion'] },
  { type: 'Premium SUV', hire: 1000, perKm: 19, capacity: 7, luggage: 5, models: ['Toyota Innova Crysta', 'Kia Carens', 'Mahindra XUV700'] },
  { type: 'Tempo Traveller', hire: 1500, perKm: 26, capacity: 12, luggage: 10, models: ['Force Tempo Traveller 12S', 'Force Traveller Deluxe'] }
]

const AMENITIES = {
  'Hatchback': ['AC', 'Music System', 'First Aid Kit'],
  'Sedan': ['AC', 'Music System', 'Charging Point', 'First Aid Kit'],
  'SUV': ['AC', 'Music System', 'Charging Point', 'Extra Legroom', 'First Aid Kit'],
  'Premium SUV': ['AC', 'Music System', 'Charging Point', 'Extra Legroom', 'Bottled Water', 'GPS Tracking'],
  'Tempo Traveller': ['AC', 'Push-back Seats', 'Charging Point', 'Bottled Water', 'GPS Tracking', 'Luggage Carrier']
}

const DRIVERS = [
  'Rajesh Kumar', 'Amit Singh', 'Vikas Patel', 'Suresh Verma', 'Ramesh Gupta',
  'Arjun Nair', 'Harish Reddy', 'Mohammed Ali', 'Anil Sharma', 'Pradeep Kumar',
  'Vikram Rathore', 'Lokesh Rao', 'Santhosh Kumar', 'Manoj Bisht', 'Peter Pereira',
  'John Fernandes', 'Naveen Kumar', 'Ashok Sharma', 'Deepak Verma', 'Sandeep Patel'
]

// RTO prefix of the pickup city, so number plates look local to the route.
const RTO = {
  'New Delhi': 'DL 1C', 'Jaipur': 'RJ 14', 'Agra': 'UP 80', 'Chandigarh': 'CH 01',
  'Dehradun': 'UK 07', 'Rishikesh': 'UK 14', 'Manali': 'HP 01', 'Shimla': 'HP 03',
  'Udaipur': 'RJ 27', 'Jodhpur': 'RJ 19', 'Jaisalmer': 'RJ 15', 'Mumbai': 'MH 01',
  'Pune': 'MH 12', 'Goa': 'GA 03', 'Bengaluru': 'KA 01', 'Chennai': 'TN 01',
  'Hyderabad': 'TS 07', 'Amritsar': 'PB 02', 'Ahmedabad': 'GJ 01', 'Vadodara': 'GJ 06',
  'Surat': 'GJ 05', 'Kochi': 'KL 07', 'Thiruvananthapuram': 'KL 01', 'Kolkata': 'WB 02',
  'Bhubaneswar': 'OD 02', 'Lucknow': 'UP 32', 'Varanasi': 'UP 65', 'Indore': 'MP 09',
  'Bhopal': 'MP 04'
}

const CANCELLATION = 'Free cancellation up to 4 hours before pickup. 50% refund within 4 hours. No refund after the driver is dispatched.'

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const pick = (arr, i) => arr[i % arr.length]

const fmtDuration = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/** One cab per type for a single direction of a route. */
const buildCabsForLeg = (from, to, km, legIndex) => {
  // Highway average ~50 km/h door to door, plus a fixed 20 min pickup buffer.
  const durationMinutes = Math.round((km / 50) * 60) + 20

  return CAB_TYPES.map((cab, i) => {
    const seed = legIndex * CAB_TYPES.length + i
    const model = pick(cab.models, seed)
    const price = Math.round((cab.hire + cab.perKm * km) / 10) * 10

    return {
      id: `cab_${slug(from)}_${slug(to)}_${slug(cab.type)}`,
      doc: {
        from,
        to,
        type: cab.type,
        model,
        price,
        capacity: cab.capacity,
        luggageCapacity: cab.luggage,
        distanceKm: km,
        durationMinutes,
        estimatedTime: fmtDuration(durationMinutes),
        tripType: 'Outstation One-Way',
        fuelType: cab.type === 'Hatchback' ? 'CNG' : 'Diesel',
        driver: pick(DRIVERS, seed * 3 + from.length),
        phone: `+91 9${String(800000000 + seed * 137911).slice(0, 9)}`,
        vehicleNumber: `${RTO[from] || 'DL 1C'} ${String.fromCharCode(65 + (seed % 26))}${String.fromCharCode(65 + ((seed * 7) % 26))} ${1000 + ((seed * 373) % 8999)}`,
        rating: Math.round((4.1 + (seed % 8) * 0.1) * 10) / 10,
        amenities: AMENITIES[cab.type],
        inclusions: ['Toll & state permit', 'Driver allowance', 'GST'],
        cancellationPolicy: CANCELLATION,
        // Boolean — a number here makes the cab invisible to the public search.
        available: true,
        availableCount: 3 + (seed % 5),
        isActive: true,
        isDeleted: false
      }
    }
  })
}

const clearCollection = async () => {
  const snap = await db.collection('cabs').get()
  if (snap.empty) return 0
  // Firestore caps a batch at 500 writes.
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch()
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  return snap.size
}

const upsert = async (records) => {
  const existing = new Set((await db.collection('cabs').select().get()).docs.map((d) => d.id))
  let created = 0
  let updated = 0

  for (let i = 0; i < records.length; i += 400) {
    const batch = db.batch()
    records.slice(i, i + 400).forEach(({ id, doc }) => {
      const isNew = !existing.has(id)
      isNew ? created++ : updated++
      const payload = { ...doc, updatedAt: now() }
      if (isNew) payload.createdAt = now()
      batch.set(db.collection('cabs').doc(id), payload, { merge: true })
    })
    await batch.commit()
  }

  return { created, updated }
}

const main = async () => {
  // --clear bulk-deletes the entire cabs collection; never let it run on prod.
  assertNotProduction('This seed script inserts and can delete cab inventory.')

  banner('FIRESTORE CAB SEED (dev/test outstation inventory)')

  const records = []
  ROUTES.forEach((r, idx) => {
    records.push(...buildCabsForLeg(r.a, r.b, r.km, idx * 2))
    records.push(...buildCabsForLeg(r.b, r.a, r.km, idx * 2 + 1))
  })

  console.log(`Built ${records.length} cabs: ${ROUTES.length} routes × 2 directions × ${CAB_TYPES.length} cab types.`)
  ROUTES.forEach((r) => console.log(`  • ${r.a} ⇄ ${r.b} (${r.km} km)`))

  if (process.argv.includes('--clear')) {
    console.log('\n--clear: wiping the cabs collection...')
    console.log(`  Deleted ${await clearCollection()} existing cabs.`)
  }

  console.log('\nUpserting (idempotent on route + cab type)...')
  const { created, updated } = await upsert(records)
  console.log(`  +${created} created, ${updated} updated in place`)

  // Verify with the SAME filter chain the public search controller applies.
  const snap = await db.collection('cabs').where('isActive', '==', true).get()
  const matched = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.from?.toLowerCase().includes('delhi') && c.to?.toLowerCase().includes('jaipur'))
    .filter((c) => (typeof c.available === 'number' ? c.available > 0 : c.available !== false))
    .sort((x, y) => x.price - y.price)

  console.log(`\nVerifying Delhi → Jaipur (controller-equivalent filter): ${matched.length} cabs`)
  matched.forEach((c) => console.log(`    - ${c.type} (${c.model}) ₹${c.price} · ${c.capacity} seats · ${c.distanceKm} km · ${c.rating}★`))

  banner('✅ CAB SEED COMPLETE')
  console.log('  Test the search: http://localhost:5173/cabs/results')
  console.log('  Remove dev data anytime: node scripts/seedCabsFirestore.js --clear')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
