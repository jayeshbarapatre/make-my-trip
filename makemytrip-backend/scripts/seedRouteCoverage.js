/**
 * Guarantees inventory on every route the frontend city picker can produce.
 *
 * WHY: with the city-alias fix in place, the remaining empty result pages are
 * genuine coverage holes — a customer picks Bengaluru → Chennai from the
 * dropdown and there is simply no train on that route. Rather than seeding more
 * random data, this walks the demand matrix the UI actually exposes and creates
 * only what is missing.
 *
 * Every document is written with the denormalised canonical route fields, so it
 * is reachable by the indexed search the moment it lands.
 *
 * Idempotent: doc ids are deterministic per (route, vertical, variant), so
 * re-running tops up gaps without duplicating anything.
 *
 * Run from makemytrip-backend:
 *   npm run seed:coverage            # report what is missing
 *   npm run seed:coverage -- --apply # create it
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { canonicalCity } from '../src/utils/cities.js'
import { routeIndexFields } from '../src/services/inventorySearch.js'
import { now } from '../src/utils/time.js'
import assertNotProduction from './lib/prodGuard.js'

const banner = (t) => console.log('\n' + '='.repeat(64) + '\n' + t + '\n' + '='.repeat(64))

/**
 * The routes the UI can actually produce, with real road/rail distances.
 * `air` marks pairs far enough apart that a flight is plausible; short hops
 * get surface transport only, which is what a real inventory looks like.
 */
const ROUTES = [
  { a: 'New Delhi', b: 'Mumbai', km: 1400, air: true },
  { a: 'New Delhi', b: 'Bengaluru', km: 2150, air: true },
  { a: 'New Delhi', b: 'Chennai', km: 2180, air: true },
  { a: 'New Delhi', b: 'Kolkata', km: 1500, air: true },
  { a: 'New Delhi', b: 'Goa', km: 1900, air: true },
  { a: 'New Delhi', b: 'Hyderabad', km: 1580, air: true },
  { a: 'New Delhi', b: 'Jaipur', km: 280, air: false },
  { a: 'New Delhi', b: 'Agra', km: 233, air: false },
  { a: 'New Delhi', b: 'Chandigarh', km: 245, air: false },
  { a: 'New Delhi', b: 'Lucknow', km: 555, air: true },
  { a: 'New Delhi', b: 'Varanasi', km: 820, air: true },
  { a: 'New Delhi', b: 'Dehradun', km: 250, air: false },
  { a: 'Mumbai', b: 'Bengaluru', km: 985, air: true },
  { a: 'Mumbai', b: 'Pune', km: 150, air: false },
  { a: 'Mumbai', b: 'Goa', km: 590, air: true },
  { a: 'Mumbai', b: 'Ahmedabad', km: 525, air: true },
  { a: 'Mumbai', b: 'Hyderabad', km: 710, air: true },
  { a: 'Mumbai', b: 'Chennai', km: 1330, air: true },
  { a: 'Bengaluru', b: 'Chennai', km: 350, air: true },
  { a: 'Bengaluru', b: 'Hyderabad', km: 570, air: true },
  { a: 'Bengaluru', b: 'Goa', km: 560, air: true },
  { a: 'Bengaluru', b: 'Kochi', km: 545, air: true },
  { a: 'Chennai', b: 'Hyderabad', km: 625, air: true },
  { a: 'Chennai', b: 'Kochi', km: 690, air: true },
  { a: 'Kolkata', b: 'Bhubaneswar', km: 440, air: true },
  { a: 'Kolkata', b: 'Varanasi', km: 680, air: true },
  { a: 'Jaipur', b: 'Udaipur', km: 395, air: false },
  { a: 'Jaipur', b: 'Jodhpur', km: 335, air: false },
  { a: 'Ahmedabad', b: 'Surat', km: 265, air: false },
  { a: 'Ahmedabad', b: 'Vadodara', km: 110, air: false },
  { a: 'Pune', b: 'Goa', km: 440, air: false },
  { a: 'Lucknow', b: 'Varanasi', km: 320, air: false },
  { a: 'Chandigarh', b: 'Shimla', km: 115, air: false },
  { a: 'Kochi', b: 'Thiruvananthapuram', km: 200, air: false },
  { a: 'Indore', b: 'Bhopal', km: 195, air: false },
  { a: 'Hyderabad', b: 'Visakhapatnam', km: 620, air: true }
]

/** Minimum options a route must offer before the page looks credible. */
const TARGET = { flights: 4, trains: 4, buses: 5, cabs: 4, hotels: 8 }

const slug = (s) => canonicalCity(s).replace(/[^a-z0-9]+/g, '-')
const pick = (arr, i) => arr[i % arr.length]
const hhmm = (mins) => `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

const AIRLINES = [
  { name: 'IndiGo', code: '6E' }, { name: 'Air India', code: 'AI' },
  { name: 'Vistara', code: 'UK' }, { name: 'SpiceJet', code: 'SG' },
  { name: 'Akasa Air', code: 'QP' }
]
const TRAIN_NAMES = ['Rajdhani Express', 'Shatabdi Express', 'Duronto Express', 'Vande Bharat Express', 'Garib Rath', 'Superfast Express']
const TRAIN_CLASSES = ['1A, 2A, 3A', '2A, 3A, SL', '3A, SL', 'CC, EC']
const BUS_OPERATORS = ['VRL Travels', 'SRS Travels', 'Orange Travels', 'IntrCity SmartBus', 'Neeta Travels', 'KPN Travels']
const BUS_TYPES = [
  { name: 'AC Sleeper (2+1)', mult: 1.0 },
  { name: 'Volvo Multi-Axle A/C Seater', mult: 0.9 },
  { name: 'AC Semi Sleeper (2+2)', mult: 0.85 },
  { name: 'Non-AC Sleeper (2+1)', mult: 0.7 },
  { name: 'Non-AC Seater (3+2)', mult: 0.55 }
]
const CAB_TYPES = [
  { type: 'Hatchback', hire: 350, perKm: 10, capacity: 4 },
  { type: 'Sedan', hire: 450, perKm: 12, capacity: 4 },
  { type: 'SUV', hire: 700, perKm: 15, capacity: 6 },
  { type: 'Premium SUV', hire: 1000, perKm: 19, capacity: 7 }
]
const HOTEL_BRANDS = [
  { name: 'Taj', stars: 5, base: 14000 }, { name: 'ITC', stars: 5, base: 12000 },
  { name: 'Marriott', stars: 5, base: 11000 }, { name: 'Novotel', stars: 4, base: 7000 },
  { name: 'Lemon Tree', stars: 4, base: 5500 }, { name: 'Radisson Blu', stars: 4, base: 6500 },
  { name: 'Ibis', stars: 3, base: 4000 }, { name: 'FabHotel', stars: 3, base: 2200 },
  { name: 'Treebo', stars: 3, base: 2500 }, { name: 'OYO Townhouse', stars: 3, base: 1900 }
]
const AMENITIES = ['Free WiFi', 'Swimming Pool', 'Gym', 'Restaurant', 'Room Service', 'Parking', 'Spa', 'Bar', 'Airport Shuttle', 'Breakfast Included']

const build = {
  flights: (from, to, km, i) => {
    const al = pick(AIRLINES, i)
    const durationMinutes = Math.round(km / 11) + 35
    const depMin = [345, 495, 660, 810, 1050, 1230][i % 6]
    const dep = new Date(); dep.setDate(dep.getDate() + (i % 5)); dep.setHours(Math.floor(depMin / 60), depMin % 60, 0, 0)
    const arr = new Date(dep.getTime() + durationMinutes * 60000)
    return {
      airline: al.name, airlineCode: al.code, airlineLogo: null,
      flightNumber: `${al.code}${2000 + i * 7 + (km % 97)}`,
      source: from, destination: to,
      departure: dep.toISOString(), arrival: arr.toISOString(),
      duration: durationMinutes, durationMinutes,
      price: Math.round((km * 3.1 + 1200) / 100) * 100,
      seats: 120, seatsAvailable: 60 + (i * 13) % 60,
      stops: i % 4 === 3 ? 1 : 0,
      class: 'Economy', cabinClass: 'Economy',
      baggage: '15 kg check-in + 7 kg cabin',
      refundable: i % 3 !== 0
    }
  },
  trains: (from, to, km, i) => {
    const durationMinutes = Math.round(km / 0.9) + 45
    const depMin = [360, 555, 900, 1140, 1320][i % 5]
    return {
      trainName: `${from.split(' ')[0]} ${pick(TRAIN_NAMES, i)}`,
      trainNumber: String(12000 + ((km * 7 + i * 31) % 7999)),
      from, to,
      departureTime: hhmm(depMin), arrivalTime: hhmm(depMin + durationMinutes),
      duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      durationMinutes,
      price: Math.round((km * 1.35 + 250) / 10) * 10,
      seats: 400, seatsAvailable: 90 + (i * 37) % 200,
      classes: pick(TRAIN_CLASSES, i),
      runsOn: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      pantry: i % 2 === 0
    }
  },
  buses: (from, to, km, i) => {
    const type = pick(BUS_TYPES, i)
    const durationMinutes = Math.round((km / 42) * 60)
    const depMin = [360, 540, 810, 1140, 1320, 1380][i % 6]
    const op = pick(BUS_OPERATORS, i + km)
    return {
      busName: `${op} ${type.name.split(' ')[0]}`,
      operatorName: op, operator: op,
      busNumber: `${op.replace(/[^A-Z]/g, '').slice(0, 4)}-${slug(from).slice(0, 2).toUpperCase()}${slug(to).slice(0, 2).toUpperCase()}-${1000 + i}`,
      from, to,
      departureTime: hhmm(depMin), arrivalTime: hhmm(depMin + durationMinutes),
      durationMinutes, duration: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      busType: type.name, type: type.name,
      price: Math.round((km * 3.0 + 180) * type.mult / 10) * 10,
      totalSeats: 40, seatsAvailable: 12 + (i * 9) % 28,
      rating: Math.round((3.8 + (i % 5) * 0.22) * 10) / 10,
      amenities: ['Charging Point', 'Water Bottle', 'Blanket', 'Live Tracking'].slice(0, 2 + (i % 3)),
      liveTracking: true, mTicketEnabled: true
    }
  },
  cabs: (from, to, km, i) => {
    const c = pick(CAB_TYPES, i)
    const durationMinutes = Math.round((km / 50) * 60) + 20
    return {
      from, to, type: c.type,
      model: pick(['Maruti Dzire', 'Toyota Etios', 'Maruti Ertiga', 'Toyota Innova Crysta', 'Hyundai Aura'], i),
      price: Math.round((c.hire + c.perKm * km) / 10) * 10,
      capacity: c.capacity, distanceKm: km, durationMinutes,
      estimatedTime: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      tripType: 'Outstation One-Way',
      available: true, availableCount: 3 + (i % 5),
      rating: Math.round((4.1 + (i % 8) * 0.1) * 10) / 10,
      amenities: ['AC', 'Music System', 'Charging Point'],
      inclusions: ['Toll & state permit', 'Driver allowance', 'GST']
    }
  },
  hotels: (city, _to, _km, i) => {
    const brand = pick(HOTEL_BRANDS, i)
    const price = Math.round(brand.base * (0.85 + (i % 5) * 0.08) / 100) * 100
    return {
      name: `${brand.name} ${city}`,
      city, location: `${city} City Centre`,
      address: `${100 + i} Central Avenue, ${city}`,
      stars: brand.stars,
      price, pricePerNight: price,
      rating: Math.round((3.8 + (brand.stars - 3) * 0.4 + (i % 3) * 0.1) * 10) / 10,
      reviews: 400 + (i * 137) % 4000,
      rooms: 60, roomsAvailable: 8 + (i * 7) % 40,
      amenities: AMENITIES.slice(0, 4 + (i % 6)),
      checkInTime: '14:00', checkOutTime: '11:00'
    }
  }
}

const docId = (vertical, from, to, i) =>
  vertical === 'hotels'
    ? `seed_hotel_${slug(from)}_${i}`
    : `seed_${vertical}_${slug(from)}_${slug(to)}_${i}`

const main = async () => {
  const apply = process.argv.includes('--apply')
  assertNotProduction('This script writes inventory documents.')

  banner(apply ? 'ROUTE COVERAGE SEED (APPLYING)' : 'ROUTE COVERAGE SEED (DRY RUN)')

  // One read per collection, then everything is computed in memory.
  const existing = {}
  for (const col of ['flights', 'trains', 'buses', 'cabs', 'hotels']) {
    const snap = await db.collection(col).get()
    existing[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    console.log(`  loaded ${snap.size} ${col}`)
  }

  const countFor = (col, from, to) => {
    const cf = canonicalCity(from)
    const ct = canonicalCity(to)
    return existing[col].filter((d) => {
      if (col === 'hotels') return canonicalCity(d.city ?? d.location) === cf
      const a = canonicalCity(d.from ?? d.source)
      const b = canonicalCity(d.to ?? d.destination)
      return a === cf && b === ct
    }).length
  }

  const pending = []
  const cityDone = new Set()

  for (const route of ROUTES) {
    // Both directions for transport; hotels are per city.
    for (const [from, to] of [[route.a, route.b], [route.b, route.a]]) {
      for (const vertical of ['flights', 'trains', 'buses', 'cabs']) {
        if (vertical === 'flights' && !route.air) continue

        const have = countFor(vertical, from, to)
        const need = TARGET[vertical] - have
        for (let i = 0; i < need; i++) {
          const idx = have + i
          pending.push({
            col: vertical,
            id: docId(vertical, from, to, idx),
            data: build[vertical](from, to, route.km, idx)
          })
        }
      }
    }

    for (const city of [route.a, route.b]) {
      const key = canonicalCity(city)
      if (cityDone.has(key)) continue
      cityDone.add(key)

      const have = countFor('hotels', city, city)
      const need = TARGET.hotels - have
      for (let i = 0; i < need; i++) {
        const idx = have + i
        pending.push({ col: 'hotels', id: docId('hotels', city, city, idx), data: build.hotels(city, city, 0, idx) })
      }
    }
  }

  const byCol = pending.reduce((acc, p) => ({ ...acc, [p.col]: (acc[p.col] ?? 0) + 1 }), {})
  console.log(`\nRoutes in demand matrix: ${ROUTES.length} (both directions)`)
  console.log('Documents to create to reach target coverage:')
  for (const col of ['flights', 'trains', 'buses', 'cabs', 'hotels']) {
    console.log(`  ${col.padEnd(8)} +${byCol[col] ?? 0}`)
  }
  console.log(`  ${'TOTAL'.padEnd(8)} +${pending.length}`)

  if (!apply) {
    banner('DRY RUN — nothing written. Re-run with --apply.')
    return
  }

  let written = 0
  for (let i = 0; i < pending.length; i += 400) {
    const batch = db.batch()
    for (const { col, id, data } of pending.slice(i, i + 400)) {
      batch.set(db.collection(col).doc(id), {
        ...data,
        ...routeIndexFields(col, data),
        isActive: true,
        isDeleted: false,
        createdAt: now(),
        updatedAt: now()
      })
    }
    await batch.commit()
    written += Math.min(400, pending.length - i)
    console.log(`  committed ${written}/${pending.length}`)
  }

  banner('ROUTE COVERAGE SEED COMPLETE')
  console.log(`  ${written} document(s) created across ${Object.keys(byCol).length} collections.`)
  console.log('  Verify with: npm run verify:search')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Coverage seed failed:', err)
    process.exit(1)
  })
