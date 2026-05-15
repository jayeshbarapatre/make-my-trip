import 'dotenv/config'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { resolve } from 'path'

const require = createRequire(import.meta.url)
const serviceAccount = require(resolve(process.cwd(), 'serviceAccountKey.json'))

if (!getApps().length) initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ─── Helpers ────────────────────────────────────────────────────────────────

const toISO = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00+05:30`).toISOString()

const today = new Date()
const d = (offsetDays) => {
  const dt = new Date(today)
  dt.setDate(dt.getDate() + offsetDays)
  return dt.toISOString().slice(0, 10)
}

// duration in minutes → arrival ISO
const addMin = (isoStr, minutes) =>
  new Date(new Date(isoStr).getTime() + minutes * 60000).toISOString()

// ─── Flight Data ─────────────────────────────────────────────────────────────

const airlines = [
  { name: 'IndiGo',           code: '6E', logo: 'https://logos.makemytrip.com/airline-logos/6E.png' },
  { name: 'Air India',        code: 'AI', logo: 'https://logos.makemytrip.com/airline-logos/AI.png' },
  { name: 'SpiceJet',         code: 'SG', logo: 'https://logos.makemytrip.com/airline-logos/SG.png' },
  { name: 'Vistara',          code: 'UK', logo: 'https://logos.makemytrip.com/airline-logos/UK.png' },
  { name: 'Akasa Air',        code: 'QP', logo: 'https://logos.makemytrip.com/airline-logos/QP.png' },
  { name: 'Air India Express',code: 'IX', logo: 'https://logos.makemytrip.com/airline-logos/IX.png' },
]

// [source, destination, durationMin, basePrice]
const routes = [
  ['Delhi',     'Mumbai',      125, 3800],
  ['Mumbai',    'Delhi',       125, 4100],
  ['Delhi',     'Bangalore',   165, 4500],
  ['Bangalore', 'Delhi',       165, 4700],
  ['Mumbai',    'Bangalore',    95, 2900],
  ['Bangalore', 'Mumbai',       95, 3100],
  ['Delhi',     'Chennai',     175, 5000],
  ['Chennai',   'Delhi',       175, 5200],
  ['Delhi',     'Kolkata',     145, 4200],
  ['Kolkata',   'Delhi',       145, 4400],
  ['Mumbai',    'Hyderabad',    90, 2600],
  ['Hyderabad', 'Mumbai',       90, 2800],
  ['Bangalore', 'Hyderabad',    65, 1800],
  ['Hyderabad', 'Bangalore',    65, 1900],
  ['Delhi',     'Goa',         150, 5500],
  ['Goa',       'Delhi',       150, 5800],
  ['Mumbai',    'Goa',          65, 2200],
  ['Goa',       'Mumbai',       65, 2400],
  ['Delhi',     'Jaipur',       60, 1500],
  ['Jaipur',    'Delhi',        60, 1600],
  ['Mumbai',    'Pune',         45, 1200],
  ['Chennai',   'Bangalore',    55, 1700],
  ['Bangalore', 'Chennai',      55, 1800],
  ['Kolkata',   'Mumbai',      185, 5600],
  ['Delhi',     'Hyderabad',   155, 4800],
]

// Morning / afternoon / evening / night slots
const timeSlots = ['05:30', '06:15', '07:00', '08:45', '10:20', '12:00', '13:40', '15:10', '17:30', '19:00', '20:45', '22:30']

const flights = []
let flightCounter = 1000

routes.forEach(([src, dst, dur, base]) => {
  // 4 flights per route across today and next 7 days spread over time slots
  timeSlots.slice(0, 6).forEach((slot, idx) => {
    const airline = airlines[idx % airlines.length]
    const offsetDay = idx % 4           // spread across 4 days
    const depDate = d(offsetDay)
    const departure = toISO(depDate, slot)
    const arrival = addMin(departure, dur)

    // Price variance ±20%
    const variance = 1 + (Math.random() * 0.4 - 0.2)
    const price = Math.round((base * variance) / 100) * 100

    const stops = idx % 5 === 4 ? 1 : 0  // one in five has a stop

    flights.push({
      airline: airline.name,
      airlineCode: airline.code,
      airlineLogo: airline.logo,
      flightNumber: `${airline.code}${flightCounter++}`,
      source: src,
      destination: dst,
      departure,
      arrival,
      duration: dur,
      price,
      seats: 60 + Math.floor(Math.random() * 100),
      stops,
      class: 'Economy',
      baggage: '15 kg check-in + 7 kg cabin',
      refundable: idx % 3 !== 0,
      createdAt: new Date().toISOString(),
    })
  })
})

// ─── Hotels ──────────────────────────────────────────────────────────────────

const hotels = [
  { name: 'The Oberoi New Delhi',      city: 'Delhi',     stars: 5, pricePerNight: 18000, rating: 4.8, reviews: 2341 },
  { name: 'Taj Mahal Palace',          city: 'Mumbai',    stars: 5, pricePerNight: 22000, rating: 4.9, reviews: 4120 },
  { name: 'ITC Windsor',               city: 'Bangalore', stars: 5, pricePerNight: 14000, rating: 4.7, reviews: 1893 },
  { name: 'Leela Palace Chennai',      city: 'Chennai',   stars: 5, pricePerNight: 15000, rating: 4.8, reviews: 1560 },
  { name: 'Taj Bengal',                city: 'Kolkata',   stars: 5, pricePerNight: 12000, rating: 4.7, reviews: 2100 },
  { name: 'Park Hyatt Hyderabad',      city: 'Hyderabad', stars: 5, pricePerNight: 13000, rating: 4.6, reviews: 1780 },
  { name: 'W Goa',                     city: 'Goa',       stars: 5, pricePerNight: 20000, rating: 4.9, reviews: 3100 },
  { name: 'Rambagh Palace Jaipur',     city: 'Jaipur',    stars: 5, pricePerNight: 25000, rating: 4.9, reviews: 2900 },
  { name: 'Radisson Blu Delhi',        city: 'Delhi',     stars: 4, pricePerNight: 6500,  rating: 4.3, reviews: 5620 },
  { name: 'Novotel Mumbai',            city: 'Mumbai',    stars: 4, pricePerNight: 7200,  rating: 4.4, reviews: 4200 },
  { name: 'Marriott Bangalore',        city: 'Bangalore', stars: 4, pricePerNight: 8000,  rating: 4.5, reviews: 3780 },
  { name: 'OYO Townhouse Pune',        city: 'Pune',      stars: 3, pricePerNight: 2200,  rating: 4.1, reviews: 8100 },
  { name: 'Ibis Styles Goa',           city: 'Goa',       stars: 3, pricePerNight: 4500,  rating: 4.2, reviews: 6400 },
  { name: 'FabHotel Jaipur Central',   city: 'Jaipur',    stars: 3, pricePerNight: 1800,  rating: 3.9, reviews: 3200 },
  { name: 'Lemon Tree Chennai',        city: 'Chennai',   stars: 4, pricePerNight: 5500,  rating: 4.3, reviews: 2900 },
]

// ─── Seed Functions ──────────────────────────────────────────────────────────

async function clearCollection(name) {
  const snap = await db.collection(name).get()
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  console.log(`  Cleared ${snap.size} existing ${name}`)
}

async function seedFlights() {
  console.log('\n Seeding flights...')
  await clearCollection('flights')
  const batch = db.batch()
  flights.forEach((f) => {
    const ref = db.collection('flights').doc()
    batch.set(ref, f)
  })
  await batch.commit()
  console.log(`  Added ${flights.length} flights`)
}

async function seedHotels() {
  console.log('\n Seeding hotels...')
  await clearCollection('hotels')
  const batch = db.batch()
  hotels.forEach((h) => {
    const ref = db.collection('hotels').doc()
    batch.set(ref, { ...h, createdAt: new Date().toISOString() })
  })
  await batch.commit()
  console.log(`  Added ${hotels.length} hotels`)
}

async function main() {
  console.log('Starting seed...')
  await seedFlights()
  await seedHotels()
  console.log('\nDone! Firestore seeded successfully.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
