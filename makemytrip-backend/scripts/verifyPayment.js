/**
 * Payment verification against the REAL Razorpay gateway.
 *
 * This is the gap `verify:booking` leaves open. That script fakes the capture —
 * it writes the payment document by hand and proceeds through the booking path.
 * Everything downstream is real, but the gateway itself is never touched, so
 * the riskiest integration in the product has no end-to-end proof.
 *
 * This script closes that. It creates a genuine Razorpay order over the wire,
 * then delivers a genuinely HMAC-signed webhook to the real handler:
 *
 *   inventory -> quote -> signed token -> REAL Razorpay order
 *             -> signed webhook -> booking -> seat reserved -> idempotency
 *
 * What it proves that unit tests cannot:
 *   - the credentials actually work against api.razorpay.com
 *   - the amount Razorpay is asked to charge is the amount the server priced,
 *     to the paise, with no client input anywhere in the chain
 *   - a webhook signed the way Razorpay signs one verifies against the raw body
 *   - a captured payment yields exactly one booking and exactly one seat
 *
 * What it still does not prove: that LIVE keys work and money settles. That
 * needs account activation and a real ₹1 charge. Test mode exercises the same
 * code path end to end; only the funds are notional.
 *
 * Test-mode keys only. The script refuses to run against `rzp_live_*` unless
 * forced, because it creates orders.
 *
 *   npm run verify:payment
 *   npm run verify:payment -- --local-webhook-secret   # arm stages 4-6 now
 *   npm run verify:payment -- --keep                   # leave fixtures to inspect
 *
 * The webhook secret is a value you choose in the Razorpay dashboard, not one
 * Razorpay issues, so `--local-webhook-secret` signs with an ephemeral one and
 * proves the handler, the signature maths, the booking, the reservation and the
 * quote binding against real inventory. It does NOT prove Razorpay can reach
 * the endpoint — that needs the dashboard secret and a public URL.
 *
 * The Razorpay test order it creates cannot be deleted through the API. That is
 * a meaningless artifact in a test-mode dashboard.
 */

import 'dotenv/config'
import crypto from 'crypto'
import { db } from '../src/config/firebase.js'
import { quoteTrip, signQuote } from '../src/services/pricingService.js'
import { releaseAvailability } from '../src/services/bookingService.js'
import assertNotProduction from './lib/prodGuard.js'

// `config/razorpay.js` reads the webhook secret once, at module load. An
// ephemeral secret therefore has to be in the environment *before* the payment
// controller is pulled in — which is why this one import is dynamic. Nothing
// else in this file's import graph touches that config.
const useLocalSecret = !process.env.RAZORPAY_WEBHOOK_SECRET &&
  process.argv.includes('--local-webhook-secret')

if (useLocalSecret) {
  process.env.RAZORPAY_WEBHOOK_SECRET = crypto.randomBytes(32).toString('hex')
}

const { createRazorpayOrder, handleWebhook } =
  await import('../src/controllers/paymentController.js')

const banner = (t) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))
const stage = (t) => console.log(`\n  ${t}`)

const TAG = 'vpay'
const USER_ID = `${TAG}_user_${Date.now()}`
const created = { payments: [], bookings: [] }

let pass = 0
let fail = 0
let skipped = 0
const failures = []

const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`     ok   ${name}`); return }
  fail++
  failures.push(`${name}${detail ? ' — ' + detail : ''}`)
  console.log(`     FAIL ${name}${detail ? ' — ' + detail : ''}`)
}

const skip = (name, why) => {
  skipped++
  console.log(`     skip ${name} — ${why}`)
}

/** Drives an Express controller and resolves with what it sent. */
const call = (handler, req) => new Promise((resolve, reject) => {
  const res = {
    statusCode: 200,
    status (c) { this.statusCode = c; return this },
    json (body) { resolve({ status: this.statusCode, body }) }
  }
  Promise.resolve(handler(req, res)).catch(reject)
})

/** A webhook delivery shaped exactly as Razorpay sends one. */
const deliverWebhook = async (event, { secret, signature } = {}) => {
  const raw = Buffer.from(JSON.stringify(event), 'utf8')
  const sig = signature ?? crypto.createHmac('sha256', secret).update(raw).digest('hex')

  return call(handleWebhook, {
    body: raw,
    get: (h) => (h.toLowerCase() === 'x-razorpay-signature' ? sig : undefined),
    ip: '127.0.0.1',
    originalUrl: '/api/v1/payment/webhook',
    method: 'POST',
    headers: {}
  })
}

const capturedEvent = (paymentId, orderId, amountPaise) => ({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: paymentId,
        order_id: orderId,
        amount: amountPaise,
        currency: 'INR',
        status: 'captured',
        method: 'netbanking',
        email: `${TAG}@integration.test`
      }
    }
  }
})

/**
 * Flights are the right fixture here: they are not dated inventory, so
 * availability is a single counter and the reservation assertion is
 * unambiguous.
 *
 * Seeded flights carry `seats`, admin-created ones carry `seatsAvailable`, and
 * `isActive` is frequently absent. `bookingService.availabilityField` already
 * copes with the first, and `pricingService` treats a missing `isActive` as
 * active — so filtering happens in memory against the same rules rather than in
 * a query that would miss most of the collection (and need a composite index).
 */
const seatField = (d) => (d.seatsAvailable !== undefined ? 'seatsAvailable' : 'seats')

const findBookableFlight = async () => {
  const snap = await db.collection('flights').limit(50).get()
  for (const doc of snap.docs) {
    const d = doc.data()
    if (d.isActive === false || d.isDeleted === true) continue
    if (Number(d[seatField(d)]) > 0 && Number(d.price) > 0) return { id: doc.id, ...d }
  }
  return null
}

const seatsOf = async (flightId) => {
  const d = (await db.collection('flights').doc(flightId).get()).data()
  return d ? Number(d[seatField(d)]) : NaN
}

const cleanup = async (flightId, bookedSeats) => {
  for (const id of created.bookings) {
    // Return the seat before deleting the booking, or inventory leaks.
    await releaseAvailability(id).catch(() => {})
    await db.collection('bookings').doc(id).delete().catch(() => {})
  }
  for (const id of created.payments) {
    await db.collection('payments').doc(id).delete().catch(() => {})
  }

  // Belt and braces: if releaseAvailability could not resolve the booking, put
  // the seats back directly so a verification run never costs real inventory.
  if (flightId && Number.isFinite(bookedSeats?.expected)) {
    const snap = await db.collection('flights').doc(flightId).get().catch(() => null)
    const data = snap?.data()
    if (data && Number(data[seatField(data)]) < bookedSeats.expected) {
      await db.collection('flights').doc(flightId)
        .update({ [seatField(data)]: bookedSeats.expected }).catch(() => {})
    }
  }
}

const main = async () => {
  assertNotProduction('This script creates Razorpay orders, bookings and payment records.')

  banner('PAYMENT VERIFICATION — REAL RAZORPAY GATEWAY')

  // ── Stage 0: preflight ────────────────────────────────────────────────────
  stage('0. credentials')

  const keyId = process.env.RAZORPAY_KEY_ID ?? ''
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? ''
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

  check('RAZORPAY_KEY_ID is set', Boolean(keyId))
  check('RAZORPAY_KEY_SECRET is set', Boolean(keySecret))
  if (!keyId || !keySecret) {
    banner('ABORTED — no gateway credentials. Set them in .env and re-run.')
    return false
  }

  const isLive = keyId.startsWith('rzp_live')
  if (isLive && !process.argv.includes('--i-know-these-are-live-keys')) {
    banner('ABORTED — these are LIVE keys and this script creates orders.')
    console.log('  Re-run with test-mode keys, or pass --i-know-these-are-live-keys.')
    return false
  }
  console.log(`     mode: ${isLive ? 'LIVE' : 'TEST'}`)

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const ping = await fetch('https://api.razorpay.com/v1/orders?count=1', {
    headers: { Authorization: `Basic ${auth}` }
  }).catch((e) => ({ ok: false, status: 0, _err: e.message }))

  check('gateway accepts these credentials', ping.status === 200,
    ping.status === 200 ? '' : `HTTP ${ping.status}${ping._err ? ' — ' + ping._err : ''}`)
  if (ping.status !== 200) {
    banner('ABORTED — the gateway rejected these credentials.')
    return false
  }

  // ── Stage 1: real inventory ───────────────────────────────────────────────
  stage('1. inventory')

  const flight = await findBookableFlight()
  check('a bookable flight exists in Firestore', Boolean(flight),
    flight ? '' : 'seed inventory first: npm run seed')
  if (!flight) {
    banner('ABORTED — no inventory to price.')
    return false
  }
  const route = `${flight.from ?? flight.source ?? '?'} -> ${flight.to ?? flight.destination ?? '?'}`
  console.log(`     flight: ${flight.id} (${route}) seats=${flight[seatField(flight)]}`)

  const seatsBefore = await seatsOf(flight.id)

  // ── Stage 2: server-side quote ────────────────────────────────────────────
  stage('2. quote (pricingService — the only thing allowed to decide a price)')

  const quote = await quoteTrip({ type: 'flight', itemId: flight.id, quantity: 1, userId: USER_ID })
  const sum = quote.baseFare + quote.taxes + quote.convenience - quote.discount

  check('quote returns a positive total', quote.totalAmount > 0, `got ${quote.totalAmount}`)
  check('breakdown reconciles with the total', Math.abs(sum - quote.totalAmount) <= 1,
    `${sum} vs ${quote.totalAmount}`)
  console.log(`     priced: ₹${quote.totalAmount} (base ${quote.baseFare} + tax ${quote.taxes} + fee ${quote.convenience})`)

  const quoteToken = signQuote(quote, USER_ID)
  check('quote is signed into a token', typeof quoteToken === 'string' && quoteToken.length > 40)

  // ── Stage 3: a real order at Razorpay ─────────────────────────────────────
  stage('3. order (over the wire to api.razorpay.com)')

  const draft = {
    type: 'flight',
    flightId: flight.id,
    passengers: [{ name: 'Verification Traveller', age: '30', gender: 'Male' }],
    userEmail: `${TAG}@integration.test`,
    userName: 'Verification Traveller'
  }

  const orderRes = await call(createRazorpayOrder, {
    body: { quoteToken, bookingDraft: draft },
    user: { id: USER_ID, email: draft.userEmail },
    userId: USER_ID,
    ip: '127.0.0.1',
    headers: {},
    method: 'POST',
    originalUrl: '/api/v1/payment/create-order'
  })

  check('create-order succeeded', orderRes.status === 200,
    `HTTP ${orderRes.status} ${JSON.stringify(orderRes.body?.message ?? '')}`)
  if (orderRes.status !== 200) {
    banner('ABORTED — the order could not be created.')
    return false
  }

  const orderId = orderRes.body.data.orderId
  created.payments.push(orderId)
  console.log(`     order: ${orderId}`)

  const orderAmountPaise = orderRes.body.data.amount
  check('the gateway was asked for exactly the quoted amount',
    orderAmountPaise === Math.round(quote.totalAmount * 100),
    `${orderAmountPaise} paise vs ${Math.round(quote.totalAmount * 100)}`)

  // The order really exists at Razorpay, not just in our response object.
  const remote = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` }
  }).then((r) => r.json()).catch(() => null)

  check('the order exists at Razorpay', remote?.id === orderId)
  check('Razorpay holds the same amount we priced', remote?.amount === Math.round(quote.totalAmount * 100),
    `gateway says ${remote?.amount}`)

  const orderDoc = (await db.collection('payments').doc(orderId).get()).data()
  check('the order was recorded with its quote', orderDoc?.quote?.itemId === flight.id)
  check('the traveller draft was stored for webhook recovery',
    orderDoc?.bookingDraft?.flightId === flight.id)

  // ── Stage 4: the webhook ──────────────────────────────────────────────────
  stage('4. webhook (the abandoned-checkout path)')

  // The webhook secret is a value WE choose in the dashboard, not one Razorpay
  // issues. So the handler, the signature maths and everything downstream can
  // be proven against real Firestore with an ephemeral secret. What that cannot
  // prove is that Razorpay actually reaches this endpoint with the secret the
  // dashboard holds — only a real delivery over a public URL shows that.
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

  if (useLocalSecret) {
    console.log('     --local-webhook-secret: signing with an ephemeral secret.')
    console.log('     This proves the handler, not that Razorpay can deliver to it.')
  }

  if (!secret) {
    skip('signed delivery creates the booking', 'RAZORPAY_WEBHOOK_SECRET is not set')
    skip('idempotency under repeated delivery', 'RAZORPAY_WEBHOOK_SECRET is not set')
    skip('a forged signature is rejected', 'RAZORPAY_WEBHOOK_SECRET is not set')
    console.log('\n     Re-run with --local-webhook-secret to verify the handler now,')
    console.log('     or arm the real thing:')
    console.log('       1. Razorpay Dashboard -> Settings -> Webhooks -> Add New Webhook')
    console.log('       2. Subscribe to payment.captured and payment.failed')
    console.log('       3. URL: https://<public-host>/api/v1/payment/webhook')
    console.log('          (locally: cloudflared tunnel --url http://localhost:5000)')
    console.log('       4. Copy the signing secret into RAZORPAY_WEBHOOK_SECRET and re-run')
  } else {
    const paymentId = `pay_${TAG}${Date.now().toString(36)}`
    const event = capturedEvent(paymentId, orderId, orderAmountPaise)

    const forged = await deliverWebhook(event, { signature: 'deadbeef'.repeat(8) })
    check('a forged signature is rejected', forged.status === 400, `HTTP ${forged.status}`)
    check('a forged delivery creates no booking',
      !(await db.collection('bookings').doc(`pay_${paymentId}`).get()).exists)

    const delivered = await deliverWebhook(event, { secret })
    check('a correctly signed delivery is accepted', delivered.status === 200, `HTTP ${delivered.status}`)

    const bookingRef = db.collection('bookings').doc(`pay_${paymentId}`)
    const bookingSnap = await bookingRef.get()
    check('the booking exists even though no browser came back', bookingSnap.exists)

    if (bookingSnap.exists) {
      created.bookings.push(`pay_${paymentId}`)
      const b = bookingSnap.data()

      check('the amount came from the gateway event', b.totalAmount === quote.totalAmount,
        `${b.totalAmount} vs ${quote.totalAmount}`)
      check('the booking is attributed to the order owner', b.userId === USER_ID)
      check('the booked item is the one that was priced', b.flightId === flight.id)
      check('a PNR was issued', Boolean(b.pnr))

      const seatsAfter = await seatsOf(flight.id)
      check('exactly one seat was reserved', seatsAfter === seatsBefore - 1,
        `${seatsBefore} -> ${seatsAfter}`)

      // ── Stage 5: idempotency ────────────────────────────────────────────
      stage('5. idempotency (Razorpay retries until it gets a 2xx)')

      for (let i = 0; i < 3; i++) await deliverWebhook(event, { secret })

      const dupes = await db.collection('bookings').where('paymentId', '==', paymentId).get()
      check('four deliveries produced exactly one booking', dupes.size === 1, `${dupes.size} bookings`)
      check('and reserved exactly one seat', (await seatsOf(flight.id)) === seatsBefore - 1)
    }

    // ── Stage 6: quote binding, against the real gateway ──────────────────
    stage('6. quote binding (a draft cannot switch the trip after payment)')

    const tamperedOrderId = `${orderId}_tampered`
    await db.collection('payments').doc(tamperedOrderId).set({
      orderId: tamperedOrderId,
      userId: USER_ID,
      status: 'created',
      quote: { type: 'flight', itemId: flight.id, quantity: 1, totalAmount: quote.totalAmount },
      // Priced as this flight, submitted as nine seats on it.
      bookingDraft: {
        type: 'flight',
        flightId: flight.id,
        passengers: Array.from({ length: 9 }, (_, i) => ({ name: `Extra ${i}` }))
      }
    })
    created.payments.push(tamperedOrderId)

    const tamperedPaymentId = `pay_${TAG}t${Date.now().toString(36)}`
    const tampered = await deliverWebhook(
      capturedEvent(tamperedPaymentId, tamperedOrderId, orderAmountPaise),
      { secret }
    )

    check('a tampered draft is refused', tampered.body?.rejected === 'QUOTE_MISMATCH',
      JSON.stringify(tampered.body))
    check('and creates no booking',
      !(await db.collection('bookings').doc(`pay_${tamperedPaymentId}`).get()).exists)
    check('and reserves no extra seats', (await seatsOf(flight.id)) === seatsBefore - 1)
    check('the refusal is acknowledged so Razorpay stops retrying', tampered.status === 200)
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  if (!process.argv.includes('--keep')) {
    console.log('\n  cleaning up...')
    await cleanup(flight.id, { expected: seatsBefore })
    const restored = await seatsOf(flight.id)
    check('inventory was restored', restored === seatsBefore, `${seatsBefore} -> ${restored}`)
  } else {
    console.log('\n  --keep: fixtures left in place')
    console.log('    payments:', created.payments.join(', '))
    console.log('    bookings:', created.bookings.join(', '))
  }

  banner(
    fail === 0
      ? `PAYMENT VERIFICATION PASSED — ${pass} checks${skipped ? `, ${skipped} skipped` : ''}`
      : `PAYMENT VERIFICATION FAILED — ${fail} of ${pass + fail}`
  )
  if (fail) failures.forEach((f) => console.log('  ✗ ' + f))
  if (skipped) {
    console.log(`\n  ${skipped} checks skipped — the webhook half is unarmed until`)
    console.log('  RAZORPAY_WEBHOOK_SECRET is set. That is launch gate 2.')
  }

  return fail === 0
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch(async (err) => {
    console.error('\nverify:payment crashed:', err)
    await cleanup().catch(() => {})
    process.exit(1)
  })
