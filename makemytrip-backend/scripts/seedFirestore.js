/**
 * Seed Firestore with live-searchable inventory: flights, trains, cabs.
 *
 * This is the production gap-filler: the existing seed scripts target the legacy
 * Prisma/MongoDB path, but Firestore is the real database. The public search
 * controllers (firebaseFlightController / firebaseTrainController /
 * firebaseCabController) read these collections, so every document is written in
 * the EXACT shape those controllers expect — otherwise search returns nothing.
 *
 * Dates are generated relative to today so the inventory never goes stale.
 *
 * Usage (from makemytrip-backend):
 *   node scripts/seedFirestore.js                 # add flights + trains + cabs
 *   node scripts/seedFirestore.js --clear         # wipe the 3 collections first
 *   node scripts/seedFirestore.js --only=flights,cabs
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import assertNotProduction from './lib/prodGuard.js'

const COLLECT_CLEAR = new Set(['flights', 'trains', 'cabs'])

// dayOffset(n) -> YYYY-MM-DD for a date n days from today.
const dayOffset = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ISO timestamp for "date + HH:MM" treated as wall-clock UTC (matches the
// flightAdminController.combineDateTime convention so search shows the same time
// an admin would have typed).
const isoAt = (date, time) => new Date(`${date}T${time || '00:00'}:00.000Z`).toISOString()

const now = () => new Date().toISOString()

const banner = (t) => console.log('\n' + '='.repeat(60) + '\n' + t + '\n' + '='.repeat(60))

// ── Flights ── stored shape = what firebaseFlightController.normalizeFlight reads:
//    source, destination, sourceAirport, destinationAirport, departure (ISO),
//    arrival (ISO), duration (minutes), price, seats, seatsAvailable, airline,
//    airlineCode, flightNumber, stops, class, baggage, aircraft, isActive.
const FLIGHTS = [
  { airline: 'IndiGo', code: '6E', fn: '6E-101', src: 'New Delhi', sac: 'DEL', dst: 'Mumbai', dac: 'BOM', dep: ['07', 1, '06:00'], arr: ['08', 1, '08:25'], dur: 145, price: 5400, seats: 180, aircraft: 'Airbus A320' },
  { airline: 'Air India', code: 'AI', fn: 'AI-302', src: 'Mumbai', sac: 'BOM', dst: 'Chennai', dac: 'MAA', dep: ['09', 1, '09:15'], arr: ['09', 1, '11:10'], dur: 115, price: 4200, seats: 150, aircraft: 'Boeing 737' },
  { airline: 'Vistara', code: 'UK', fn: 'UK-811', src: 'Bengaluru', sac: 'BLR', dst: 'New Delhi', dac: 'DEL', dep: ['14', 2, '14:00'], arr: ['14', 2, '16:45'], dur: 165, price: 6100, seats: 160, aircraft: 'Airbus A321' },
  { airline: 'SpiceJet', code: 'SG', fn: 'SG-505', src: 'Kolkata', sac: 'CCU', dst: 'Hyderabad', dac: 'HYD', dep: ['07', 1, '07:30'], arr: ['07', 1, '09:40'], dur: 130, price: 3800, seats: 180, aircraft: 'Boeing 737' },
  { airline: 'Akasa Air', code: 'QP', fn: 'QP-1201', src: 'Ahmedabad', sac: 'AMD', dst: 'Mumbai', dac: 'BOM', dep: ['18', 1, '18:00'], arr: ['18', 1, '19:15'], dur: 75, price: 2900, seats: 189, aircraft: 'Boeing 737 Max' },
  { airline: 'IndiGo', code: '6E', fn: '6E-309', src: 'Pune', sac: 'PNQ', dst: 'Bengaluru', dac: 'BLR', dep: ['20', 2, '20:10'], arr: ['20', 2, '21:30'], dur: 80, price: 3100, seats: 180, aircraft: 'Airbus A320' },
  { airline: 'Vistara', code: 'UK', fn: 'UK-902', src: 'New Delhi', sac: 'DEL', dst: 'Goa', dac: 'GOI', dep: ['11', 3, '11:00'], arr: ['11', 3, '13:30'], dur: 150, price: 8500, seats: 160, aircraft: 'Airbus A320neo' },
  { airline: 'Air India', code: 'AI', fn: 'AI-111', src: 'Hyderabad', sac: 'HYD', dst: 'Mumbai', dac: 'BOM', dep: ['05', 2, '05:45'], arr: ['05', 2, '07:15'], dur: 90, price: 3600, seats: 150, aircraft: 'Airbus A319' },
  { airline: 'SpiceJet', code: 'SG', fn: 'SG-222', src: 'Chennai', sac: 'MAA', dst: 'Kolkata', dac: 'CCU', dep: ['15', 3, '15:20'], arr: ['15', 3, '17:40'], dur: 140, price: 4800, seats: 180, aircraft: 'Boeing 737' },
  { airline: 'Air India', code: 'AI', fn: 'AI-405', src: 'New Delhi', sac: 'DEL', dst: 'Mumbai', dac: 'BOM', dep: ['15', 1, '15:30'], arr: ['15', 1, '17:45'], dur: 135, price: 5800, seats: 170, aircraft: 'Airbus A321' },
  { airline: 'IndiGo', code: '6E', fn: '6E-710', src: 'Hyderabad', sac: 'HYD', dst: 'Kolkata', dac: 'CCU', dep: ['08', 2, '08:15'], arr: ['08', 2, '10:45'], dur: 150, price: 4900, seats: 180, aircraft: 'Airbus A320' },
  { airline: 'Vistara', code: 'UK', fn: 'UK-1024', src: 'Jaipur', sac: 'JAI', dst: 'New Delhi', dac: 'DEL', dep: ['16', 4, '16:00'], arr: ['16', 4, '17:15'], dur: 75, price: 1800, seats: 160, aircraft: 'Airbus A320' }
].map((f) => ({
  airline: f.airline,
  airlineCode: f.code,
  flightNumber: f.fn,
  source: f.src,
  sourceAirport: f.sac,
  destination: f.dst,
  destinationAirport: f.dac,
  departure: isoAt(dayOffset(f.dep[1]), f.dep[2]),
  arrival: isoAt(dayOffset(f.arr[1]), f.arr[2]),
  duration: f.dur,
  price: f.price,
  seats: f.seats,
  seatsAvailable: Math.floor(f.seats * 0.7),
  stops: 0,
  class: 'Economy',
  baggage: '15 kg check-in + 7 kg cabin',
  aircraft: f.aircraft,
  isActive: true,
  createdAt: now(),
  updatedAt: now(),
  isDeleted: false
}))

// ── Trains ── stored shape = what firebaseTrainController reads:
//    from, to, seatsAvailable, price, isActive, operatorName, trainNumber,
//    type, durationMinutes, amenities, departure{city,station,time},
//    arrival{...}.
const TRAINS = [
  { op: 'Rajdhani Express', num: '12951', type: 'AC', from: 'New Delhi', st: 'NDLS', to: 'Mumbai', tt: 'BCT', dep: ['16:55', 1], arr: ['08:35', 2], dur: 940, price: 2450, seats: 420 },
  { op: 'August Kranti Rajdhani', num: '12953', type: 'AC', from: 'New Delhi', st: 'NZM', to: 'Mumbai', tt: 'BCT', dep: ['17:40', 1], arr: ['10:55', 2], dur: 1035, price: 2150, seats: 310 },
  { op: 'Howrah Rajdhani', num: '12301', type: 'AC', from: 'New Delhi', st: 'NDLS', to: 'Kolkata', tt: 'HWH', dep: ['16:50', 1], arr: ['09:55', 2], dur: 1025, price: 2380, seats: 200 },
  { op: 'Duronto Express', num: '12273', type: 'AC', from: 'New Delhi', st: 'NDLS', to: 'Kolkata', tt: 'HWH', dep: ['21:30', 1], arr: ['14:10', 2], dur: 1000, price: 1890, seats: 350 },
  { op: 'Tamil Nadu Express', num: '12621', type: 'AC', from: 'New Delhi', st: 'NDLS', to: 'Chennai', tt: 'MAS', dep: ['22:30', 1], arr: ['07:10', 3], dur: 1900, price: 2650, seats: 280 },
  { op: 'Bangalore Rajdhani', num: '22691', type: 'AC', from: 'New Delhi', st: 'NDLS', to: 'Bengaluru', tt: 'SBC', dep: ['20:00', 1], arr: ['06:40', 3], dur: 2080, price: 2950, seats: 240 },
  { op: 'Mumbai CSMT Howrah Mail', num: '12809', type: 'AC', from: 'Mumbai', st: 'CSMT', to: 'Kolkata', tt: 'HWH', dep: ['20:35', 2], arr: ['06:30', 4], dur: 2155, price: 2050, seats: 300 },
  { op: 'Kerala Express', num: '12625', type: 'AC', from: 'New Delhi', st: 'NDLS', to: 'Kochi', tt: 'ERS', dep: ['11:25', 2], arr: ['05:15', 4], dur: 2570, price: 3150, seats: 220 },
  { op: 'Shatabdi Express', num: '12002', type: 'AC', from: 'New Delhi', st: 'NDLS', to: 'Bhopal', tt: 'HBJ', dep: ['06:00', 1], arr: ['14:00', 1], dur: 480, price: 1250, seats: 400 },
  { op: 'Goa Express', num: '12779', type: 'Sleeper', from: 'New Delhi', st: 'NDLS', to: 'Goa', tt: 'MAO', dep: ['15:25', 2], arr: ['14:45', 4], dur: 3320, price: 1750, seats: 360 }
].map((t) => ({
  operatorName: t.op,
  trainNumber: t.num,
  type: t.type,
  from: t.from,
  to: t.to,
  departure: { city: t.from, station: t.st, time: t.dep[0], date: dayOffset(t.dep[1]) },
  arrival: { city: t.to, station: t.tt, time: t.arr[0], date: dayOffset(t.arr[1]) },
  durationMinutes: t.dur,
  price: t.price,
  seats: t.seats,
  seatsAvailable: t.seats,
  amenities: ['Meals Included', 'Pantry Car', 'Blanket', 'Charging Point'],
  isActive: true,
  createdAt: now(),
  updatedAt: now(),
  isDeleted: false
}))

// ── Cabs ── stored shape = what firebaseCabController reads:
//    from, to, type, available, price, estimatedTime, isActive, capacity,
//    driver, vehicleNumber, rating.
const CABS = [
  { from: 'Indira Gandhi Intl. Airport (DEL)', to: 'Connaught Place, New Delhi', type: 'Hatchback', price: 420, etime: '35 min' },
  { from: 'Indira Gandhi Intl. Airport (DEL)', to: 'Gurugram', type: 'Sedan', price: 680, etime: '45 min' },
  { from: 'Indira Gandhi Intl. Airport (DEL)', to: 'Noida', type: 'SUV', price: 950, etime: '55 min' },
  { from: 'Chhatrapati Shivaji Intl. Airport (BOM)', to: 'Bandra', type: 'Sedan', price: 520, etime: '30 min' },
  { from: 'Chhatrapati Shivaji Intl. Airport (BOM)', to: 'Andheri', type: 'Hatchback', price: 380, etime: '25 min' },
  { from: 'New Delhi Railway Station', to: 'Indira Gandhi Intl. Airport (DEL)', type: 'Sedan', price: 550, etime: '40 min' },
  { from: 'Bengaluru Airport (BLR)', to: 'Whitefield', type: 'SUV', price: 1100, etime: '70 min' },
  { from: 'Bengaluru Airport (BLR)', to: 'MG Road', type: 'Sedan', price: 780, etime: '50 min' },
  { from: 'Hyderabad Airport (HYD)', to: 'HITEC City', type: 'Sedan', price: 640, etime: '40 min' },
  { from: 'Chennai Airport (MAA)', to: 'T. Nagar', type: 'Hatchback', price: 460, etime: '30 min' }
].map((c, i) => ({
  from: c.from,
  to: c.to,
  type: c.type,
  price: c.price,
  perKmRate: Math.round(c.price / 20),
  capacity: c.type === 'SUV' ? 6 : 4,
  // Search filters on `available === true` (boolean flag), not a count.
  available: true,
  estimatedTime: c.etime,
  driver: `Driver ${i + 1}`,
  vehicleNumber: `DL 0${(i + 1)} CA 000${i + 1}`,
  phone: `+91 98000 0000${i + 1}`,
  rating: 4.5 + (i % 3) * 0.1,
  image: '',
  isActive: true,
  createdAt: now(),
  updatedAt: now(),
  isDeleted: false
}))

const clearCollection = async (name) => {
  const snap = await db.collection(name).get()
  if (snap.empty) return 0
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  return snap.size
}

const seedCollection = async (name, docs, uniqueField) => {
  let created = 0
  let skipped = 0
  for (const doc of docs) {
    // De-duplicate on the natural key so re-running the seed is idempotent.
    if (uniqueField) {
      const existing = await db.collection(name).where(uniqueField, '==', doc[uniqueField]).limit(1).get()
      if (!existing.empty) {
        skipped++
        continue
      }
    }
    await db.collection(name).add(doc)
    created++
  }
  return { created, skipped }
}

const parseArgs = () => {
  const args = { clear: false, only: null }
  for (const a of process.argv.slice(2)) {
    if (a === '--clear') args.clear = true
    else if (a.startsWith('--only=')) args.only = a.slice(7).split(',').map((s) => s.trim())
  }
  return args
}

const main = async () => {
  // --clear bulk-deletes entire Firestore collections; never let it run on prod.
  assertNotProduction('This seed script inserts and can delete inventory (flights/trains/cabs).')

  banner('FIRESTORE INVENTORY SEED (flights / trains / cabs)')

  const { clear, only } = parseArgs()
  const want = (name) => !only || only.includes(name)

  const plan = [
    { name: 'flights', docs: FLIGHTS, unique: 'flightNumber' },
    { name: 'trains', docs: TRAINS, unique: 'trainNumber' },
    { name: 'cabs', docs: CABS, unique: null }
  ].filter((p) => want(p.name))

  if (clear) {
    console.log('\n--clear: wiping target collections...')
    for (const p of plan) {
      if (COLLECT_CLEAR.has(p.name)) {
        const n = await clearCollection(p.name)
        console.log(`  • ${p.name}: deleted ${n} docs`)
      }
    }
  }

  console.log('\nSeeding (idempotent on natural key)...')
  for (const p of plan) {
    const { created, skipped } = await seedCollection(p.name, p.docs, p.unique)
    console.log(`  • ${p.name}: +${created} created, ${skipped} already existed`)
  }

  // Verify by reading back through the same shape the search controllers use.
  console.log('\nVerifying counts (active, non-deleted)...')
  for (const p of plan) {
    const snap = await db.collection(p.name).get()
    const active = snap.docs.filter((d) => d.data().isActive !== false && !d.data().isDeleted).length
    console.log(`  • ${p.name}: ${active} active of ${snap.size} total`)
  }

  banner('✅ SEED COMPLETE')
  console.log('  Run a search to confirm, e.g.:')
  console.log('    curl "http://localhost:5000/api/flights?from=Delhi&to=Mumbai"')
  console.log('    curl "http://localhost:5000/api/trains?from=Delhi&to=Mumbai"')
  console.log('    curl "http://localhost:5000/api/cabs?from=Delhi&to=Gurugram"')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
