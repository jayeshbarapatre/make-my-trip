import 'dotenv/config'
// Uses the shared Firebase bootstrap rather than initialising its own. The
// hand-rolled version here `require`d serviceAccountKey.json unconditionally,
// so `npm run seed` crashed outright on any deployment configured through
// FIREBASE_* environment variables instead of a key file.
import { db } from '../src/config/firebase.js'
import assertNotProduction from './lib/prodGuard.js'

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
  // No logo asset is bundled: airline marks are trademarks we do not have a licence to
  // redistribute, and the UI renders the airline code badge instead.
  { name: 'IndiGo',           code: '6E', logo: null },
  { name: 'Air India',        code: 'AI', logo: null },
  { name: 'SpiceJet',         code: 'SG', logo: null },
  { name: 'Vistara',          code: 'UK', logo: null },
  { name: 'Akasa Air',        code: 'QP', logo: null },
  { name: 'Air India Express',code: 'IX', logo: null },
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
  // Daily departures across the booking horizon. Flights are date-specific
  // inventory (not a recurring daily service like buses), so the search filters
  // by calendar day: if a route has no departure on the requested date it
  // returns nothing. Real airlines fly a route every day, so we seed one flight
  // per route per day, cycling airlines and time-of-day slots so a given date
  // offers several options at different times and price points.
  const HORIZON_DAYS = 14
  for (let day = 0; day < HORIZON_DAYS; day++) {
    // 3 departures per route per day: morning, afternoon, evening.
    timeSlots.slice(0, 6).filter((_, i) => i % 2 === 0).forEach((slot, slotIdx) => {
      const airline = airlines[(day + slotIdx) % airlines.length]
      const depDate = d(day)
      const departure = toISO(depDate, slot)
      const arrival = addMin(departure, dur)

      // Price variance ±20%
      const variance = 1 + (Math.random() * 0.4 - 0.2)
      const price = Math.round((base * variance) / 100) * 100

      const stops = slotIdx === 2 ? 1 : 0  // the evening departure has a stop

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
        refundable: slotIdx % 3 !== 0,
        createdAt: new Date().toISOString(),
      })
    })
  }
})

// ─── Hotels ──────────────────────────────────────────────────────────────────

// Each hotel carries roomsAvailable because the search filter
// (firebaseHotelController) requires it: a hotel without the field scores 0 and
// is dropped from every results page even though it exists in Firestore.
const hotelAvailability = (stars) => (stars >= 5 ? 25 : 40)

const hotels = [
  { name: 'The Oberoi New Delhi',      city: 'Delhi',     stars: 5, pricePerNight: 18000, rating: 4.8, reviews: 2341, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Parking','Airport Shuttle'], address: 'Dr. Zakir Hussain Marg, New Delhi', images: [] },
  { name: 'Taj Mahal Palace',          city: 'Mumbai',    stars: 5, pricePerNight: 22000, rating: 4.9, reviews: 4120, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Parking','Airport Shuttle'], address: 'Apollo Bunder, Colaba, Mumbai', images: [] },
  { name: 'ITC Windsor',               city: 'Bangalore', stars: 5, pricePerNight: 14000, rating: 4.7, reviews: 1893, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Parking'], address: '25 Windsor Square, Bengaluru', images: [] },
  { name: 'Leela Palace Chennai',      city: 'Chennai',   stars: 5, pricePerNight: 15000, rating: 4.8, reviews: 1560, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Parking','Airport Shuttle'], address: 'Adyar Seaface, MRC Nagar, Chennai', images: [] },
  { name: 'Taj Bengal',                city: 'Kolkata',   stars: 5, pricePerNight: 12000, rating: 4.7, reviews: 2100, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Parking'], address: '34B Belvedere Road, Alipore, Kolkata', images: [] },
  { name: 'Park Hyatt Hyderabad',      city: 'Hyderabad', stars: 5, pricePerNight: 13000, rating: 4.6, reviews: 1780, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Parking','Airport Shuttle'], address: 'Road No 2, Banjara Hills, Hyderabad', images: [] },
  { name: 'W Goa',                     city: 'Goa',       stars: 5, pricePerNight: 20000, rating: 4.9, reviews: 3100, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Beach Access','Parking'], address: 'Vagator Beach, North Goa', images: [] },
  { name: 'Rambagh Palace Jaipur',     city: 'Jaipur',    stars: 5, pricePerNight: 25000, rating: 4.9, reviews: 2900, roomsAvailable: hotelAvailability(5), amenities: ['Free WiFi','Pool','Spa','Gym','Restaurant','Bar','Parking'], address: 'Bhawani Singh Road, Jaipur', images: [] },
  { name: 'Radisson Blu Delhi',        city: 'Delhi',     stars: 4, pricePerNight: 6500,  rating: 4.3, reviews: 5620, roomsAvailable: hotelAvailability(4), amenities: ['Free WiFi','Pool','Gym','Restaurant','Parking','Airport Shuttle'], address: 'Plot No 8, Sector 13, Dwarka, New Delhi', images: [] },
  { name: 'Novotel Mumbai',            city: 'Mumbai',    stars: 4, pricePerNight: 7200,  rating: 4.4, reviews: 4200, roomsAvailable: hotelAvailability(4), amenities: ['Free WiFi','Pool','Gym','Restaurant','Bar','Parking'], address: 'Saki Vihar Road, Andheri East, Mumbai', images: [] },
  { name: 'Marriott Bangalore',        city: 'Bangalore', stars: 4, pricePerNight: 8000,  rating: 4.5, reviews: 3780, roomsAvailable: hotelAvailability(4), amenities: ['Free WiFi','Pool','Gym','Restaurant','Bar','Parking'], address: 'Outer Ring Road, Whitefield, Bengaluru', images: [] },
  { name: 'OYO Townhouse Pune',        city: 'Pune',      stars: 3, pricePerNight: 2200,  rating: 4.1, reviews: 8100, roomsAvailable: hotelAvailability(3), amenities: ['Free WiFi','Restaurant','Parking'], address: 'Baner Road, Pune', images: [] },
  { name: 'Ibis Styles Goa',           city: 'Goa',       stars: 3, pricePerNight: 4500,  rating: 4.2, reviews: 6400, roomsAvailable: hotelAvailability(3), amenities: ['Free WiFi','Pool','Restaurant','Parking','Bar'], address: 'Candolim, North Goa', images: [] },
  { name: 'FabHotel Jaipur Central',   city: 'Jaipur',    stars: 3, pricePerNight: 1800,  rating: 3.9, reviews: 3200, roomsAvailable: hotelAvailability(3), amenities: ['Free WiFi','Restaurant','Parking'], address: 'MI Road, Jaipur', images: [] },
  { name: 'Lemon Tree Chennai',        city: 'Chennai',   stars: 4, pricePerNight: 5500,  rating: 4.3, reviews: 2900, roomsAvailable: hotelAvailability(4), amenities: ['Free WiFi','Pool','Gym','Restaurant','Bar','Parking'], address: 'Sadras Road, Kalaignar Karunanidhi Nagar, Chennai', images: [] },
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
  // clearCollection() wipes flights and hotels wholesale.
  assertNotProduction('This seed deletes and replaces all flights and hotels.')

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
