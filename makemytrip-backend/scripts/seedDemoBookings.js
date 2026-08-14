#!/usr/bin/env node
/**
 * Demo booking history, so Reports and the dashboard show something.
 *
 * A fresh datastore has inventory but no bookings — nobody has bought anything
 * yet — so every revenue figure is a truthful zero. This fills in a plausible
 * few weeks of trading.
 *
 * Bookings are written through `createBookingForPayment`, the same function the
 * Razorpay webhook uses, so they reserve real dated inventory, carry a real PNR
 * and a real server-computed price, and are bound to a quote exactly as a paid
 * booking is. The only fiction is the payment authority, which no gateway ever
 * saw. Nothing here bypasses the booking path to write a document directly.
 *
 * `createdAt` is backdated afterwards rather than faked at creation: it is
 * server-set, and it is what every report groups by. Travel dates stay in the
 * future, which is both realistic (booked weeks ago, travelling soon) and what
 * makes the refund fee tiers land somewhere sensible.
 *
 * Every document written carries `isDemo: true`, which is the whole basis of
 * `--remove`. Nothing else in the codebase writes that field.
 *
 *   npm run seed:demo                # dry run — reports what it would create
 *   npm run seed:demo -- --apply     # write it
 *   npm run seed:demo -- --remove    # delete every demo record, release seats
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { quoteTrip } from '../src/services/pricingService.js'
import {
  createBookingForPayment, releaseAvailability, resolveItemId, bookedQuantity
} from '../src/services/bookingService.js'
import { openRefund, RefundStatus } from '../src/services/refundService.js'
import assertNotProduction from './lib/prodGuard.js'

const APPLY = process.argv.includes('--apply')
const REMOVE = process.argv.includes('--remove')

const banner = (t) => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70))

const DEMO_CUSTOMERS = [
  { name: 'Ananya Sharma', email: 'ananya.sharma@example.com' },
  { name: 'Rohit Verma', email: 'rohit.verma@example.com' },
  { name: 'Priya Nair', email: 'priya.nair@example.com' },
  { name: 'Imran Qureshi', email: 'imran.qureshi@example.com' },
  { name: 'Meera Iyer', email: 'meera.iyer@example.com' },
  { name: 'Karan Singh', email: 'karan.singh@example.com' }
]

const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet']

const day = 864e5
const iso = (d) => d.toISOString().slice(0, 10)
const pick = (arr, i) => arr[i % arr.length]

/**
 * How many bookings of each type, and how far back they were booked.
 *
 * Weighted the way a travel platform actually trades — flights and hotels carry
 * the volume, cabs are occasional — so the "by type" breakdown does not come out
 * as a flat five-way split that no real business has ever produced.
 */
const MIX = [
  { type: 'flight', count: 9, collection: 'flights' },
  { type: 'hotel', count: 7, collection: 'hotels' },
  { type: 'bus', count: 6, collection: 'buses' },
  { type: 'train', count: 5, collection: 'trains' },
  { type: 'cab', count: 3, collection: 'cabs' }
]

/** Booked between 2 and 44 days ago, spread out rather than clustered. */
const bookedDaysAgo = (i, total) => Math.round(2 + (42 * i) / Math.max(1, total - 1))

const idKey = (type, i) => `demo_${type}_${i}`

const buildPayload = (type, item, travelDate, customer) => {
  const base = {
    type,
    userEmail: customer.email,
    userName: customer.name,
    passengers: [{ firstName: customer.name.split(' ')[0], lastName: customer.name.split(' ')[1], type: 'adult', age: 32 }],
    fromCity: item.from ?? item.city ?? null,
    toCity: item.to ?? item.city ?? null
  }

  if (type === 'flight') return { ...base, flightId: item.id }
  if (type === 'hotel') {
    return {
      ...base,
      hotelId: item.id,
      rooms: 1,
      nights: 2,
      checkIn: travelDate,
      checkOut: iso(new Date(new Date(travelDate).getTime() + 2 * day))
    }
  }
  return { ...base, [`${type}Id`]: item.id, travelDate }
}

const createOne = async ({ type, item, index, customer, bookedAgo }) => {
  const travelDate = iso(new Date(Date.now() + (7 + (index % 21)) * day))
  const quantity = 1
  const nights = type === 'hotel' ? 2 : null

  const priced = await quoteTrip({
    type,
    itemId: item.id,
    quantity,
    ...(nights ? { nights } : {}),
    ...(type === 'cab' ? { distance: `${item.distanceKm ?? 25} km` } : {})
  })

  const paymentId = idKey(type, index)
  const authority = {
    orderId: `order_${paymentId}`,
    paymentId,
    amount: priced.totalAmount,
    method: pick(PAYMENT_METHODS, index)
  }

  await db.collection('payments').doc(paymentId).set({
    paymentId,
    orderId: authority.orderId,
    userId: customer.userId,
    status: 'captured',
    amount: priced.totalAmount,
    method: authority.method,
    isDemo: true
  })

  const { booking } = await createBookingForPayment({
    payload: buildPayload(type, item, travelDate, customer),
    quote: { type, itemId: item.id, quantity, nights, totalAmount: priced.totalAmount },
    authority,
    userId: customer.userId,
    userEmail: customer.email,
    userName: customer.name
  })

  // Backdated here because createdAt is server-set inside the booking path, and
  // every report groups by it. A Date (never an ISO string) so the field stays
  // one indexable type — a mixed-type field cannot be range-filtered at all.
  const createdAt = new Date(Date.now() - bookedAgo * day)
  await db.collection('bookings').doc(`pay_${paymentId}`).update({
    createdAt,
    updatedAt: createdAt,
    isDemo: true
  })

  return { bookingDocId: `pay_${paymentId}`, booking, createdAt, amount: priced.totalAmount }
}

/** Cancels through the same two steps the cancel endpoint performs. */
const cancelOne = async (record) => {
  const ref = db.collection('bookings').doc(record.bookingDocId)
  const snap = await ref.get()
  const booking = snap.data()

  await ref.update({
    status: 'cancelled',
    bookingStatus: 'cancelled',
    cancelledAt: record.createdAt,
    updatedAt: record.createdAt
  })

  await releaseAvailability(
    booking.type, resolveItemId(booking), bookedQuantity(booking.type, booking), booking
  ).catch(() => {})

  return booking
}

const refundOne = async (record, booking, complete) => {
  const refund = await openRefund({
    booking,
    bookingDocId: record.bookingDocId,
    userId: booking.userId,
    reason: 'Plans changed'
  })

  const patch = { createdAt: record.createdAt, updatedAt: record.createdAt, isDemo: true }
  if (complete) {
    patch.status = RefundStatus.COMPLETED
    patch.gatewayRefundId = `rfnd_${record.bookingDocId}`
  }

  await db.collection('refunds').doc(refund.id).update(patch)
  return { complete, amount: refund.refundAmount }
}

const seed = async () => {
  const customers = DEMO_CUSTOMERS.map((c, i) => ({
    ...c,
    userId: `demo_user_${i + 1}`
  }))

  if (APPLY) {
    for (const c of customers) {
      await db.collection('users').doc(c.email).set({
        id: c.userId,
        email: c.email,
        name: c.name,
        role: 'customer',
        accountStatus: 'active',
        createdAt: new Date(Date.now() - 60 * day),
        isDeleted: false,
        isDemo: true
      }, { merge: true })
    }
    console.log(`  ${customers.length} demo customers`)
  }

  const total = MIX.reduce((n, m) => n + m.count, 0)
  const created = []
  let index = 0

  for (const { type, count, collection } of MIX) {
    // Only sellable inventory, and a distinct item per booking: a cab has a
    // daily capacity of one, so reusing a vehicle on the same date would fail
    // the availability check rather than produce a second sale.
    const snap = await db.collection(collection).where('isActive', '==', true).limit(count * 2).get()
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    if (items.length < count) {
      console.log(`  ⚠️ ${type}: only ${items.length} active items available, wanted ${count}`)
    }

    for (let n = 0; n < Math.min(count, items.length); n++) {
      const customer = pick(customers, index)
      const bookedAgo = bookedDaysAgo(index, total)

      if (!APPLY) {
        console.log(`  would create ${type} for ${customer.email}, booked ${bookedAgo}d ago`)
        index++
        continue
      }

      try {
        const record = await createOne({ type, item: items[n], index, customer, bookedAgo })
        created.push({ ...record, type })
        console.log(`  ${type.padEnd(7)} ${record.booking.bookingId}  ₹${record.amount}  booked ${bookedAgo}d ago`)
      } catch (err) {
        console.log(`  ⚠️ ${type} #${n} skipped: ${err.message}`)
      }
      index++
    }
  }

  if (!APPLY) {
    console.log(`\n  dry run — ${total} bookings would be created. Re-run with --apply.`)
    return
  }

  // A trading history with no cancellations tells you nothing about whether the
  // cancellation and refund reporting works, so a slice of them are unwound.
  const toCancel = created.filter((_, i) => i % 6 === 2)
  let refundsCompleted = 0
  let refundsPending = 0

  for (const [i, record] of toCancel.entries()) {
    const booking = await cancelOne(record)
    const result = await refundOne(record, booking, i % 3 !== 0)
    if (result.complete) refundsCompleted++
    else refundsPending++
  }

  console.log(`\n  ${created.length} bookings, ${toCancel.length} cancelled`)
  console.log(`  refunds: ${refundsCompleted} completed, ${refundsPending} awaiting a decision`)
}

const remove = async () => {
  let bookings = 0
  let released = 0

  const bookingSnap = await db.collection('bookings').where('isDemo', '==', true).get()
  for (const doc of bookingSnap.docs) {
    const b = doc.data()
    // Only a live booking still holds a seat; a cancelled one gave it back at
    // cancellation, and releasing twice would invent inventory.
    if (b.status !== 'cancelled') {
      await releaseAvailability(b.type, resolveItemId(b), bookedQuantity(b.type, b), b).catch(() => {})
      released++
    }
    await doc.ref.delete()
    bookings++
  }

  const counts = { bookings, released }
  for (const collection of ['payments', 'refunds', 'users']) {
    const snap = await db.collection(collection).where('isDemo', '==', true).get()
    for (const doc of snap.docs) await doc.ref.delete()
    counts[collection] = snap.size
  }

  console.log(`  bookings deleted: ${counts.bookings} (${counts.released} seats released)`)
  console.log(`  payments deleted: ${counts.payments}`)
  console.log(`  refunds deleted:  ${counts.refunds}`)
  console.log(`  customers deleted: ${counts.users}`)
}

const main = async () => {
  assertNotProduction('This script writes demo bookings, payments and refunds.')

  if (REMOVE) {
    banner('REMOVING DEMO DATA')
    await remove()
  } else {
    banner(APPLY ? 'SEEDING DEMO BOOKINGS' : 'SEEDING DEMO BOOKINGS — DRY RUN')
    await seed()
  }

  const left = await db.collection('bookings').count().get()
  console.log(`\n  bookings in datastore: ${left.data().count}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Demo seed failed:', err)
    process.exit(1)
  })
