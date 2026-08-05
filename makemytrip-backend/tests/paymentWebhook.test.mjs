// Razorpay webhook ingestion (M11).
//
// Pins the hole this closes: payment state was only learned when the customer's
// browser returned to POST /payment/verify. Close the tab after paying and the
// money is captured with no booking, no error, and nothing on the platform that
// notices. The webhook is the only reliable source of payment truth.
//
// The datastore and the gateway are both faked. These assertions are about our
// signature handling, idempotency and booking attribution — none of which
// should require a network round trip or burn Firestore quota to verify.

import 'dotenv/config'

import { test, describe, mock, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'

import { newDb } from './fakeFirestore.mjs'

const WEBHOOK_SECRET = 'whsec_test_only_not_a_real_secret'
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_harness'
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'harness_secret'

const db = newDb()

// FieldValue.serverTimestamp() is a sentinel the fake store cannot resolve;
// a plain Date keeps the written documents inspectable.
mock.module('../src/config/firebase.js', { namedExports: { db } })
// Replacing the module wholesale drops every other export, and src/utils/time.js
// imports Timestamp — so it has to be stubbed too, not just FieldValue.
class FakeTimestamp {
  constructor (date) { this._date = date }
  static now () { return new FakeTimestamp(new Date()) }
  static fromDate (d) { return new FakeTimestamp(d) }
  toDate () { return this._date }
  toMillis () { return this._date.getTime() }
}

mock.module('firebase-admin/firestore', {
  namedExports: {
    Timestamp: FakeTimestamp,
    FieldValue: { serverTimestamp: () => new Date(), increment: (n) => n }
  }
})
mock.module('../src/services/emailService.js', {
  namedExports: { sendBookingConfirmationEmail: async () => ({ sent: true }) }
})

const { handleWebhook } = await import('../src/controllers/paymentController.js')

const sign = (body) =>
  crypto.createHmac('sha256', WEBHOOK_SECRET).update(Buffer.from(body, 'utf8')).digest('hex')

/** Runs the handler the way the raw-body route does, returning {status, body}. */
const deliver = async (event, opts = {}) => {
  const payload = opts.raw ?? JSON.stringify(event)
  // `signature: null` means "send no header at all"; omitting the key means
  // "sign it correctly". `??` collapsed those two, so the missing-header case
  // was silently signing and asserting nothing.
  const sig = 'signature' in opts ? opts.signature : sign(payload)

  let status = 200
  let body = null
  const res = {
    status (code) { status = code; return this },
    json (payload) { body = payload; return this }
  }
  const req = {
    body: Buffer.from(payload, 'utf8'),
    get: (h) => (h.toLowerCase() === 'x-razorpay-signature' ? (sig ?? undefined) : undefined),
    ip: '127.0.0.1',
    originalUrl: '/api/v1/payment/webhook'
  }

  await handleWebhook(req, res)
  return { status, body }
}

const capturedEvent = (paymentId, orderId, amountPaise = 88200) => ({
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
        email: 'traveller@example.com'
      }
    }
  }
})

/** An order recorded by POST /create-order, with the traveller draft attached. */
const seedOrder = (orderId, userId = 'user_webhook_1') => {
  db.seed(`payments/${orderId}`, {
    orderId,
    userId,
    amount: 882,
    currency: 'INR',
    status: 'created',
    provider: 'razorpay',
    quote: { type: 'bus', itemId: 'bus_1', quantity: 1, nights: null, totalAmount: 882 },
    bookingDraft: {
      type: 'bus',
      busId: 'bus_1',
      fromCity: 'Delhi',
      toCity: 'Mumbai',
      departureDate: '2026-09-01',
      passengers: [{ name: 'Traveller One', age: '30', gender: 'Male', seat: 1 }],
      userEmail: 'traveller@example.com',
      userName: 'Traveller One'
    }
  })
}

const reset = () => {
  db.records.clear()
  db.versions.clear()
}

before(() => {
  mock.method(console, 'log', () => {})
  mock.method(console, 'warn', () => {})
  mock.method(console, 'error', () => {})
})

describe('signature verification', () => {
  beforeEach(reset)

  test('a payload signed with the webhook secret is accepted', async () => {
    seedOrder('order_ok')
    const { status, body } = await deliver(capturedEvent('pay_ok', 'order_ok'))

    assert.equal(status, 200)
    assert.equal(body.success, true)
    assert.equal(body.handled, 'payment.captured')
  })

  test('a wrong signature is rejected and writes nothing', async () => {
    seedOrder('order_bad')
    const before = db.records.size

    const { status, body } = await deliver(capturedEvent('pay_bad', 'order_bad'), {
      signature: 'deadbeef'.repeat(8)
    })

    assert.equal(status, 400)
    assert.match(body.message, /signature/i)
    assert.equal(db.records.size, before, 'a forged delivery must not write')
    assert.equal(db.records.has('bookings/pay_pay_bad'), false)
  })

  test('a missing signature is rejected', async () => {
    const { status } = await deliver(capturedEvent('pay_nosig', 'order_nosig'), { signature: null })
    assert.equal(status, 400)
  })

  test('a signature over different bytes is rejected', async () => {
    seedOrder('order_tamper')
    // Signed correctly, then the amount was edited in flight.
    const original = JSON.stringify(capturedEvent('pay_t', 'order_tamper', 88200))
    const tampered = JSON.stringify(capturedEvent('pay_t', 'order_tamper', 1))

    const { status } = await deliver(null, { raw: tampered, signature: sign(original) })

    assert.equal(status, 400)
    assert.equal(db.records.has('bookings/pay_pay_t'), false)
  })
})

describe('abandoned checkout', () => {
  beforeEach(reset)

  test('a captured payment creates the booking even though the browser never returned', async () => {
    seedOrder('order_abandoned', 'user_abandoned')

    const { status, body } = await deliver(capturedEvent('pay_abandoned', 'order_abandoned'))

    assert.equal(status, 200)

    const booking = db.peek('bookings/pay_pay_abandoned')
    assert.ok(booking, 'the webhook must write the booking the browser never asked for')
    assert.equal(booking.userId, 'user_abandoned', 'booking must be attributed to the order owner')
    assert.equal(booking.bookingType ?? booking.type, 'bus')
    assert.equal(booking.paymentId, 'pay_abandoned')
    assert.ok(body.bookingId, 'the customer needs a reference')
  })

  test('the amount comes from the gateway, not the stored draft', async () => {
    seedOrder('order_amount', 'user_amount')
    // Gateway captured 999.00 even though the order recorded 882.
    await deliver(capturedEvent('pay_amount', 'order_amount', 99900))

    const booking = db.peek('bookings/pay_pay_amount')
    assert.equal(booking.totalAmount, 999)
  })

  test('traveller details from the draft survive onto the booking', async () => {
    seedOrder('order_draft', 'user_draft')
    await deliver(capturedEvent('pay_draft', 'order_draft'))

    const booking = db.peek('bookings/pay_pay_draft')
    assert.equal(booking.fromCity, 'Delhi')
    assert.equal(booking.toCity, 'Mumbai')
    assert.equal(booking.passengers?.[0]?.name, 'Traveller One')
  })
})

describe('idempotency', () => {
  beforeEach(reset)

  test('five identical deliveries create exactly one booking', async () => {
    seedOrder('order_replay', 'user_replay')
    const event = capturedEvent('pay_replay', 'order_replay')

    for (let i = 0; i < 5; i++) {
      const { status } = await deliver(event)
      assert.equal(status, 200, `delivery ${i + 1} should be accepted`)
    }

    const bookingDocs = [...db.records.keys()].filter((p) =>
      p.startsWith('bookings/') && !p.slice('bookings/'.length).includes('/'))

    assert.equal(bookingDocs.length, 1, `expected 1 booking, found ${bookingDocs.length}`)
    assert.equal(bookingDocs[0], 'bookings/pay_pay_replay')
  })

  test('a booking already written by the browser return is left alone', async () => {
    seedOrder('order_raced', 'user_raced')
    db.seed('bookings/pay_pay_raced', {
      bookingId: 'MMT-BS-BROWSER',
      userId: 'user_raced',
      bookingType: 'bus',
      totalAmount: 882,
      status: 'confirmed'
    })

    const { status, body } = await deliver(capturedEvent('pay_raced', 'order_raced'))

    assert.equal(status, 200)
    assert.equal(body.bookingId, 'MMT-BS-BROWSER', 'the webhook must not overwrite the existing booking')
    assert.equal(db.peek('bookings/pay_pay_raced').bookingId, 'MMT-BS-BROWSER')
  })
})

describe('non-booking events', () => {
  beforeEach(reset)

  test('payment.failed records the failure and creates no booking', async () => {
    seedOrder('order_failed', 'user_failed')

    const event = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_failed',
            order_id: 'order_failed',
            amount: 88200,
            status: 'failed',
            error_description: 'Card declined'
          }
        }
      }
    }

    const { status } = await deliver(event)

    assert.equal(status, 200)
    assert.equal(db.records.has('bookings/pay_pay_failed'), false, 'a failed payment must not book')
    assert.equal(db.peek('payments/order_failed').status, 'failed')
  })

  test('an unrelated event is acknowledged without action', async () => {
    const { status, body } = await deliver({
      event: 'refund.processed',
      payload: { payment: { entity: { id: 'pay_x', order_id: 'order_x', amount: 100 } } }
    })

    assert.equal(status, 200, 'a non-2xx makes Razorpay retry an event we will never handle')
    assert.equal(body.ignored, 'refund.processed')
  })

  test('a captured payment with no recorded order is flagged, not invented', async () => {
    const { status, body } = await deliver(capturedEvent('pay_orphan', 'order_missing'))

    assert.equal(status, 200)
    assert.equal(body.orphan, true)
    assert.equal(db.records.has('bookings/pay_pay_orphan'), false,
      'without an owner there is nobody to attribute a booking to')
  })
})
