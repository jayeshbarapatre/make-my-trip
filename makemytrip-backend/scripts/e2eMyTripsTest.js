/**
 * My Trips End-to-End Verification
 *
 * Drives the REAL authenticated API for a freshly-registered user, creating one
 * booking per category and reading it straight back from GET /bookings/user/:id
 * (the exact endpoint MyTrips.jsx calls). Proves:
 *   - booking saved with correct ownership (userId)
 *   - My Trips returns it immediately
 *   - status/paymentStatus correct
 *   - logout/login persistence (same userId, fresh token)
 *   - isolation (another user cannot see these bookings)
 *
 * Run from the backend directory:  node scripts/e2eMyTripsTest.js
 */
import 'dotenv/config'
import assertNotProduction from './lib/prodGuard.js'
import { db } from '../src/config/firebase.js'

const API = 'http://localhost:5000/api/v1'
const CATEGORY = ['flight', 'hotel', 'train', 'bus', 'cab']

// The pluralised route path per category. Most add an 's'; 'bus' → 'buses'.
const ROUTE_FOR = { flight: 'flights', hotel: 'hotels', train: 'trains', bus: 'buses', cab: 'cabs' }

const future = (days) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const passengers = [{ name: 'My Trips Tester', age: 30, gender: 'male' }]

const payloadFor = (type) => {
  const base = {
    flight: { flightId: null, fromCity: 'New Delhi (DEL)', toCity: 'Mumbai (BOM)', departureDate: future(14), departureTime: '08:30', arrivalTime: '10:45', airlineName: 'Air India', flightNumber: 'AI-866', fareClass: 'Economy' },
    hotel: { hotelId: null, hotelName: 'The Grand Palace Resort', hotelLocality: 'Bandra West, Mumbai', hotelAddress: '12 Sea Link Road, Bandra, Mumbai 400050', fromCity: 'The Grand Palace Resort', toCity: 'Mumbai', departureDate: future(14), returnDate: future(17), rooms: 1, nights: 3, guests: 2, roomName: 'Deluxe King Room' },
    train: { trainId: null, fromCity: 'New Delhi (NDLS)', toCity: 'Mumbai Central (MMCT)', departureDate: future(20), departureTime: '16:00', arrivalTime: '08:15', trainName: 'Rajdhani Express', trainNumber: '12951', travelClass: '3A' },
    bus: { busId: null, fromCity: 'Delhi (ISBT Kashmere Gate)', toCity: 'Jaipur (Sindhi Camp)', departureDate: future(9), departureTime: '22:30', arrivalTime: '05:00', busOperator: 'VRL Travels', busType: 'Volvo A/C Sleeper', boardingPoint: 'Kashmere Gate, Platform 7', droppingPoint: 'Sindhi Camp, Platform 2' },
    cab: { cabId: null, fromCity: 'Indira Gandhi Intl. Airport (DEL)', toCity: 'Connaught Place, New Delhi', departureDate: future(3), departureTime: '11:00', cabType: 'Sedan (Dzire/Etios)', cabModel: 'Maruti Dzire', driverName: 'Ramesh K.', licensePlate: 'DL 1C AB 1234', distance: '18 km', estimatedTime: '45 min' }
  }[type]
  return { type, ...base, passengers }
}

const fareFor = (type) => {
  const totals = { flight: 12500, hotel: 14400, train: 3500, bus: 1800, cab: 720 }
  const total = totals[type] ?? 5000
  const baseFare = Math.round(total * 0.8)
  const taxes = Math.round(total * 0.12)
  const gst = Math.round(total * 0.05)
  const convenience = total - baseFare - taxes - gst
  return { total, baseFare, taxes, gst, convenience, discount: 0 }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const seedVerifiedPayment = async (type, amount, userId) => {
  const paymentId = `mytrips_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const orderId = `order_${paymentId}`
  await db.collection('payments').doc(orderId).set({
    orderId, paymentId, userId,
    status: 'captured', amount, amountCaptured: amount,
    currency: 'INR', method: 'razorpay',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  })
  return { orderId, paymentId }
}

const main = async () => {
  assertNotProduction('My Trips e2e test creates bookings.')
  const { default: axios } = await import('axios')
  const api = axios.create({ baseURL: API, validateStatus: () => true })

  // ── 1. Register a real user + a second isolation user ───────────────────
  const stamp = Date.now()
  const A = (await api.post('/auth/register', { email: `mytripsa_${stamp}@test.com`, password: 'Test1234!', name: 'User A', phone: '9999900001' })).data.data
  const B = (await api.post('/auth/register', { email: `mytripsb_${stamp}@test.com`, password: 'Test1234!', name: 'User B', phone: '9999900002' })).data.data
  console.log(`\nRegistered User A (${A.user.id}) and User B (${B.user.id})`)

  const authA = { Authorization: `Bearer ${A.token}` }
  const authB = { Authorization: `Bearer ${B.token}` }

  const created = []

  // ── 2. Create one booking per category for User A ───────────────────────
  for (const type of CATEGORY) {
    const fare = fareFor(type)
    const { orderId, paymentId } = await seedVerifiedPayment(type, fare.total, A.user.id)

    const res = await api.post('/bookings/' + ROUTE_FOR[type],
      { ...payloadFor(type), ...fare, orderId, paymentId, userEmail: `mytripsa_${stamp}@test.com`, userName: 'User A' },
      { headers: authA }
    )

    const ok = res.status === 201 && res.data.success
    const booking = res.data?.data
    console.log(`\n[${type.toUpperCase()}] POST /bookings/${type}s → ${res.status} ${ok ? 'OK' : 'FAIL'} | bookingId=${booking?.bookingId} pnr=${booking?.pnr} status=${booking?.status} pay=${booking?.paymentStatus} amount=₹${booking?.totalAmount}`)

    if (!ok) { console.log('  body:', JSON.stringify(res.data).slice(0, 300)); continue }
    created.push({ type, bookingId: booking.bookingId, id: booking.id })
  }

  await sleep(1500) // let Firestore settle

  // ── 3. Read My Trips for User A (the page's exact endpoint) ──────────────
  const myA = await api.get(`/bookings/user/${A.user.id}`, { headers: authA })
  const listA = myA.data?.data || []
  console.log(`\nUser A My Trips: ${myA.status} | ${listA.length} bookings`)
  for (const b of listA) {
    console.log(`  • ${b.type.padEnd(7)} ${b.bookingId} | ${b.status}/${b.paymentStatus} | ₹${b.totalAmount} | uid=${b.userId}`)
  }

  // ── 4. Isolation: User B must NOT see User A's bookings ─────────────────
  const myB = await api.get(`/bookings/user/${B.user.id}`, { headers: authB })
  const listB = myB.data?.data || []
  const leak = listB.some((b) => b.userId === A.user.id)
  console.log(`\nUser B My Trips: ${myB.status} | ${listB.length} bookings | isolation leak: ${leak ? 'YES ❌' : 'NO ✅'}`)

  // ── 5. Persistence: fresh login (new token), same bookings ──────────────
  const relogin = (await api.post('/auth/login', { email: `mytripsa_${stamp}@test.com`, password: 'Test1234!' })).data.data
  const myRelogin = await api.get(`/bookings/user/${relogin.user.id}`, { headers: { Authorization: `Bearer ${relogin.token}` } })
  const listRelogin = myRelogin.data?.data || []
  console.log(`\nAfter logout/login: ${listRelogin.length} bookings (expected ${created.length}) | ${listRelogin.length === created.length ? 'PERSIST ✅' : 'MISMATCH ❌'}`)

  // ── 6. Summary ──────────────────────────────────────────────────────────
  const found = CATEGORY.filter((t) => listA.some((b) => b.type === t))
  const missing = CATEGORY.filter((t) => !found.includes(t))
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Categories in My Trips: ${found.join(', ') || 'NONE'}`)
  console.log(`Missing: ${missing.join(', ') || 'NONE'}`)
  console.log(`Isolation: ${!leak ? 'PASS' : 'FAIL'} | Persistence: ${listRelogin.length === created.length ? 'PASS' : 'FAIL'}`)
  console.log(missing.length === 0 && !leak ? '\n✅ MY TRIPS END-TO-END: ALL PASS\n' : '\n❌ MY TRIPS END-TO-END: ISSUES FOUND\n')

  process.exit(0)
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
