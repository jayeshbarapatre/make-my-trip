// A booking must be the trip its payment was priced for.
//
// Pins the hole this closes: `authority.amount` came from the gateway, so the
// price was never forgeable — but the *item* was. The booking payload alone
// decided which inventory got reserved, and nothing compared it to the quote
// recorded when the order was created. Quoting the cheapest bus seat, paying
// ₹882 for it, then posting a booking for a long-haul flight bought a confirmed
// PNR and nine real seats for bus money.
//
// The check lives in `createBookingForPayment`, which is the only function that
// writes a booking document, so every entry point inherits it: POST
// /payment/verify, the Razorpay webhook, and POST /bookings/*.

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

mock.module('../src/config/firebase.js', { namedExports: { db } })

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

const { createBookingForPayment } = await import('../src/services/bookingService.js')
const { handleWebhook } = await import('../src/controllers/paymentController.js')
const { quoteTrip } = await import('../src/services/pricingService.js')

const AUTHORITY = { orderId: 'order_qb', paymentId: 'pay_qb', amount: 882, method: 'netbanking' }

/** The bus seat that was actually quoted and paid for. */
const BUS_QUOTE = { type: 'bus', itemId: 'bus_1', quantity: 1, nights: null, totalAmount: 882 }

const book = (payload, quote = BUS_QUOTE, authority = AUTHORITY) =>
  createBookingForPayment({ payload, quote, authority, userId: 'user_qb' })

const reset = () => {
  db.records.clear()
  db.versions.clear()
  // Inventory the attacker would like to reserve for bus money.
  db.seed('flights/flight_expensive', {
    from: 'Delhi', to: 'New York', price: 68000, seatsAvailable: 40, isActive: true
  })
  db.seed('buses/bus_1', {
    from: 'Delhi', to: 'Mumbai', price: 882, seatsAvailable: 30, isActive: true
  })
  db.seed('hotels/hotel_1', {
    name: 'Fixture Inn', city: 'Goa', price: 4000, roomsAvailable: 10, isActive: true
  })
}

before(() => {
  mock.method(console, 'log', () => {})
  mock.method(console, 'warn', () => {})
  mock.method(console, 'error', () => {})
})

describe('a booking cannot switch to a trip that was not paid for', () => {
  beforeEach(reset)

  test('a flight booking against a bus quote is refused', async () => {
    await assert.rejects(
      () => book({ type: 'flight', flightId: 'flight_expensive', passengers: [{ name: 'A' }] }),
      (err) => {
        assert.equal(err.code, 'QUOTE_MISMATCH')
        assert.equal(err.status, 400)
        return true
      }
    )
  })

  test('a refused booking reserves nothing and writes nothing', async () => {
    const before = db.records.size

    await assert.rejects(() =>
      book({
        type: 'flight',
        flightId: 'flight_expensive',
        passengers: Array.from({ length: 9 }, (_, i) => ({ name: `Traveller ${i}` }))
      })
    )

    assert.equal(db.records.size, before, 'a refused booking must not write')
    assert.equal(db.records.has('bookings/pay_pay_qb'), false)
    assert.equal(db.peek('flights/flight_expensive').seatsAvailable, 40, 'no seat may be taken')
  })

  test('the same type but a different item is refused', async () => {
    db.seed('buses/bus_luxury', { from: 'Delhi', to: 'Mumbai', price: 9000, seatsAvailable: 20 })

    await assert.rejects(
      () => book({ type: 'bus', busId: 'bus_luxury', travelDate: '2026-09-01' }),
      (err) => err.code === 'QUOTE_MISMATCH'
    )
    assert.equal(db.peek('buses/bus_luxury').seatsAvailable, 20)
  })

  test('an itemId supplied under the generic key is checked too', async () => {
    await assert.rejects(
      () => book({ type: 'bus', itemId: 'bus_luxury', travelDate: '2026-09-01' }),
      (err) => err.code === 'QUOTE_MISMATCH'
    )
  })
})

describe('a booking cannot claim more than was paid for', () => {
  beforeEach(reset)

  test('more seats than the quote priced is refused', async () => {
    await assert.rejects(
      () => book({
        type: 'bus',
        busId: 'bus_1',
        travelDate: '2026-09-01',
        passengers: [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
      }),
      (err) => err.code === 'QUOTE_MISMATCH'
    )
    assert.equal(db.peek('buses/bus_1').seatsAvailable, 30)
  })

  test('an inflated seatCount is refused', async () => {
    await assert.rejects(
      () => book({ type: 'bus', busId: 'bus_1', travelDate: '2026-09-01', seatCount: 40 }),
      (err) => err.code === 'QUOTE_MISMATCH'
    )
  })

  test('more nights than the quote priced is refused', async () => {
    const quote = { type: 'hotel', itemId: 'hotel_1', quantity: 1, nights: 2, totalAmount: 8000 }

    await assert.rejects(
      () => book(
        { type: 'hotel', hotelId: 'hotel_1', rooms: 1, checkIn: '2026-09-01', checkOut: '2026-09-30' },
        quote
      ),
      (err) => err.code === 'QUOTE_MISMATCH'
    )
    assert.equal(db.peek('hotels/hotel_1').roomsAvailable, 10)
  })

  test('booking fewer seats than were paid for is allowed', async () => {
    // Infants travel on a lap: the quote prices them, the reservation does not.
    // Under-reserving is a refund question, not an attack.
    const quote = { type: 'bus', itemId: 'bus_1', quantity: 3, nights: null, totalAmount: 2646 }

    const { booking, created } = await book(
      { type: 'bus', busId: 'bus_1', travelDate: '2026-09-01', seatCount: 2 },
      quote
    )

    assert.equal(created, true)
    assert.equal(booking.bookingType, 'bus')
  })
})

describe('a matching booking still goes through', () => {
  beforeEach(reset)

  test('the trip that was quoted is booked and its seat reserved', async () => {
    const { booking, created } = await book({
      type: 'bus',
      busId: 'bus_1',
      travelDate: '2026-09-01',
      passengers: [{ name: 'Traveller One', age: '30' }]
    })

    assert.equal(created, true)
    assert.equal(booking.type, 'bus')
    assert.equal(booking.totalAmount, 882, 'the amount still comes from the gateway')
    assert.ok(booking.pnr, 'a confirmed booking carries a PNR')
    assert.equal(db.peek('buses/bus_1').seatsAvailable, 29, 'exactly one seat is taken')
  })

  test('a payment with no recorded quote is still honoured', async () => {
    // Orders created before the quote was recorded must not strand a customer
    // who has already paid; they are warned about instead.
    const { created } = await createBookingForPayment({
      payload: { type: 'bus', busId: 'bus_1', travelDate: '2026-09-01' },
      quote: null,
      authority: AUTHORITY,
      userId: 'user_qb'
    })

    assert.equal(created, true)
  })
})

describe('the webhook holds the stored draft to the same standard', () => {
  beforeEach(reset)

  const sign = (body) =>
    crypto.createHmac('sha256', WEBHOOK_SECRET).update(Buffer.from(body, 'utf8')).digest('hex')

  const deliver = async (event) => {
    const payload = JSON.stringify(event)
    let status = 200
    let body = null
    const res = {
      status (code) { status = code; return this },
      json (p) { body = p; return this }
    }
    await handleWebhook({
      body: Buffer.from(payload, 'utf8'),
      get: (h) => (h.toLowerCase() === 'x-razorpay-signature' ? sign(payload) : undefined),
      ip: '127.0.0.1',
      originalUrl: '/api/v1/payment/webhook'
    }, res)
    return { status, body }
  }

  const captured = (paymentId, orderId) => ({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: orderId,
          amount: 88200,
          currency: 'INR',
          status: 'captured',
          method: 'netbanking',
          email: 'traveller@example.com'
        }
      }
    }
  })

  test('a draft that does not match its quote creates no booking', async () => {
    db.seed('payments/order_tampered', {
      orderId: 'order_tampered',
      userId: 'user_qb',
      amount: 882,
      status: 'created',
      quote: BUS_QUOTE,
      // Priced as a bus seat at create-order time, submitted as a flight.
      bookingDraft: { type: 'flight', flightId: 'flight_expensive', userEmail: 't@example.com' }
    })

    const { body } = await deliver(captured('pay_tampered', 'order_tampered'))

    assert.equal(db.records.has('bookings/pay_pay_tampered'), false)
    assert.equal(db.peek('flights/flight_expensive').seatsAvailable, 40)
    assert.equal(body.rejected, 'QUOTE_MISMATCH')
  })

  test('a rejected delivery is acknowledged so Razorpay stops retrying', async () => {
    db.seed('payments/order_tampered2', {
      orderId: 'order_tampered2',
      userId: 'user_qb',
      amount: 882,
      status: 'created',
      quote: BUS_QUOTE,
      bookingDraft: { type: 'flight', flightId: 'flight_expensive' }
    })

    const { status } = await deliver(captured('pay_tampered2', 'order_tampered2'))

    // A mismatch is permanent — a retry fails identically and only buries the
    // audit trail. The captured payment is left for reconciliation to refund.
    assert.equal(status, 200)
  })

  test('a draft that matches its quote is booked as before', async () => {
    db.seed('payments/order_clean', {
      orderId: 'order_clean',
      userId: 'user_qb',
      amount: 882,
      status: 'created',
      quote: BUS_QUOTE,
      bookingDraft: {
        type: 'bus',
        busId: 'bus_1',
        travelDate: '2026-09-01',
        userEmail: 'traveller@example.com'
      }
    })

    const { status, body } = await deliver(captured('pay_clean', 'order_clean'))

    assert.equal(status, 200)
    assert.ok(body.bookingId)
    assert.ok(db.peek('bookings/pay_pay_clean'))
  })
})

describe('a vertical that reserves no inventory cannot be sold', () => {
  // Cabs are absent from RESOURCE_COLLECTIONS, so a cab booking reserves
  // nothing and sells without limit — every one sold is a promise with no
  // vehicle behind it. quoteTrip is the chokepoint: no quote means no signed
  // token, which means create-order refuses, which means there is no captured
  // payment for a booking to be built from.
  beforeEach(reset)

  test('a cab cannot be quoted', async () => {
    db.seed('cabs/cab_1', { from: 'Delhi', to: 'Agra', price: 3000, perKmRate: 12, isActive: true })

    await assert.rejects(
      () => quoteTrip({ type: 'cab', itemId: 'cab_1', quantity: 1, distance: 200 }),
      (err) => {
        assert.equal(err.code, 'VERTICAL_UNAVAILABLE')
        assert.equal(err.status, 503)
        return true
      }
    )
  })

  test('the refusal happens before any inventory is read', async () => {
    // No cab document exists here at all. A 503 rather than a 404 proves the
    // gate closed first, so a closed vertical costs no Firestore read.
    await assert.rejects(
      () => quoteTrip({ type: 'cab', itemId: 'cab_missing', quantity: 1, distance: 10 }),
      (err) => err.code === 'VERTICAL_UNAVAILABLE'
    )
  })

  test('an open vertical still quotes', async () => {
    const quote = await quoteTrip({ type: 'bus', itemId: 'bus_1', quantity: 1 })
    assert.equal(quote.type, 'bus')
    assert.ok(quote.totalAmount > 0, 'a sellable vertical must still price')
  })
})
