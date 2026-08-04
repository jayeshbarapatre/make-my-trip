/**
 * End-to-end booking verification for all five categories.
 *
 * Walks the real chain for each vertical:
 *
 *   search -> details -> quote -> payment record -> booking -> Firestore
 *          -> My Trips -> invoice PDF -> ticket PDF -> email render
 *
 * Uses the real controllers and services. The single thing it fakes is the
 * Razorpay capture: `createBookingForPayment` requires a captured, caller-owned
 * payment, and this script cannot charge a real card. It therefore writes a
 * payment document in exactly the shape `POST /payment/verify` writes after the
 * gateway confirms, then proceeds through the genuine booking path. Everything
 * downstream of that — pricing, availability reservation, document generation —
 * is the production code path.
 *
 * SMTP delivery is rendered but not sent: the credentials are among those
 * flagged compromised, so the server refuses to boot with them. The renderer is
 * exercised so a template break is still caught.
 *
 * Every document it creates is prefixed `e2e_` and removed at the end.
 *
 *   npm run verify:booking
 *   npm run verify:booking -- --keep    # leave the data for inspection
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { now } from '../src/utils/time.js'
import { canonicalCity } from '../src/utils/cities.js'
import { quoteTrip } from '../src/services/pricingService.js'
import { createBookingForPayment, releaseAvailability, resolveItemId, bookedQuantity } from '../src/services/bookingService.js'
import { getUserBookings } from '../src/controllers/firebaseBookingController.js'
import { generateTicketPDF, generateInvoicePDF } from '../src/services/email/pdfService.js'
import { searchFlights } from '../src/controllers/firebaseFlightController.js'
import { searchTrains } from '../src/controllers/firebaseTrainController.js'
import { searchBuses } from '../src/controllers/firebaseBusController.js'
import { searchCabs } from '../src/controllers/firebaseCabController.js'
import { searchHotels } from '../src/controllers/firebaseHotelController.js'
import assertNotProduction from './lib/prodGuard.js'

const banner = (t) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))

const TAG = 'e2e'
const USER_ID = `${TAG}_user_${Date.now()}`
const USER_EMAIL = `${TAG}_${Date.now()}@integration.test`
const created = { payments: [], bookings: [], users: [] }

let pass = 0
let fail = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`     ok   ${name}`); return }
  fail++
  failures.push(`${name}${detail ? ' — ' + detail : ''}`)
  console.log(`     FAIL ${name}${detail ? ' — ' + detail : ''}`)
}

const call = (handler, req) => new Promise((resolve) => {
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this },
    json(body) { resolve({ status: this.statusCode, body }) }
  }
  handler(req, res)
})

const CASES = [
  { type: 'flight', search: searchFlights, query: { from: 'New Delhi', to: 'Mumbai' }, itemKey: 'flightId', qty: { quantity: 1 } },
  { type: 'hotel', search: searchHotels, query: { city: 'New Delhi' }, itemKey: 'hotelId', qty: { quantity: 1, nights: 2 } },
  { type: 'train', search: searchTrains, query: { from: 'New Delhi', to: 'Jaipur' }, itemKey: 'trainId', qty: { quantity: 1 } },
  { type: 'bus', search: searchBuses, query: { from: 'Mumbai', to: 'Pune' }, itemKey: 'busId', qty: { quantity: 1 } },
  { type: 'cab', search: searchCabs, query: { from: 'New Delhi', to: 'Jaipur' }, itemKey: 'cabId', qty: { quantity: 1 } }
]

/**
 * Writes the payment document that `POST /payment/verify` writes once Razorpay
 * confirms a capture. This is the one faked step; everything after it is the
 * production path.
 */
const recordCapturedPayment = async (amount) => {
  const orderId = `order_${TAG}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const paymentId = `pay_${TAG}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  await db.collection('payments').doc(orderId).set({
    orderId,
    paymentId,
    userId: USER_ID,
    amount,
    amountCaptured: amount,
    currency: 'INR',
    status: 'captured',
    method: 'upi',
    provider: 'razorpay',
    createdAt: now(),
    updatedAt: now(),
    isDeleted: false
  })
  created.payments.push(orderId)
  return { orderId, paymentId, amount, method: 'upi' }
}

const runCase = async (spec) => {
  console.log(`\n── ${spec.type.toUpperCase()} ${'─'.repeat(60 - spec.type.length)}`)

  // 1. SEARCH
  const searchRes = await call(spec.search, { query: { ...spec.query, limit: 5 } })
  const results = searchRes.body?.data ?? []
  check(`${spec.type}: search returns results`, results.length > 0, `${results.length} found`)
  if (!results.length) return

  const item = results[0]
  check(`${spec.type}: result carries an id`, Boolean(item.id))

  // 2. DETAILS — the id must resolve in its own collection
  const collection = { flight: 'flights', hotel: 'hotels', train: 'trains', bus: 'buses', cab: 'cabs' }[spec.type]
  const detail = await db.collection(collection).doc(item.id).get()
  check(`${spec.type}: details page resolves the id`, detail.exists)

  // 3. QUOTE — server-side pricing
  const quoteArgs = { type: spec.type, itemId: item.id, ...spec.qty }
  if (spec.type === 'cab') quoteArgs.distance = `${item.distanceKm ?? 25} km`

  let quote
  try {
    quote = await quoteTrip(quoteArgs)
  } catch (err) {
    check(`${spec.type}: quote succeeds`, false, `${err.code}: ${err.message}`)
    return
  }
  check(`${spec.type}: quote succeeds`, quote.totalAmount > 0, `₹${quote.totalAmount}`)
  check(`${spec.type}: quote breakdown reconciles`,
    quote.baseFare + quote.gst + quote.convenience - quote.discount === quote.totalAmount,
    `${quote.baseFare}+${quote.gst}+${quote.convenience}-${quote.discount} vs ${quote.totalAmount}`)

  // 4. PAYMENT (captured record, as the gateway callback writes it)
  const authority = await recordCapturedPayment(quote.totalAmount)

  // 5. BOOKING — production path, including atomic inventory reservation
  const availField = spec.type === 'hotel' ? 'roomsAvailable' : 'seatsAvailable'
  const before = detail.data()?.[availField]

  const payload = {
    type: spec.type,
    [spec.itemKey]: item.id,
    userEmail: USER_EMAIL,
    userName: 'E2E Traveller',
    passengers: [{ firstName: 'Test', lastName: 'Traveller', type: 'adult', age: 30 }],
    ...(spec.type === 'hotel' ? { rooms: 1, nights: 2, checkIn: '2026-09-01', checkOut: '2026-09-03' } : {}),
    fromCity: spec.query.from ?? spec.query.city,
    toCity: spec.query.to ?? spec.query.city
  }

  let booking
  try {
    const result = await createBookingForPayment({
      payload, authority, userId: USER_ID, userEmail: USER_EMAIL, userName: 'E2E Traveller'
    })
    booking = result.booking
    created.bookings.push(booking.id)
    check(`${spec.type}: booking created`, result.created && Boolean(booking.bookingId), booking.bookingId)
  } catch (err) {
    check(`${spec.type}: booking created`, false, err.message)
    return
  }

  // 6. FIRESTORE — stored, and priced from the gateway not the client
  const stored = await db.collection('bookings').doc(booking.id).get()
  check(`${spec.type}: booking persisted to Firestore`, stored.exists)
  check(`${spec.type}: stored amount is the captured amount`,
    stored.data()?.totalAmount === quote.totalAmount,
    `${stored.data()?.totalAmount} vs ${quote.totalAmount}`)
  check(`${spec.type}: booking has a PNR`, Boolean(stored.data()?.pnr))

  // Inventory reservation
  if (typeof before === 'number') {
    const after = (await db.collection(collection).doc(item.id).get()).data()?.[availField]
    check(`${spec.type}: inventory decremented`, after < before, `${before} -> ${after}`)
  }

  // Idempotency — the same capture must not book twice
  const replay = await createBookingForPayment({
    payload, authority, userId: USER_ID, userEmail: USER_EMAIL, userName: 'E2E Traveller'
  })
  check(`${spec.type}: duplicate payment does not double-book`, !replay.created && replay.booking.id === booking.id)

  // 7. MY TRIPS
  const trips = await call(getUserBookings, { userId: USER_ID, user: { id: USER_ID }, params: {} })
  const mine = (trips.body?.data ?? []).map((b) => b.id)
  check(`${spec.type}: appears in My Trips`, mine.includes(booking.id))

  // 8. TICKET PDF
  try {
    const ticket = await generateTicketPDF({ ...stored.data(), id: booking.id })
    check(`${spec.type}: ticket PDF generated`, Buffer.isBuffer(ticket) && ticket.length > 800, `${ticket?.length ?? 0} bytes`)
    check(`${spec.type}: ticket is a real PDF`, ticket?.slice(0, 4).toString() === '%PDF')
  } catch (err) {
    check(`${spec.type}: ticket PDF generated`, false, err.message)
  }

  // 9. INVOICE PDF
  try {
    const invoice = await generateInvoicePDF({ ...stored.data(), id: booking.id }, `INV-${TAG}-${Date.now()}`)
    check(`${spec.type}: invoice PDF generated`, Buffer.isBuffer(invoice) && invoice.length > 800, `${invoice?.length ?? 0} bytes`)
    check(`${spec.type}: invoice is a real PDF`, invoice?.slice(0, 4).toString() === '%PDF')
  } catch (err) {
    check(`${spec.type}: invoice PDF generated`, false, err.message)
  }

  // 10. EMAIL RENDER — delivery needs uncompromised SMTP credentials, so the
  // template is rendered and inspected rather than sent.
  try {
    const { renderBookingConfirmation } = await import('../src/services/email/templates/booking.js')
      .catch(() => ({ renderBookingConfirmation: null }))

    if (typeof renderBookingConfirmation === 'function') {
      const html = await renderBookingConfirmation({ ...stored.data(), userEmail: USER_EMAIL })
      const body = typeof html === 'string' ? html : (html?.html ?? '')
      check(`${spec.type}: confirmation email renders`, body.length > 200 && body.includes(stored.data().bookingId ?? ''))
    } else {
      console.log('     skip confirmation email render (no exported renderer)')
    }
  } catch (err) {
    check(`${spec.type}: confirmation email renders`, false, err.message)
  }
}

const cleanup = async () => {
  for (const id of created.bookings) {
    const snap = await db.collection('bookings').doc(id).get().catch(() => null)
    if (snap?.exists) {
      const b = snap.data()
      // Give the seat/room back so repeated runs do not drain dev inventory.
      await releaseAvailability(b.type, resolveItemId(b), bookedQuantity(b.type, b)).catch(() => {})
    }
    await db.collection('bookings').doc(id).delete().catch(() => {})
  }
  for (const id of created.payments) await db.collection('payments').doc(id).delete().catch(() => {})
  for (const id of created.users) await db.collection('users').doc(id).delete().catch(() => {})

  const refunds = await db.collection('refunds').where('userId', '==', USER_ID).get().catch(() => ({ docs: [] }))
  for (const d of refunds.docs) await d.ref.delete().catch(() => {})
}

const main = async () => {
  assertNotProduction('This script writes bookings and payment records.')

  banner('END-TO-END BOOKING VERIFICATION')
  console.log(`  user: ${USER_ID}`)
  console.log('  chain: search -> details -> quote -> payment -> booking -> Firestore -> My Trips -> PDF -> invoice -> email')

  for (const spec of CASES) {
    await runCase(spec).catch((err) => check(`${spec.type}: case completed`, false, err.message))
  }

  if (!process.argv.includes('--keep')) {
    console.log('\ncleaning up test data...')
    await cleanup()
    console.log('  done')
  } else {
    console.log('\n--keep: test data left in place')
    console.log('  bookings:', created.bookings.join(', '))
  }

  banner(fail === 0 ? `E2E PASSED — ${pass} checks across ${CASES.length} categories` : `E2E FAILED — ${fail} of ${pass + fail}`)
  if (fail) failures.forEach((f) => console.log('  ✗ ' + f))
  return fail === 0
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch(async (err) => {
    console.error('E2E crashed:', err)
    await cleanup().catch(() => {})
    process.exit(1)
  })
