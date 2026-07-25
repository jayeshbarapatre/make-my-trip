import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

// Time slots for flights
const timeSlots = ['05:30', '06:15', '07:00', '08:45', '10:20', '12:00', '13:40', '15:10', '17:30', '19:00', '20:45', '22:30']

const flights = []
let flightCounter = 1000

routes.forEach(([src, dst, dur, base]) => {
  timeSlots.slice(0, 6).forEach((slot, idx) => {
    const airline = airlines[idx % airlines.length]
    const offsetDay = idx % 4
    const depDate = d(offsetDay)
    const departure = toISO(depDate, slot)
    const arrival = addMin(departure, dur)

    const variance = 1 + (Math.random() * 0.4 - 0.2)
    const price = Math.round((base * variance) / 100) * 100

    const stops = idx % 5 === 4 ? 1 : 0

    flights.push({
      airline: airline.name,
      airlineCode: airline.code,
      airlineLogo: airline.logo,
      flightNumber: `${airline.code}${flightCounter++}`,
      from: src,
      to: dst,
      departureTime: departure,
      arrivalTime: arrival,
      durationMinutes: dur,
      price: parseFloat(price),
      seatsAvailable: 60 + Math.floor(Math.random() * 100),
      stops,
      class: 'Economy',
      baggage: '15 kg check-in + 7 kg cabin',
      refundable: idx % 3 !== 0,
    })
  })
})

// ─── Hotels ──────────────────────────────────────────────────────────────────

const hotels = [
  { name: 'The Oberoi New Delhi',      city: 'Delhi',     stars: 5, pricePerNight: 18000, rating: 4.8, reviews: 2341, roomsAvailable: 50 },
  { name: 'Taj Mahal Palace',          city: 'Mumbai',    stars: 5, pricePerNight: 22000, rating: 4.9, reviews: 4120, roomsAvailable: 45 },
  { name: 'ITC Windsor',               city: 'Bangalore', stars: 5, pricePerNight: 14000, rating: 4.7, reviews: 1893, roomsAvailable: 40 },
  { name: 'Leela Palace Chennai',      city: 'Chennai',   stars: 5, pricePerNight: 15000, rating: 4.8, reviews: 1560, roomsAvailable: 35 },
  { name: 'Taj Bengal',                city: 'Kolkata',   stars: 5, pricePerNight: 12000, rating: 4.7, reviews: 2100, roomsAvailable: 30 },
  { name: 'Park Hyatt Hyderabad',      city: 'Hyderabad', stars: 5, pricePerNight: 13000, rating: 4.6, reviews: 1780, roomsAvailable: 38 },
  { name: 'W Goa',                     city: 'Goa',       stars: 5, pricePerNight: 20000, rating: 4.9, reviews: 3100, roomsAvailable: 48 },
  { name: 'Rambagh Palace Jaipur',     city: 'Jaipur',    stars: 5, pricePerNight: 25000, rating: 4.9, reviews: 2900, roomsAvailable: 42 },
  { name: 'Radisson Blu Delhi',        city: 'Delhi',     stars: 4, pricePerNight: 6500,  rating: 4.3, reviews: 5620, roomsAvailable: 60 },
  { name: 'Novotel Mumbai',            city: 'Mumbai',    stars: 4, pricePerNight: 7200,  rating: 4.4, reviews: 4200, roomsAvailable: 55 },
  { name: 'Marriott Bangalore',        city: 'Bangalore', stars: 4, pricePerNight: 8000,  rating: 4.5, reviews: 3780, roomsAvailable: 50 },
  { name: 'OYO Townhouse Pune',        city: 'Pune',      stars: 3, pricePerNight: 2200,  rating: 4.1, reviews: 8100, roomsAvailable: 80 },
  { name: 'Ibis Styles Goa',           city: 'Goa',       stars: 3, pricePerNight: 4500,  rating: 4.2, reviews: 6400, roomsAvailable: 70 },
  { name: 'FabHotel Jaipur Central',   city: 'Jaipur',    stars: 3, pricePerNight: 1800,  rating: 3.9, reviews: 3200, roomsAvailable: 90 },
  { name: 'Lemon Tree Chennai',        city: 'Chennai',   stars: 4, pricePerNight: 5500,  rating: 4.3, reviews: 2900, roomsAvailable: 65 },
]

// ─── Buses ──────────────────────────────────────────────────────────────────

const buses = [
  { operatorName: 'FirstAC Travels', busNumber: 'BUS001', type: 'AC Sleeper', departure: { city: 'Delhi', time: toISO(d(0), '06:00') }, arrival: { city: 'Jaipur', time: toISO(d(0), '10:00') }, durationMinutes: 240, price: 800, seats: 50, seatsAvailable: 50 },
  { operatorName: 'DelhiBus Tours', busNumber: 'BUS002', type: 'AC Seater', departure: { city: 'Delhi', time: toISO(d(0), '07:30') }, arrival: { city: 'Agra', time: toISO(d(0), '10:30') }, durationMinutes: 180, price: 600, seats: 55, seatsAvailable: 55 },
  { operatorName: 'MumbaiCoaches', busNumber: 'BUS003', type: 'AC Sleeper', departure: { city: 'Mumbai', time: toISO(d(0), '08:00') }, arrival: { city: 'Pune', time: toISO(d(0), '10:15') }, durationMinutes: 135, price: 500, seats: 60, seatsAvailable: 60 },
  { operatorName: 'BangaloreExpress', busNumber: 'BUS004', type: 'Non-AC', departure: { city: 'Bangalore', time: toISO(d(0), '05:00') }, arrival: { city: 'Mysore', time: toISO(d(0), '07:30') }, durationMinutes: 150, price: 400, seats: 45, seatsAvailable: 45 },
  { operatorName: 'NightRiders', busNumber: 'BUS005', type: 'AC Sleeper', departure: { city: 'Delhi', time: toISO(d(0), '22:00') }, arrival: { city: 'Lucknow', time: toISO(d(1), '06:00') }, durationMinutes: 480, price: 1200, seats: 50, seatsAvailable: 50 },
  { operatorName: 'GreenLineTours', busNumber: 'BUS006', type: 'AC Sleeper', departure: { city: 'Goa', time: toISO(d(0), '20:00') }, arrival: { city: 'Bangalore', time: toISO(d(1), '07:00') }, durationMinutes: 660, price: 1500, seats: 55, seatsAvailable: 55 },
]

// ─── Trains ─────────────────────────────────────────────────────────────────

const trains = [
  { operatorName: 'Indian Railways', trainNumber: '12345', type: 'Rajdhani Express', departure: { city: 'Delhi', time: toISO(d(0), '16:00') }, arrival: { city: 'Mumbai', time: toISO(d(1), '08:00') }, durationMinutes: 960, price: 3500, seats: 100, seatsAvailable: 100 },
  { operatorName: 'Indian Railways', trainNumber: '12456', type: 'Shatabdi Express', departure: { city: 'Delhi', time: toISO(d(0), '06:00') }, arrival: { city: 'Jaipur', time: toISO(d(0), '10:00') }, durationMinutes: 240, price: 1200, seats: 150, seatsAvailable: 150 },
  { operatorName: 'Indian Railways', trainNumber: '12567', type: 'Express', departure: { city: 'Mumbai', time: toISO(d(0), '20:00') }, arrival: { city: 'Bangalore', time: toISO(d(1), '14:00') }, durationMinutes: 1080, price: 2500, seats: 200, seatsAvailable: 200 },
  { operatorName: 'Indian Railways', trainNumber: '12678', type: 'Express', departure: { city: 'Delhi', time: toISO(d(0), '18:30') }, arrival: { city: 'Chennai', time: toISO(d(2), '06:00') }, durationMinutes: 1950, price: 4500, seats: 120, seatsAvailable: 120 },
  { operatorName: 'Indian Railways', trainNumber: '12789', type: 'Local Express', departure: { city: 'Bangalore', time: toISO(d(0), '10:00') }, arrival: { city: 'Chennai', time: toISO(d(0), '16:30') }, durationMinutes: 390, price: 1800, seats: 180, seatsAvailable: 180 },
]

// ─── Cabs ───────────────────────────────────────────────────────────────────

const cabs = [
  { operatorName: 'CabEase', cabNumber: 'CAB001', type: 'Economy', baseFare: 200, perKmRate: 15, perMinuteRate: 1, location: 'Delhi', currentCity: 'Delhi', cabs: 100, cabsAvailable: 100 },
  { operatorName: 'CabEase', cabNumber: 'CAB002', type: 'Comfort', baseFare: 300, perKmRate: 20, perMinuteRate: 1.5, location: 'Delhi', currentCity: 'Delhi', cabs: 100, cabsAvailable: 100 },
  { operatorName: 'RidexCabs', cabNumber: 'CAB003', type: 'Premium', baseFare: 500, perKmRate: 30, perMinuteRate: 2, location: 'Mumbai', currentCity: 'Mumbai', cabs: 50, cabsAvailable: 50 },
  { operatorName: 'RidexCabs', cabNumber: 'CAB004', type: 'XL', baseFare: 400, perKmRate: 25, perMinuteRate: 1.8, location: 'Bangalore', currentCity: 'Bangalore', cabs: 75, cabsAvailable: 75 },
  { operatorName: 'CityRide', cabNumber: 'CAB005', type: 'Economy', baseFare: 250, perKmRate: 18, perMinuteRate: 1.2, location: 'Chennai', currentCity: 'Chennai', cabs: 120, cabsAvailable: 120 },
]

// ─── Seed Functions ──────────────────────────────────────────────────────────

async function seedFlights() {
  console.log('\n Seeding flights...')
  await prisma.flight.deleteMany({})

  const createdFlights = await prisma.flight.createMany({
    data: flights.map(f => ({
      ...f,
      price: parseFloat(f.price),
    })),
  })
  console.log(`  Added ${createdFlights.count} flights`)
}

async function seedHotels() {
  console.log('\n Seeding hotels...')
  await prisma.hotel.deleteMany({})

  const createdHotels = await prisma.hotel.createMany({
    data: hotels.map(h => ({
      ...h,
      pricePerNight: parseFloat(h.pricePerNight),
      rating: parseFloat(h.rating),
    })),
  })
  console.log(`  Added ${createdHotels.count} hotels`)
}

async function seedBuses() {
  console.log('\n Seeding buses...')
  await prisma.bus.deleteMany({})

  const createdBuses = await prisma.bus.createMany({
    data: buses.map(b => ({
      ...b,
      price: parseFloat(b.price),
      seats: b.seats,
      seatsAvailable: b.seatsAvailable,
    })),
  })
  console.log(`  Added ${createdBuses.count} buses`)
}

async function seedTrains() {
  console.log('\n Seeding trains...')
  await prisma.train.deleteMany({})

  const createdTrains = await prisma.train.createMany({
    data: trains.map(t => ({
      ...t,
      price: parseFloat(t.price),
      seats: t.seats,
      seatsAvailable: t.seatsAvailable,
    })),
  })
  console.log(`  Added ${createdTrains.count} trains`)
}

async function seedCabs() {
  console.log('\n Seeding cabs...')
  await prisma.cab.deleteMany({})

  const createdCabs = await prisma.cab.createMany({
    data: cabs.map(c => ({
      ...c,
      baseFare: parseFloat(c.baseFare),
      perKmRate: parseFloat(c.perKmRate),
      perMinuteRate: parseFloat(c.perMinuteRate),
      cabs: c.cabs,
      cabsAvailable: c.cabsAvailable,
    })),
  })
  console.log(`  Added ${createdCabs.count} cabs`)
}

async function main() {
  console.log('Starting MongoDB seed...')
  try {
    await seedFlights()
    await seedHotels()
    await seedBuses()
    await seedTrains()
    await seedCabs()
    console.log('\nDone! MongoDB seeded successfully.')
  } catch (err) {
    console.error('Seed failed:', err)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Fatal seed error:', err)
  process.exit(1)
})
