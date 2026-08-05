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

const { createBookingForPayment, findRecentDuplicate } = await import('../src/services/bookingService.js')
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

describe('a cab is one vehicle, booked for one date', () => {
  // Cabs used to reserve nothing at all: they were absent from
  // RESOURCE_COLLECTIONS, so every booking sold a car that was already sold.
  // A cab document is one vehicle with one driver and one plate, so it books a
  // dated slot like a bus seat — capacity 1 per day unless the operator says
  // otherwise.
  beforeEach(() => {
    reset()
    db.seed('cabs/cab_1', {
      from: 'Delhi', to: 'Agra', type: 'SUV', price: 3000, perKmRate: 12,
      capacity: 6, distanceKm: 200, isActive: true
    })
  })

  const CAB_QUOTE = { type: 'cab', itemId: 'cab_1', quantity: 1, nights: null, totalAmount: 5670 }

  const bookCab = (extra = {}, quote = CAB_QUOTE) =>
    createBookingForPayment({
      payload: { type: 'cab', cabId: 'cab_1', travelDate: '2026-09-01', ...extra },
      quote,
      authority: { orderId: 'o', paymentId: `pay_cab_${Math.random().toString(36).slice(2)}`, amount: 5670, method: 'card' },
      userId: 'user_cab'
    })

  test('booking a cab reserves the vehicle for that date', async () => {
    const { created } = await bookCab()
    assert.equal(created, true)

    const slot = db.peek('cabs/cab_1/availability/2026-09-01')
    assert.ok(slot, 'the vehicle must be held against the travel date')
    assert.equal(slot.booked, 1)
    assert.equal(slot.total, 1, 'one document is one vehicle')
  })

  test('the same cab cannot be sold twice on the same day', async () => {
    await bookCab()

    await assert.rejects(
      () => bookCab(),
      (err) => {
        assert.equal(err.code, 'INSUFFICIENT_AVAILABILITY')
        return true
      }
    )
  })

  test('the same cab is free again on a different day', async () => {
    await bookCab()
    const { created } = await bookCab({ travelDate: '2026-09-02' })
    assert.equal(created, true, 'a vehicle booked on the 1st is still free on the 2nd')
  })

  test('passenger count does not multiply vehicles', async () => {
    // `capacity: 6` is seats in the car, not six cars. Reading it as fleet size
    // would sell the same vehicle six times.
    await bookCab({ passengers: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }] })

    const slot = db.peek('cabs/cab_1/availability/2026-09-01')
    assert.equal(slot.booked, 1, 'four travellers share one car')
  })

  test('an operator can raise the daily capacity', async () => {
    db.seed('cabs/cab_fleet', {
      from: 'Delhi', to: 'Agra', price: 3000, perKmRate: 12, capacity: 6,
      dailyCapacity: 3, distanceKm: 200, isActive: true
    })

    const quote = { type: 'cab', itemId: 'cab_fleet', quantity: 1, totalAmount: 5670 }
    for (let i = 0; i < 3; i++) {
      await createBookingForPayment({
        payload: { type: 'cab', cabId: 'cab_fleet', travelDate: '2026-09-01' },
        quote,
        authority: { orderId: 'o', paymentId: `pay_fleet_${i}`, amount: 5670, method: 'card' },
        userId: 'user_cab'
      })
    }

    assert.equal(db.peek('cabs/cab_fleet/availability/2026-09-01').booked, 3)

    await assert.rejects(
      () => createBookingForPayment({
        payload: { type: 'cab', cabId: 'cab_fleet', travelDate: '2026-09-01' },
        quote,
        authority: { orderId: 'o', paymentId: 'pay_fleet_overflow', amount: 5670, method: 'card' },
        userId: 'user_cab'
      }),
      (err) => err.code === 'INSUFFICIENT_AVAILABILITY'
    )
  })

  test('a cab booking with no travel date is refused, not silently unreserved', async () => {
    await assert.rejects(
      () => createBookingForPayment({
        payload: { type: 'cab', cabId: 'cab_1' },
        quote: CAB_QUOTE,
        authority: { orderId: 'o', paymentId: 'pay_cab_nodate', amount: 5670, method: 'card' },
        userId: 'user_cab'
      }),
      (err) => err.code === 'DATE_REQUIRED'
    )
  })

  test('cabs can be quoted again', async () => {
    const quote = await quoteTrip({ type: 'cab', itemId: 'cab_1', quantity: 1, distance: 200 })
    assert.equal(quote.type, 'cab')
    assert.ok(quote.totalAmount > 0)
  })
})

describe('the same trip is not booked twice by accident', () => {
  // A double-click, a refresh mid-checkout or a back-button retry could each
  // produce a second order, a second capture and a second confirmed booking for
  // one trip. The client guard is a ref, but a client guard is advisory — this
  // is the one that cannot be bypassed.
  //
  // Deliberately time-bounded: the failure mode worth preventing is an accident,
  // not a deliberate second purchase. Blocking outright would make it impossible
  // to book a second room, or a seat for a friend, on a trip already booked.
  beforeEach(reset)

  const FLIGHT_QUOTE = { type: 'flight', itemId: 'flight_expensive', quantity: 1, totalAmount: 68000 }

  const bookFlight = (paymentId) =>
    createBookingForPayment({
      payload: {
        type: 'flight',
        flightId: 'flight_expensive',
        departureDate: '2026-09-01',
        passengers: [{ name: 'A' }]
      },
      quote: FLIGHT_QUOTE,
      authority: { orderId: 'o', paymentId, amount: 68000, method: 'card' },
      userId: 'user_dup'
    })

  test('a booking records the trip it identifies as', async () => {
    const { booking } = await bookFlight('pay_dup_1')
    assert.equal(booking.tripKey, 'flight:flight_expensive:',
      'flights carry no dated slot, so the key is type and item')
  })

  test('an identical booking made moments ago is found', async () => {
    await bookFlight('pay_dup_2')

    const dupe = await findRecentDuplicate({
      userId: 'user_dup',
      type: 'flight',
      payload: { type: 'flight', flightId: 'flight_expensive' }
    })

    assert.ok(dupe, 'the repeat must be detected before a second order is created')
  })

  test('a different traveller booking the same trip is not a duplicate', async () => {
    await bookFlight('pay_dup_3')

    const dupe = await findRecentDuplicate({
      userId: 'someone_else',
      type: 'flight',
      payload: { type: 'flight', flightId: 'flight_expensive' }
    })

    assert.equal(dupe, null)
  })

  test('a different trip is not a duplicate', async () => {
    await bookFlight('pay_dup_4')

    const dupe = await findRecentDuplicate({
      userId: 'user_dup',
      type: 'bus',
      payload: { type: 'bus', busId: 'bus_1', travelDate: '2026-09-01' }
    })

    assert.equal(dupe, null)
  })

  test('the same trip on a different date is not a duplicate', async () => {
    await createBookingForPayment({
      payload: { type: 'bus', busId: 'bus_1', travelDate: '2026-09-01' },
      quote: BUS_QUOTE,
      authority: { orderId: 'o', paymentId: 'pay_dup_5', amount: 882, method: 'card' },
      userId: 'user_dup'
    })

    const dupe = await findRecentDuplicate({
      userId: 'user_dup',
      type: 'bus',
      payload: { type: 'bus', busId: 'bus_1', travelDate: '2026-09-02' }
    })

    assert.equal(dupe, null, 'the same bus next week is a different trip')
  })

  test('an older booking of the same trip does not block a new one', async () => {
    await bookFlight('pay_dup_6')

    // Age it past the window. A booking made twenty minutes ago is a decision,
    // not a double-click, and must not stop the customer buying again.
    const path = 'bookings/pay_pay_dup_6'
    db.seed(path, { ...db.peek(path), createdAt: new Date(Date.now() - 20 * 60 * 1000) })

    const dupe = await findRecentDuplicate({
      userId: 'user_dup',
      type: 'flight',
      payload: { type: 'flight', flightId: 'flight_expensive' }
    })

    assert.equal(dupe, null, 'past the window, a deliberate repeat must be allowed through')
  })

  test('a cancelled booking does not block rebooking', async () => {
    const { booking } = await bookFlight('pay_dup_7')
    db.seed(`bookings/pay_pay_dup_7`, { ...db.peek('bookings/pay_pay_dup_7'), status: 'cancelled' })

    const dupe = await findRecentDuplicate({
      userId: 'user_dup',
      type: 'flight',
      payload: { type: 'flight', flightId: 'flight_expensive' }
    })

    assert.equal(dupe, null, `${booking.bookingId} was cancelled; the customer may book again`)
  })
})
