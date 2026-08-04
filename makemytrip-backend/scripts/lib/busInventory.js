/**
 * Bus inventory generation — pure data, no Firestore.
 *
 * Split out of the seeder so the search verification suite can build the exact
 * same documents the seeder writes and assert against them without touching the
 * real datastore (which costs read quota and cannot be reset between runs).
 */

import { routeIndexFields } from '../../src/services/inventorySearch.js'
import { DATED_FLAG, DAILY_INVENTORY_FIELD } from '../../src/services/availability.js'

const fmtDuration = (m) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`

/**
 * The seven routes the Bus Results page is tested against, in both directions
 * where the test names both, plus a few extras for breadth.
 */
export const ROUTES = [
  { from: 'Chennai', to: 'Bengaluru', km: 350 },
  { from: 'Bengaluru', to: 'Chennai', km: 350 },
  { from: 'Delhi', to: 'Jaipur', km: 280 },
  { from: 'Jaipur', to: 'Delhi', km: 280 },
  { from: 'Mumbai', to: 'Pune', km: 150 },
  { from: 'Pune', to: 'Mumbai', km: 150 },
  { from: 'Hyderabad', to: 'Chennai', km: 630 },
  { from: 'Chennai', to: 'Hyderabad', km: 630 },
  { from: 'Ahmedabad', to: 'Surat', km: 265 },
  { from: 'Surat', to: 'Ahmedabad', km: 265 },
  { from: 'Hyderabad', to: 'Bengaluru', km: 570 },
  { from: 'Kolkata', to: 'Durgapur', km: 160 },
  { from: 'Lucknow', to: 'Delhi', km: 555 }
]

export const OPERATORS = [
  { name: 'VRL Travels', tier: 'standard', rating: 4.2 },
  { name: 'SRS Travels', tier: 'standard', rating: 4.0 },
  { name: 'Orange Travels', tier: 'premium', rating: 4.5 },
  { name: 'KPN Travels', tier: 'standard', rating: 3.9 },
  { name: 'IntrCity SmartBus', tier: 'premium', rating: 4.6 },
  { name: 'KSRTC Airavat', tier: 'premium', rating: 4.4 },
  { name: 'APSRTC', tier: 'budget', rating: 3.8 },
  { name: 'TSRTC', tier: 'budget', rating: 3.7 },
  { name: 'Neeta Travels', tier: 'standard', rating: 4.1 },
  { name: 'Parveen Travels', tier: 'standard', rating: 4.0 },
  { name: 'Sharma Transports', tier: 'budget', rating: 3.6 },
  { name: 'Zingbus', tier: 'premium', rating: 4.3 }
]

/**
 * Bus classes.
 *
 * `category` is the coarse bucket the results-page filter chips use
 * (AC / Non-AC / Sleeper / Luxury); `name` is the descriptive label shown on the
 * card. Both are stored, because filtering on the descriptive label is what made
 * every filter chip match zero buses.
 */
export const BUS_TYPES = [
  {
    name: 'AC Sleeper (2+1)',
    category: 'Sleeper',
    ac: true,
    berth: 'sleeper',
    fare: 1.0,
    amenities: ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Live Tracking', 'CCTV', 'Reading Light']
  },
  {
    name: 'Volvo B11R Multi-Axle Semi-Sleeper',
    category: 'Luxury',
    ac: true,
    berth: 'semi-sleeper',
    fare: 1.25,
    amenities: ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Live Tracking', 'CCTV', 'Emergency Exit', 'Movie']
  },
  {
    name: 'Scania Metrolink Luxury Sleeper',
    category: 'Luxury',
    ac: true,
    berth: 'sleeper',
    fare: 1.4,
    amenities: ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Live Tracking', 'CCTV', 'Snacks', 'Movie']
  },
  {
    name: 'AC Seater (2+2)',
    category: 'AC',
    ac: true,
    berth: 'seater',
    fare: 0.85,
    amenities: ['Charging Point', 'Water Bottle', 'CCTV']
  },
  {
    name: 'Non-AC Sleeper (2+1)',
    category: 'Non-AC',
    ac: false,
    berth: 'sleeper',
    fare: 0.7,
    amenities: ['Charging Point', 'Blanket', 'Water Bottle']
  },
  {
    name: 'Non-AC Seater (3+2)',
    category: 'Non-AC',
    ac: false,
    berth: 'seater',
    fare: 0.55,
    amenities: ['Water Bottle']
  }
]

const CANCELLATION_POLICIES = [
  'Free cancellation up to 24 hours before departure. 50% refund between 24-12 hrs. No refund within 12 hrs.',
  'Cancellation charge of ₹150 or 10% of fare (whichever is higher) up to 12 hrs before departure. No refund after.',
  'Fully refundable if cancelled 48 hours before departure. 25% refund thereafter.'
]

// Departure slots spread across morning / afternoon / evening / night so the
// departure-window filter has something to bite on in every bucket.
const TIME_SLOTS = [
  '05:45', '07:00', '08:30', '10:15', '11:45', '13:30',
  '15:00', '16:45', '18:30', '20:00', '21:15', '22:30', '23:45', '00:30'
]

const POINTS = {
  Chennai: ['Koyambedu CMBT', 'Tambaram', 'Guindy', 'Madhavaram'],
  Bengaluru: ['Majestic (Kempegowda)', 'Electronic City', 'Silk Board', 'Madiwala'],
  Mumbai: ['Borivali', 'Andheri East', 'Dadar TT', 'Sion'],
  Pune: ['Swargate', 'Shivaji Nagar', 'Pimpri', 'Wakad'],
  Delhi: ['Kashmere Gate ISBT', 'Anand Vihar', 'Sarai Kale Khan', 'Dhaula Kuan'],
  Jaipur: ['Sindhi Camp', '200 Feet Bypass', 'Jaipur Junction', 'Durgapura'],
  Hyderabad: ['Miyapur', 'KPHB Colony', 'Lakdi-ka-Pul', 'LB Nagar'],
  Ahmedabad: ['Paldi', 'Geeta Mandir', 'Naroda', 'Sarkhej'],
  Surat: ['Surat Railway Station', 'Puna Gam', 'Parle Point', 'Kamrej'],
  Kolkata: ['Esplanade', 'Howrah', 'Garia', 'Salt Lake'],
  Durgapur: ['Durgapur City Centre', 'Muchipara', 'Cement More'],
  Lucknow: ['Alambagh', 'Kaisarbagh', 'Charbagh', 'Polytechnic']
}

const pointsFor = (city) => POINTS[city] ?? [`${city} Central Bus Stand`]
const pick = (arr, i) => arr[i % arr.length]

/** Slug safe for a Firestore document id. */
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/**
 * Builds `count` buses for one route, varying operator, class and departure time
 * so that sorting and every filter chip have real spread to work with.
 *
 * @returns {{id: string, data: object}[]}
 */
export const buildBusesForRoute = (route, count = 15, timestamp = new Date().toISOString()) => {
  const buses = []
  const boarding = pointsFor(route.from)
  const dropping = pointsFor(route.to)

  for (let i = 0; i < count; i++) {
    // Offset per route so routes do not all lead with the same operator.
    const op = pick(OPERATORS, i + route.from.length)
    const type = pick(BUS_TYPES, i + (route.km % 3))
    const dep = pick(TIME_SLOTS, i * 3 + (route.from.length % 4))

    // Road speed varies by class: multi-axle coaches run faster than a stopping
    // non-AC seater.
    const kmph = type.category === 'Luxury' ? 52 : type.ac ? 45 : 38
    const travelMin = Math.round((route.km / kmph) * 60) + (i % 4) * 15

    const [dh, dm] = dep.split(':').map(Number)
    const arrTotal = dh * 60 + dm + travelMin
    const arr = `${String(Math.floor((arrTotal / 60) % 24)).padStart(2, '0')}:${String(arrTotal % 60).padStart(2, '0')}`

    const tierMult = op.tier === 'premium' ? 1.15 : op.tier === 'budget' ? 0.85 : 1
    const price = Math.round(((route.km * 3.1 + 180) * type.fare * tierMult) / 10) * 10

    const totalSeats = type.berth === 'sleeper' ? [30, 36, 40][i % 3] : [40, 44, 50][i % 3]
    // Vary remaining seats so the availability filter is meaningful, but never
    // leave a bus at zero — every seeded bus must be bookable.
    const seatsAvailable = Math.max(4, totalSeats - ((i * 7) % (totalSeats - 4)))

    const opCode = op.name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4)
    const routeCode = `${route.from.slice(0, 3).toUpperCase()}${route.to.slice(0, 3).toUpperCase()}`
    const busNumber = `${opCode}-${routeCode}-${1000 + i}`

    const base = {
      busName: `${op.name} ${type.name}`,
      operatorName: op.name,
      operator: op.name,
      operatorTier: op.tier,
      busNumber,
      from: route.from,
      to: route.to,
      source: route.from,
      destination: route.to,
      distanceKm: route.km,

      busType: type.name,
      // Coarse bucket for the results-page filter chips.
      type: type.category,
      category: type.category,
      isAc: type.ac,
      berthType: type.berth,

      departureTime: dep,
      arrivalTime: arr,
      arrivesNextDay: arrTotal >= 24 * 60,
      durationMinutes: travelMin,
      duration: fmtDuration(travelMin),

      price,
      totalSeats,
      seatsAvailable,
      // Buses sell per travel date; capacity comes from here, not the scalar.
      [DAILY_INVENTORY_FIELD]: { total: totalSeats },
      [DATED_FLAG]: true,

      rating: Math.round((op.rating + ((i % 3) - 1) * 0.1) * 10) / 10,
      totalReviews: 120 + ((i * 37) % 900),
      amenities: type.amenities,
      boardingPoints: boarding.slice(0, 3).map((p, idx) => ({
        name: p,
        time: dep,
        contact: `+91 90000 100${idx}`
      })),
      droppingPoints: dropping.slice(0, 3).map((p) => ({ name: p, contact: '+91 90000 2000' })),
      cancellationPolicy: pick(CANCELLATION_POLICIES, i),
      liveTracking: type.amenities.includes('Live Tracking'),
      mTicketEnabled: true,

      isActive: true,
      isDeleted: false,
      createdAt: timestamp,
      updatedAt: timestamp
    }

    buses.push({
      // Deterministic id keeps the seed idempotent without a read per document.
      id: `seed-${slug(route.from)}-${slug(route.to)}-${slug(busNumber)}`,
      // The whole point of the fix: seeded inventory carries the same route
      // index fields the admin and vendor create paths write.
      data: { ...base, ...routeIndexFields('buses', base) }
    })
  }

  return buses
}

/** Every bus across every route. */
export const buildAllBuses = (perRoute = 15, timestamp) =>
  ROUTES.flatMap((route) => buildBusesForRoute(route, perRoute, timestamp))

export default { ROUTES, OPERATORS, BUS_TYPES, buildBusesForRoute, buildAllBuses }
