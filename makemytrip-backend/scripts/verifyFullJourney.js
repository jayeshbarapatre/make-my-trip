#!/usr/bin/env node
/**
 * The whole platform, exercised as the three people who use it.
 *
 * Admin creates a vendor -> vendor lists a property -> vendor submits it ->
 * admin is notified -> admin approves -> a customer finds it in search -> the
 * customer pays for it -> the booking appears in My Trips. Then the same for the
 * two categories only an admin can create, flights and trains.
 *
 * Everything here goes over HTTP against a running server, through the same
 * endpoints the browser calls. Nothing imports a controller directly, because
 * the point is to catch the wiring — auth, roles, route mounts, response shapes
 * — that unit tests step around.
 *
 * Payment is real to the edge of what can be automated: /payment/create-order
 * calls the live Razorpay test API and gets back a genuine order. What no script
 * can do is type a card number into Razorpay's iframe, so capture arrives the
 * way it does when a customer closes the tab — as a signed webhook, which the
 * server treats as the authoritative source either way.
 *
 *   node scripts/verifyFullJourney.js
 *   node scripts/verifyFullJourney.js --base http://localhost:5055/api/v1
 *   node scripts/verifyFullJourney.js --cleanup     # remove what a run created
 */

import 'dotenv/config'
import crypto from 'crypto'
import { db } from '../src/config/firebase.js'
import assertNotProduction from './lib/prodGuard.js'

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : (process.argv[i + 1] ?? true)
}

const BASE = arg('base', 'http://localhost:5000/api/v1')
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET
const CLEANUP = process.argv.includes('--cleanup')

const RUN = Date.now()
const TAG = 'journey'

const banner = (t) => console.log('\n' + '='.repeat(74) + '\n' + t + '\n' + '='.repeat(74))
const step = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 68 - t.length))}`)

let pass = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`   ok   ${name}`); return true }
  failures.push(`${name}${detail ? ' — ' + detail : ''}`)
  console.log(`   FAIL ${name}${detail ? ' — ' + detail : ''}`)
  return false
}

const api = async (method, path, { token, body, headers = {} } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {})
  })

  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* non-JSON error page */ }
  return { status: res.status, body: json, text }
}

const listOf = (res) => {
  const d = res.body?.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.hotels)) return d.hotels
  if (Array.isArray(d?.buses)) return d.buses
  if (Array.isArray(d?.cabs)) return d.cabs
  if (Array.isArray(d?.flights)) return d.flights
  if (Array.isArray(d?.trains)) return d.trains
  if (Array.isArray(d?.bookings)) return d.bookings
  if (Array.isArray(d?.notifications)) return d.notifications
  if (Array.isArray(res.body?.bookings)) return res.body.bookings
  return []
}

// "bus" is the one type whose collection is not its name plus an s, and
// building the name by hand wrote the run tag to a "buss" collection that
// nothing reads — so --cleanup silently left every test bus behind.
const COLLECTION_OF = { hotel: 'hotels', bus: 'buses', cab: 'cabs', flight: 'flights', train: 'trains' }

const iso = (d) => d.toISOString().slice(0, 10)
const TRAVEL_DATE = iso(new Date(Date.now() + 21 * 864e5))

/* ─────────────────────────── payment ─────────────────────────── */

/**
 * Quote, order, capture. The order is genuinely created at Razorpay; the
 * capture is a webhook signed with the same secret the server verifies against,
 * which is exactly the path a real capture takes when the browser never returns.
 */
const payAndBook = async ({ token, type, itemId, quantity = 1, nights = null, distance = null, draft, customerEmail }) => {
  // Every checkout page in the app puts the contact address on the draft, and
  // the webhook reads it to address the confirmation email. Omitting it here
  // produced bookings with userEmail: null — a test artefact that looked
  // exactly like a real "no confirmation email" defect, so it is sent the way
  // the UI sends it.
  draft = { ...draft, userEmail: customerEmail }

  const quoteRes = await api('POST', '/payment/quote', {
    token,
    body: { type, itemId, quantity, ...(nights ? { nights } : {}), ...(distance ? { distance } : {}) }
  })
  if (!check(`${type}: server prices the trip`, quoteRes.status === 200, quoteRes.body?.message)) return null

  const quoteToken = quoteRes.body?.data?.quoteToken
  const total = quoteRes.body?.data?.totalAmount
  if (!check(`${type}: quote is signed`, Boolean(quoteToken))) return null

  const orderRes = await api('POST', '/payment/create-order', {
    token,
    body: { quoteToken, bookingDraft: draft }
  })
  if (!check(`${type}: Razorpay order created (live test API)`, orderRes.status === 200, orderRes.body?.message)) return null

  const orderId = orderRes.body?.data?.orderId
  check(`${type}: order is a real Razorpay id`, String(orderId).startsWith('order_'), orderId)

  const paymentId = `pay_${TAG}${RUN}${Math.random().toString(36).slice(2, 8)}`
  const event = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: Math.round(total * 100),
          status: 'captured',
          method: 'card'
        }
      }
    }
  })

  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(event).digest('hex')
  const hook = await api('POST', '/payment/webhook', {
    body: event,
    headers: { 'x-razorpay-signature': signature }
  })

  if (!check(`${type}: capture webhook accepted`, hook.status === 200, hook.body?.message)) return null

  const bookingSnap = await db.collection('bookings').doc(`pay_${paymentId}`).get()
  if (!check(`${type}: booking written`, bookingSnap.exists)) return null

  const booking = bookingSnap.data()
  check(`${type}: amount is the captured amount, not the client's`, booking.totalAmount === total,
    `stored ${booking.totalAmount} vs quoted ${total}`)
  check(`${type}: booking carries a PNR`, Boolean(booking.pnr))
  check(`${type}: confirmation email has an address to go to`, Boolean(booking.userEmail),
    'userEmail is null — the confirmation would have nowhere to send')

  await db.collection('bookings').doc(`pay_${paymentId}`).update({ journeyRun: RUN })
  await db.collection('payments').doc(orderId).update({ journeyRun: RUN }).catch(() => {})

  return { bookingId: booking.bookingId, amount: booking.totalAmount, docId: `pay_${paymentId}` }
}

/* ─────────────────────── vendor categories ─────────────────────── */

const VENDOR_FLOWS = [
  {
    type: 'hotel',
    vendorPath: '/vendor/hotels',
    approvalPath: '/admin/approvals/hotels',
    listing: () => ({
      name: `Journey Grand ${RUN}`,
      city: 'Udaipur',
      location: 'Lake Road',
      pricePerNight: 4200,
      rooms: 12,
      rating: 4,
      stars: 4,
      amenities: ['WiFi', 'Pool']
    }),
    search: () => `/hotels?city=Udaipur`,
    quantity: 1,
    nights: 2,
    draft: (id) => ({
      type: 'hotel', hotelId: id, rooms: 1, nights: 2,
      checkIn: TRAVEL_DATE, checkOut: iso(new Date(Date.now() + 23 * 864e5)),
      userName: 'Journey Customer'
    })
  },
  {
    type: 'bus',
    vendorPath: '/vendor/buses',
    approvalPath: '/admin/approvals/buses',
    listing: () => ({
      busName: `Journey Travels ${RUN}`,
      busNumber: `JT-${RUN % 100000}`,
      busType: 'AC Sleeper',
      from: 'Udaipur',
      to: 'Ahmedabad',
      price: 780,
      seats: 30,
      departureTime: '21:00',
      arrivalTime: '05:30'
    }),
    search: () => `/buses?from=Udaipur&to=Ahmedabad&date=${TRAVEL_DATE}`,
    quantity: 1,
    draft: (id) => ({ type: 'bus', busId: id, travelDate: TRAVEL_DATE, userName: 'Journey Customer' })
  },
  {
    type: 'cab',
    vendorPath: '/vendor/cabs',
    approvalPath: '/admin/approvals/cabs',
    listing: () => ({
      type: 'SUV',
      vehicleNumber: `JC-${RUN % 100000}`,
      from: 'Udaipur',
      to: 'Mount Abu',
      price: 2400,
      perKmRate: 14,
      capacity: 6
    }),
    search: () => `/cabs?from=Udaipur&to=Mount Abu`,
    quantity: 1,
    distance: '160 km',
    draft: (id) => ({ type: 'cab', cabId: id, travelDate: TRAVEL_DATE, userName: 'Journey Customer' })
  }
]

const runVendorFlow = async (flow, adminToken, customerToken, customerEmail) => {
  step(`${flow.type.toUpperCase()} — vendor lists it, admin approves it, customer books it`)

  const email = `${TAG}_${flow.type}_vendor_${RUN}@example.test`
  const password = 'Journey@123456'

  const created = await api('POST', '/admin/vendors', {
    token: adminToken,
    body: { name: `Journey ${flow.type} vendor`, email, password, phone: '9876500000', vendorType: flow.type }
  })
  if (!check(`${flow.type}: admin creates the vendor`, [200, 201].includes(created.status), created.body?.message)) return null

  const login = await api('POST', '/vendor/login', { body: { email, password } })
  if (!check(`${flow.type}: vendor can sign in`, login.status === 200, login.body?.message)) return null
  const vendorToken = login.body?.data?.token

  const listing = await api('POST', flow.vendorPath, { token: vendorToken, body: flow.listing() })
  if (!check(`${flow.type}: vendor creates the listing`, [200, 201].includes(listing.status), listing.body?.message)) return null

  const listingId = listing.body?.data?.[flow.type]?.id ?? listing.body?.data?.id
  if (!check(`${flow.type}: listing has an id`, Boolean(listingId))) return null

  await db.collection(COLLECTION_OF[flow.type]).doc(listingId).update({ journeyRun: RUN }).catch(() => {})

  const beforeApproval = await api('GET', flow.search(), {})
  const visibleEarly = listOf(beforeApproval).some((r) => r.id === listingId)
  check(`${flow.type}: unsubmitted listing is NOT yet sellable`, !visibleEarly)

  const submitted = await api('PATCH', `${flow.vendorPath}/${listingId}/submit`, { token: vendorToken })
  if (!check(`${flow.type}: vendor submits it for approval`, submitted.status === 200, submitted.body?.message)) return null

  const notifications = await api('GET', '/admin/notifications', { token: adminToken })
  const notes = listOf(notifications)
  const matched = notes.find((n) => JSON.stringify(n).includes(String(listingId)))
  check(`${flow.type}: admin is notified`, Boolean(matched),
    matched ? '' : `${notes.length} notifications, none referencing ${listingId}`)

  const unread = await api('GET', '/admin/notifications/unread-count', { token: adminToken })
  check(`${flow.type}: the bell shows an unread count`,
    unread.status === 200 && Number(unread.body?.data?.count ?? unread.body?.count ?? 0) > 0)

  if (matched?.id) {
    const read = await api('PATCH', `/admin/notifications/${matched.id}/read`, { token: adminToken })
    check(`${flow.type}: opening the notification marks it read`, read.status === 200, read.body?.message)
  }

  const queue = await api('GET', flow.approvalPath, { token: adminToken })
  check(`${flow.type}: it appears in the approvals queue`,
    listOf(queue).some((r) => r.id === listingId), `queue had ${listOf(queue).length}`)

  const approved = await api('PATCH', `${flow.approvalPath}/${listingId}/approve`, { token: adminToken })
  if (!check(`${flow.type}: admin approves it`, approved.status === 200, approved.body?.message)) return null

  const search = await api('GET', flow.search(), {})
  const found = listOf(search).find((r) => r.id === listingId)
  if (!check(`${flow.type}: customer finds it in search`, Boolean(found),
    `search returned ${listOf(search).length} results`)) return null

  return payAndBook({
    token: customerToken,
    type: flow.type,
    itemId: listingId,
    quantity: flow.quantity,
    nights: flow.nights ?? null,
    distance: flow.distance ?? null,
    draft: flow.draft(listingId),
    customerEmail
  })
}

/* ─────────────────────── admin categories ─────────────────────── */

const ADMIN_FLOWS = [
  {
    type: 'flight',
    createPath: '/admin/flights',
    body: () => ({
      airline: `Journey Air ${RUN % 1000}`,
      flightNumber: `JA-${RUN % 10000}`,
      departure: { city: 'Udaipur', airport: 'UDR', date: TRAVEL_DATE, time: '08:45' },
      arrival: { city: 'Delhi', airport: 'DEL', date: TRAVEL_DATE, time: '10:30' },
      price: 5400,
      seats: 60
    }),
    search: () => `/flights?from=Udaipur&to=Delhi&date=${TRAVEL_DATE}`,
    draft: (id) => ({
      type: 'flight', flightId: id, userName: 'Journey Customer',
      passengers: [{ firstName: 'Journey', lastName: 'Customer', type: 'adult', age: 30 }]
    })
  },
  {
    type: 'train',
    createPath: '/admin/trains',
    body: () => ({
      trainName: `Journey Express ${RUN % 1000}`,
      trainNumber: `${12000 + (RUN % 900)}`,
      from: 'Udaipur',
      to: 'Jaipur',
      price: 720,
      seats: 80,
      departureTime: '06:15',
      arrivalTime: '13:40',
      trainClass: 'SL'
    }),
    search: () => `/trains?from=Udaipur&to=Jaipur&date=${TRAVEL_DATE}`,
    draft: (id) => ({ type: 'train', trainId: id, travelDate: TRAVEL_DATE, travelClass: 'SL', userName: 'Journey Customer' })
  }
]

const runAdminFlow = async (flow, adminToken, customerToken, customerEmail) => {
  step(`${flow.type.toUpperCase()} — admin creates it, customer books it`)

  const created = await api('POST', flow.createPath, { token: adminToken, body: flow.body() })
  if (!check(`${flow.type}: admin creates it`, [200, 201].includes(created.status),
    created.body?.message ?? JSON.stringify(created.body?.errors ?? {}))) return null

  const id = created.body?.data?.[flow.type]?.id ?? created.body?.data?.id
  if (!check(`${flow.type}: it has an id`, Boolean(id))) return null

  await db.collection(COLLECTION_OF[flow.type]).doc(id).update({ journeyRun: RUN }).catch(() => {})

  const search = await api('GET', flow.search(), {})
  const found = listOf(search).find((r) => r.id === id)
  if (!check(`${flow.type}: customer finds it in search`, Boolean(found),
    `search returned ${listOf(search).length} results`)) return null

  return payAndBook({
    token: customerToken,
    type: flow.type,
    itemId: id,
    quantity: 1,
    draft: flow.draft(id),
    customerEmail
  })
}

/* ───────────────────────────── main ───────────────────────────── */

const cleanup = async () => {
  banner('REMOVING WHAT PREVIOUS JOURNEY RUNS CREATED')

  for (const collection of ['bookings', 'payments', 'hotels', 'buses', 'cabs', 'flights', 'trains']) {
    const snap = await db.collection(collection).where('journeyRun', '>', 0).get().catch(() => ({ docs: [] }))
    for (const d of snap.docs) await d.ref.delete()
    if (snap.docs.length) console.log(`  ${collection}: ${snap.docs.length} removed`)
  }

  const users = await db.collection('users').get()
  let removed = 0
  for (const d of users.docs) {
    if (String(d.id).startsWith(`${TAG}_`)) { await d.ref.delete(); removed++ }
  }
  console.log(`  users: ${removed} removed`)
}

const main = async () => {
  assertNotProduction('This script creates vendors, listings, payments and bookings.')

  if (CLEANUP) { await cleanup(); return true }

  banner('FULL PLATFORM JOURNEY')
  console.log(`  server:  ${BASE}`)
  console.log(`  chain:   admin -> vendor -> listing -> approval -> search -> payment -> My Trips`)

  if (!WEBHOOK_SECRET) {
    console.log('\n  RAZORPAY_WEBHOOK_SECRET is not set, so a capture cannot be delivered.')
    console.log('  Start the server with one and pass the same value here.')
    return false
  }

  step('SIGN IN')
  const adminLogin = await api('POST', '/admin/login', {
    body: { email: arg('admin-email', 'jayeshbarapatre4923@gmail.com'), password: arg('admin-password', 'Jayesh@123456') }
  })
  if (!check('admin signs in', adminLogin.status === 200, adminLogin.body?.message)) return false
  const adminToken = adminLogin.body?.data?.token

  const customerEmail = `${TAG}_customer_${RUN}@example.test`
  const register = await api('POST', '/auth/register', {
    body: { name: 'Journey Customer', email: customerEmail, password: 'Journey@123456', phone: `98765${RUN % 100000}` }
  })
  if (!check('a new customer registers', [200, 201].includes(register.status), register.body?.message)) return false

  let customerToken = register.body?.data?.token
  if (!customerToken) {
    const login = await api('POST', '/auth/login', { body: { email: customerEmail, password: 'Journey@123456' } })
    customerToken = login.body?.data?.token
  }
  if (!check('the customer has a session', Boolean(customerToken))) return false

  const booked = []

  for (const flow of VENDOR_FLOWS) {
    const result = await runVendorFlow(flow, adminToken, customerToken, customerEmail)
    if (result) booked.push({ type: flow.type, ...result })
  }

  for (const flow of ADMIN_FLOWS) {
    const result = await runAdminFlow(flow, adminToken, customerToken, customerEmail)
    if (result) booked.push({ type: flow.type, ...result })
  }

  step('MY TRIPS — every booking the customer just made')
  const trips = await api('GET', '/user/bookings', { token: customerToken })
  check('My Trips loads', trips.status === 200, trips.body?.message)

  const tripIds = listOf(trips).map((b) => b.bookingId ?? b.id)
  for (const b of booked) {
    check(`${b.type}: ${b.bookingId} shows in My Trips`, tripIds.includes(b.bookingId))
  }
  check(`My Trips lists all ${booked.length} of this run's bookings`, booked.length === 5,
    `${booked.length} of 5 categories completed`)

  banner(failures.length === 0
    ? `JOURNEY PASSED — ${pass} checks across 5 categories`
    : `JOURNEY FAILED — ${failures.length} of ${pass + failures.length} checks`)

  if (booked.length) {
    console.log('\n  Bookings created:')
    for (const b of booked) console.log(`    ${b.type.padEnd(7)} ${b.bookingId}  ₹${b.amount}`)
    console.log(`\n  Customer: ${customerEmail} / Journey@123456`)
  }
  if (failures.length) {
    console.log('\n  Failures:')
    failures.forEach((f) => console.log('    ✗ ' + f))
  }

  return failures.length === 0
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((err) => { console.error('Journey crashed:', err); process.exit(1) })
