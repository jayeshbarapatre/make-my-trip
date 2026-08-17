import { FieldValue } from 'firebase-admin/firestore'
import { now, toMillis } from '../utils/time.js'
import { db } from '../config/firebase.js'
import { generateBookingId, generatePNR } from '../utils/idGenerator.js'
import { redeemCoupon } from '../controllers/couponController.js'
import {
  DATED_TYPES,
  ALWAYS_DATED,
  isDated,
  travelDatesFor,
  travelClassFor,
  reserveDatedInTx,
  releaseDatedInTx
} from './availability.js'

// The single place a booking document is ever created.
//
// Both entry points (POST /payment/verify and POST /bookings/*) funnel through
// here so there is exactly one definition of what a confirmed booking is. The
// previous split let the /bookings path create bookings that were marked paid
// without any payment existing, priced from a client-supplied `totalAmount`.

export const BOOKING_TYPES = new Set(['flight', 'hotel', 'bus', 'train', 'cab'])

// Fields the server owns outright. A client that sends any of these is ignored,
// rather than being allowed to overwrite ownership, price or payment state.
const SERVER_OWNED_FIELDS = new Set([
  'id',
  'userId',
  'bookingId',
  'pnr',
  'totalAmount',
  'status',
  'bookingStatus',
  'paymentStatus',
  'paymentId',
  'orderId',
  'transactionId',
  'paymentMethod',
  'fareBreakdownVerified',
  'baseFare',
  'taxes',
  'convenience',
  'gst',
  'discount',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'isDeleted',
  'cancelledAt',
  'refundId',
  'refundAmount',
  'vendorPayout',
  'commission'
])

/** Strips every server-owned key so client input can only ever add trip detail. */
export const sanitizeBookingDetails = (payload = {}) => {
  const clean = {}
  for (const [key, value] of Object.entries(payload)) {
    if (SERVER_OWNED_FIELDS.has(key)) continue
    if (value === undefined) continue
    clean[key] = value
  }
  return clean
}

/**
 * A client-supplied fare breakdown is only trustworthy if it reconciles with the
 * amount the gateway actually captured. If it doesn't, keep the authoritative
 * total and drop the breakdown rather than invent one.
 */
export const reconcileBreakdown = (payload, authoritativeTotal) => {
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  const hasBreakdown = ['baseFare', 'taxes', 'convenience', 'gst', 'discount']
    .some((k) => payload?.[k] !== undefined && payload?.[k] !== null)

  if (!hasBreakdown) return null

  const baseFare = num(payload.baseFare)
  const taxes = num(payload.taxes)
  const convenience = num(payload.convenience)
  const gst = num(payload.gst)
  const discount = num(payload.discount)
  const sum = baseFare + taxes + convenience + gst - discount

  // Allow a rupee of slack for rounding differences between client and gateway.
  if (Math.abs(sum - authoritativeTotal) > 1) return null

  return { baseFare, taxes, convenience, gst, discount }
}

const RESOURCE_COLLECTIONS = {
  flight: 'flights',
  hotel: 'hotels',
  bus: 'buses',
  train: 'trains',
  cab: 'cabs'
}

const availabilityField = (type, data) =>
  type === 'hotel'
    ? (data.roomsAvailable !== undefined ? 'roomsAvailable' : 'rooms')
    : (data.seatsAvailable !== undefined ? 'seatsAvailable' : 'seats')

/**
 * Atomically reserves seats/rooms. Skips silently when the booked item is not a
 * Firestore document (live third-party API results carry no local inventory).
 */
export const reserveAvailability = async (type, itemId, quantity, payload = {}) => {
  const collection = RESOURCE_COLLECTIONS[type]
  if (!collection || !itemId || typeof itemId !== 'string') return { applied: false }

  const ref = db.collection(collection).doc(itemId)

  return db.runTransaction(async (tx) => reserveAvailabilityInTx(tx, type, ref, quantity, payload))
}

/**
 * Check-and-decrement availability INSIDE a caller's transaction, so a booking
 * and its seat reservation commit (or fail) together. This closes the
 * overbooking window that existed when reservation ran in a separate
 * transaction after the booking was already committed.
 *
 * Returns { applied, field, remaining }, or throws INSUFFICIENT_AVAILABILITY.
 */
const reserveAvailabilityInTx = async (tx, type, ref, quantity, payload = {}) => {
  const doc = await tx.get(ref)
  if (!doc.exists) return { applied: false }

  const data = doc.data()

  // Migrated inventory is reserved per travel date. The legacy branch below is
  // kept for items the backfill has not reached yet, so a partially migrated
  // collection keeps selling instead of failing.
  if (DATED_TYPES.has(type) && (isDated(data) || ALWAYS_DATED.has(type))) {
    const dates = travelDatesFor(type, payload)
    const classCode = travelClassFor(type, payload)

    const result = await reserveDatedInTx(tx, {
      itemRef: ref,
      item: data,
      type,
      dates,
      quantity,
      classCode,
      now: now()
    })

    return { ...result, dated: true, classCode }
  }

  const field = availabilityField(type, data)
  const available = data[field]
  if (typeof available !== 'number') return { applied: false }

  if (available < quantity) {
    const err = new Error(type === 'hotel'
      ? `Only ${available} room(s) left for this hotel`
      : `Only ${available} seat(s) left`)
    err.code = 'INSUFFICIENT_AVAILABILITY'
    throw err
  }

  tx.update(ref, { [field]: available - quantity, updatedAt: now() })
  return { applied: true, field, remaining: available - quantity, dated: false }
}

/**
 * Returns reserved inventory to the pool on cancellation. Without this, every
 * cancelled booking permanently removed a seat from sale.
 */
export const releaseAvailability = async (type, itemId, quantity, payload = {}) => {
  const collection = RESOURCE_COLLECTIONS[type]
  if (!collection || !itemId || typeof itemId !== 'string' || !(quantity > 0)) {
    return { applied: false }
  }

  const ref = db.collection(collection).doc(itemId)

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref)
    if (!doc.exists) return { applied: false }

    const data = doc.data()

    // Mirror of the reserve path: dated inventory is returned to the exact
    // nights it was taken from, so cancelling a January stay cannot free a
    // room in July. The ALWAYS_DATED arm must match the reserve branch exactly
    // — reserving per date and releasing to a legacy counter would strand the
    // slot forever.
    if (DATED_TYPES.has(type) && (isDated(data) || ALWAYS_DATED.has(type))) {
      // A booking stored before the migration carries no travel dates. Guessing
      // which nights to credit would corrupt unrelated dates, so leave it for
      // the operator rather than restoring the wrong ones.
      let dates
      try {
        dates = travelDatesFor(type, payload)
      } catch {
        console.warn(`⚠️ ${type} ${itemId}: cancellation carries no travel dates; dated inventory not restored`)
        return { applied: false, dated: true, reason: 'MISSING_TRAVEL_DATES' }
      }

      const result = await releaseDatedInTx(tx, {
        itemRef: ref,
        item: data,
        type,
        dates,
        quantity,
        classCode: travelClassFor(type, payload),
        now: now()
      })
      return { ...result, dated: true }
    }

    const field = availabilityField(type, data)
    if (typeof data[field] !== 'number') return { applied: false }

    tx.update(ref, {
      [field]: data[field] + quantity,
      updatedAt: now()
    })
    return { applied: true, field, restored: quantity, dated: false }
  })
}

export const bookedQuantity = (type, body = {}) => {
  // An explicit seatCount is authoritative (e.g. flight bookings price
  // non-infant seats but still carry infants in `passengers`; without this the
  // roster length would over-decrement seat availability by the infant count).
  const explicit = parseInt(body.seatCount, 10)
  if (Number.isFinite(explicit) && explicit > 0) return explicit

  // A cab books whole vehicles. Falling through to the passenger count below
  // would reserve one car per traveller — four seats in a four-seater would
  // take four cars off the road.
  if (type === 'cab') return Math.max(1, parseInt(body.vehicles ?? body.quantity, 10) || 1)

  if (type === 'hotel') return Math.max(1, parseInt(body.rooms, 10) || 1)
  // Infants travel on an adult's lap and are not charged a seat, so exclude
  // them from the seat reservation count.
  const passengerList = Array.isArray(body.passengers) ? body.passengers
    : Array.isArray(body.travellers?.passengers) ? body.travellers.passengers
    : []
  if (passengerList.length) {
    const seated = passengerList.filter((p) => {
      const t = String(p?.type || p?.passengerType || '').toLowerCase()
      return t !== 'infant' && t !== 'lap'
    })
    return Math.max(1, seated.length || 1)
  }
  return Math.max(1, parseInt(body.passengerCount, 10) || 1)
}

/**
 * Identifies "the same trip" for duplicate detection: one traveller, one item,
 * one departure date.
 *
 * Three equality filters query without a composite index, which is why this is
 * denormalised onto the booking rather than reconstructed from its parts at
 * read time.
 */
export const tripKeyOf = (type, payload = {}) => {
  const itemId = resolveItemId(payload)
  if (!itemId) return null

  let date = ''
  try {
    // Hotels span nights; the first one identifies the stay.
    date = travelDatesFor(type, payload)[0] ?? ''
  } catch {
    date = ''
  }

  return `${type}:${itemId}:${date}`
}

export const resolveItemId = (payload = {}) =>
  payload.flightId || payload.hotelId || payload.busId ||
  payload.trainId || payload.cabId || payload.itemId || null

/** How long an identical confirmed booking blocks another attempt. */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000

/**
 * Finds a confirmed booking this user already holds for the same trip.
 *
 * Deliberately time-bounded. The failure mode worth preventing is an accidental
 * repeat — a double-click, a refresh mid-checkout, a back-button retry — not a
 * deliberate second purchase. Blocking outright would make it impossible to
 * book a second room, or a seat for someone else, on a trip already booked;
 * ten minutes catches the accident and lets the intent through.
 *
 * Bookings written before `tripKey` existed simply do not match, so this can
 * only ever be over-permissive, never wrongly blocking.
 *
 * @returns {Promise<{bookingId: string, id: string}|null>}
 */
export const findRecentDuplicate = async ({ userId, type, payload, windowMs = DUPLICATE_WINDOW_MS }) => {
  const tripKey = tripKeyOf(type, payload)
  if (!userId || !tripKey) return null

  // Three equality filters — Firestore merges single-field indexes, so this
  // needs no composite. The time window is applied in memory because adding a
  // range filter here would require one.
  const snap = await db.collection('bookings')
    .where('userId', '==', userId)
    .where('tripKey', '==', tripKey)
    .where('status', '==', 'confirmed')
    .limit(5)
    .get()

  const cutoff = Date.now() - windowMs

  for (const doc of snap.docs) {
    const data = doc.data()
    if (data.isDeleted === true) continue
    const createdMs = toMillis(data.createdAt)
    if (Number.isFinite(createdMs) && createdMs >= cutoff) {
      return { id: doc.id, bookingId: data.bookingId ?? doc.id }
    }
  }

  return null
}

const authorityError = (message, code, status = 400) => {
  const err = new Error(message)
  err.code = code
  err.status = status
  return err
}

/**
 * Establishes what was actually paid, from the payment record written by the
 * verified-payment path. This is the only accepted source of a booking's value:
 * a caller cannot state its own price.
 */
export const loadPaymentAuthority = async ({ orderId, paymentId, userId }) => {
  if (!orderId && !paymentId) {
    throw authorityError(
      'A verified payment is required before a booking can be created',
      'PAYMENT_REQUIRED',
      402
    )
  }

  let snap = null

  if (orderId) {
    const byOrder = await db.collection('payments').doc(String(orderId)).get()
    if (byOrder.exists) snap = byOrder
  }

  if (!snap && paymentId) {
    const byPayment = await db.collection('payments')
      .where('paymentId', '==', String(paymentId))
      .limit(1)
      .get()
    if (!byPayment.empty) snap = byPayment.docs[0]
  }

  if (!snap) {
    throw authorityError('No payment found for this booking', 'PAYMENT_NOT_FOUND', 402)
  }

  const payment = snap.data()

  if (payment.userId && payment.userId !== userId) {
    throw authorityError('This payment belongs to another account', 'PAYMENT_OWNER_MISMATCH', 403)
  }

  if (paymentId && payment.paymentId && payment.paymentId !== String(paymentId)) {
    throw authorityError('Payment does not match this order', 'PAYMENT_MISMATCH', 400)
  }

  // `status` is written from the gateway's own response by verifyPayment.
  if (!['captured', 'authorized'].includes(payment.status)) {
    throw authorityError(
      `Payment is not complete (status: ${payment.status ?? 'unknown'})`,
      'PAYMENT_NOT_CAPTURED',
      402
    )
  }

  const amount = Number(payment.amountCaptured ?? payment.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw authorityError('Payment has no captured amount', 'PAYMENT_NO_AMOUNT', 402)
  }

  return {
    orderId: payment.orderId ?? String(orderId ?? ''),
    paymentId: payment.paymentId ?? (paymentId ? String(paymentId) : null),
    amount,
    method: payment.method ?? 'razorpay',
    // The trip this payment was priced for. `createBookingForPayment` refuses a
    // booking that does not match it.
    quote: payment.quote ?? null
  }
}

/** Nights the payload actually books, or null when it does not say. */
const nightsBooked = (type, payload) => {
  if (type !== 'hotel') return null
  try {
    return travelDatesFor(type, payload).length
  } catch {
    return null
  }
}

/**
 * The trip a booking claims must be the trip its payment was priced for.
 *
 * `authority.amount` comes from the gateway, so the price was never forgeable —
 * but the *item* was. `payload` alone decided which inventory got reserved and
 * nothing compared it to the quote the customer actually paid against, so
 * quoting the cheapest bus seat, paying for it, then submitting a booking for a
 * long-haul flight bought a confirmed PNR and nine real seats for bus money.
 *
 * Quantity and nights are capped rather than pinned: booking less than was paid
 * for is a refund question, not an attack, and flight payloads legitimately
 * reserve fewer seats than they price (infants travel on a lap).
 */
const assertMatchesQuote = ({ quote, type, itemId, quantity, nights }) => {
  const mismatch = (detail) =>
    authorityError(
      `This booking does not match the trip that was paid for (${detail})`,
      'QUOTE_MISMATCH'
    )

  if (quote.type && quote.type !== type) throw mismatch('different type')

  if (quote.itemId && String(quote.itemId) !== String(itemId ?? '')) {
    throw mismatch('different item')
  }

  const paidUnits = Number(quote.quantity)
  if (Number.isFinite(paidUnits) && paidUnits > 0 && quantity > paidUnits) {
    throw mismatch(`${paidUnits} paid for, ${quantity} requested`)
  }

  const paidNights = Number(quote.nights)
  if (Number.isFinite(paidNights) && paidNights > 0 && nights !== null && nights > paidNights) {
    throw mismatch(`${paidNights} nights paid for, ${nights} requested`)
  }
}

/**
 * Creates (or returns the existing) booking for a verified payment.
 *
 * Keyed deterministically on the gateway payment id, so a retry, a double-click
 * or two concurrent requests all resolve to the same booking document instead of
 * charging once and booking twice.
 */
export const createBookingForPayment = async ({
  payload = {},
  authority,
  userId,
  userEmail = null,
  userName = null,
  quote = null
}) => {
  const type = BOOKING_TYPES.has(payload.type) ? payload.type : 'flight'
  const details = sanitizeBookingDetails(payload)
  let breakdown = reconcileBreakdown(payload, authority.amount)
  
  if (!breakdown && quote) {
    breakdown = {
      baseFare: quote.baseFare || 0,
      taxes: quote.taxes || 0,
      convenience: quote.convenience || 0,
      gst: quote.gst || 0,
      discount: quote.discount || 0
    }
  }

  const key = authority.paymentId ?? authority.orderId
  const bookingRef = db.collection('bookings').doc(`pay_${key}`)

  // Resolve the inventory target up-front so the reservation can run inside the
  // same transaction as the booking write (atomic: no seat without a booking,
  // no booking without a seat).
  const itemId = resolveItemId(payload)
  const quantity = bookedQuantity(type, payload)

  // Runs before anything is written, so a mismatched booking reserves no seat.
  if (quote) {
    assertMatchesQuote({ quote, type, itemId, quantity, nights: nightsBooked(type, payload) })
  } else {
    console.warn(
      `⚠️ ${authority.paymentId ?? authority.orderId}: payment carries no stored quote — ` +
      'item and quantity could not be verified against what was paid for'
    )
  }

  const inventoryCollection = RESOURCE_COLLECTIONS[type]
  const inventoryRef = itemId && inventoryCollection
    ? db.collection(inventoryCollection).doc(itemId)
    : null

  const { booking, created, reservation } = await db.runTransaction(async (tx) => {
    const existing = await tx.get(bookingRef)
    if (existing.exists) {
      return { booking: { id: existing.id, ...existing.data() }, created: false, reservation: { applied: false } }
    }

    const doc = {
      ...details,
      bookingId: generateBookingId(type),
      pnr: generatePNR(type),
      userId,
      type,
      bookingType: type,
      // Denormalised so `findRecentDuplicate` can match on three equality
      // filters, which Firestore serves without a composite index.
      tripKey: tripKeyOf(type, payload),
      totalAmount: authority.amount,
      ...(breakdown ?? {}),
      fareBreakdownVerified: breakdown !== null,
      status: 'confirmed',
      bookingStatus: 'confirmed',
      paymentStatus: 'completed',
      paymentId: authority.paymentId,
      orderId: authority.orderId,
      transactionId: authority.paymentId ?? authority.orderId,
      paymentMethod: authority.method,
      userEmail: userEmail ?? null,
      userName: userName ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: userId,
      updatedBy: userId,
      isDeleted: false
    }

    // Reserve inventory atomically with the booking. If there is no seat left,
    // this throws INSUFFICIENT_AVAILABILITY and the whole transaction (booking
    // included) is aborted — so a customer is never charged for a seat that
    // does not exist.
    let reservation = { applied: false }
    if (inventoryRef) {
      // The payload carries the travel dates, so dated inventory is taken from
      // the nights actually being booked.
      reservation = await reserveAvailabilityInTx(tx, type, inventoryRef, quantity, payload)
    }

    tx.set(bookingRef, doc)
    return { booking: { id: bookingRef.id, ...doc }, created: true, reservation }
  })

  // If we somehow reach here with a new booking but no reservation (e.g. the
  // item had no numeric availability field), flag it for review rather than
  // silently leaving inventory untracked.
  if (created && inventoryRef && !reservation.applied) {
    await bookingRef.update({
      availabilityWarning: 'Inventory item had no reservable availability field',
      needsOperationsReview: true,
      updatedAt: FieldValue.serverTimestamp()
    }).catch(() => {})
    console.warn(`⚠️ ${booking.bookingId}: no reservable availability on ${itemId}`)
  }

  // Record a coupon redemption only once, for a genuinely new booking, so an
  // idempotent retry cannot double-count usage. A failure here must not undo
  // the booking — the customer has paid — so it is logged, not thrown.
  if (created && payload.couponCode) {
    try {
      await redeemCoupon({ code: payload.couponCode, userId, bookingId: booking.bookingId })
    } catch (err) {
      console.warn(`⚠️ Coupon redemption for ${booking.bookingId} (${payload.couponCode}): ${err.message}`)
    }
  }

  return { booking, created, reservation }
}
