import jwt from 'jsonwebtoken'
import { db } from '../config/firebase.js'
import { isSellable } from '../config/verticals.js'
import { evaluateCoupon } from '../controllers/couponController.js'

// The authoritative price of a trip. Nothing else in the platform is allowed to
// decide what something costs.
//
// Previously every payment page computed its own total (with rates that
// disagreed — 0.8/0.15/0.05 on one page, 0.18 on another, and a hardcoded ₹4699
// fallback on a third) and posted that figure to the payment endpoint, which
// accepted it verbatim. A caller could therefore pay ₹1 for any trip.
//
// A quote is returned with a short-lived signed token. The order endpoint
// re-prices from the token rather than trusting an amount on the request, so the
// figure the customer was shown is exactly the figure they are charged.

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.')
}

const QUOTE_SECRET = process.env.JWT_SECRET
const QUOTE_TTL_SECONDS = 15 * 60

const CATALOG = {
  flight: { collection: 'flights', unit: 'passenger' },
  hotel: { collection: 'hotels', unit: 'room-night' },
  bus: { collection: 'buses', unit: 'passenger' },
  train: { collection: 'trains', unit: 'passenger' },
  cab: { collection: 'cabs', unit: 'trip' }
}

// GST slabs applied to the base fare, and the platform convenience fee per unit.
// Rates live here so a change lands everywhere at once.
const TAX_POLICY = {
  flight: { gstRate: 0.05, conveniencePerUnit: 200 },
  hotel: { gstRate: 0.12, conveniencePerUnit: 0 },
  bus: { gstRate: 0.05, conveniencePerUnit: 30 },
  train: { gstRate: 0.05, conveniencePerUnit: 20 },
  cab: { gstRate: 0.05, conveniencePerUnit: 25 }
}

const MAX_UNITS = { flight: 9, hotel: 1500, bus: 50, train: 10, cab: 4 }
const MAX_NIGHTS = 90
const MAX_TRIP_KM = 2000

// Cab fares are base + per-km, matching the admin form ("Base Fare" and "Per KM
// Rate"). `price` carries the base fare — cabAdminController normalises
// `baseFare` onto it. Cabs seeded without a perKmRate are simply flat-fare.
//
// This settles a three-way disagreement about what `price` meant: the admin form
// called it a base fare, an unrouted getCabAvailability handler multiplied it by
// a hardcoded 10km as though it were a per-km rate (that handler has been
// deleted), and pricing treated it as the entire fare.
const cabBaseFare = (item, distanceKm) => {
  const base = Number(item.price) || 0
  const perKm = Number(item.perKmRate) || 0
  return Math.round(base + perKm * distanceKm)
}

/** Accepts "25 km", "25", 25 — anything a listing or the UI might carry. */
export const parseDistanceKm = (value) => {
  if (value === null || value === undefined) return 0
  const n = parseFloat(String(value).replace(/[^\d.]/g, ''))
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(n, MAX_TRIP_KM)
}

const priceError = (message, code, status = 400) => {
  const err = new Error(message)
  err.code = code
  err.status = status
  return err
}

const unitPriceOf = (item) => {
  const candidates = [item.price, item.pricePerNight, item.fare, item.basePrice]
  const found = candidates.find((v) => Number.isFinite(Number(v)) && Number(v) > 0)
  return found === undefined ? null : Number(found)
}

const positiveInt = (value, fallback = 1) => {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * Prices a trip from stored inventory.
 *
 * @returns {{type, itemId, quantity, nights, unitPrice, baseFare, gst,
 *            convenience, discount, totalAmount, currency, policy}}
 */
export const quoteTrip = async ({ type, itemId, quantity = 1, nights = 1, distance = 0, couponCode = null, userId = null }) => {
  const catalog = CATALOG[type]
  if (!catalog) throw priceError(`Cannot price an unknown booking type: ${type}`, 'UNKNOWN_TYPE')

  // The chokepoint for a closed vertical: no quote, no signed token, no order,
  // no payment, no booking. Cabs are closed because they reserve no inventory.
  if (!isSellable(type)) {
    throw priceError(
      `${type} bookings are not available yet. Nothing has been charged.`,
      'VERTICAL_UNAVAILABLE',
      503
    )
  }

  if (!itemId || typeof itemId !== 'string') {
    throw priceError('A valid inventory item id is required to price this trip', 'ITEM_REQUIRED')
  }

  const units = positiveInt(quantity)
  if (units > MAX_UNITS[type]) {
    throw priceError(`At most ${MAX_UNITS[type]} per booking`, 'QUANTITY_TOO_HIGH')
  }

  const stayNights = type === 'hotel' ? positiveInt(nights) : 1
  if (type === 'hotel' && stayNights > MAX_NIGHTS) {
    throw priceError(`A stay cannot exceed ${MAX_NIGHTS} nights`, 'NIGHTS_TOO_HIGH')
  }

  const snap = await db.collection(catalog.collection).doc(itemId).get()
  if (!snap.exists) {
    throw priceError('That item is no longer available', 'ITEM_NOT_FOUND', 404)
  }

  const item = snap.data()
  if (item.isActive === false || item.isDeleted === true) {
    throw priceError('That item is no longer available', 'ITEM_UNAVAILABLE', 409)
  }

  const unitPrice = unitPriceOf(item)
  if (unitPrice === null) {
    throw priceError('That item has no published price', 'ITEM_NOT_PRICED', 409)
  }

  const policy = TAX_POLICY[type]
  let distanceKm = 0
  if (type === 'cab') {
    distanceKm = parseDistanceKm(distance)

    // Cab distance is a price multiplier, so a client-supplied value must be
    // validated against what the server knows about the route. Without this a
    // caller could quote distance:0 and pay only the base fare regardless of
    // the real route.
    const expected = parseDistanceKm(item.distanceKm ?? item.expectedDistanceKm)
    const hasPerKmRate = Number(item.perKmRate) > 0
    if (expected > 0) {
      // Allow ±25% slack for route variation, but reject gross under/overstating.
      const lower = expected * 0.75
      const upper = expected * 1.5
      if (distanceKm < lower || distanceKm > upper) {
        throw priceError(
          `The trip distance (${distanceKm} km) does not match the expected route (${expected} km). Please refresh and try again.`,
          'DISTANCE_MISMATCH',
          400
        )
      }
    } else if (hasPerKmRate && distanceKm <= 0) {
      // No stored reference but per-km pricing is in effect: a zero distance
      // would zero out the per-km component, so reject it.
      throw priceError(
        'A valid trip distance is required to price this cab. Please select a pickup and drop-off.',
        'DISTANCE_REQUIRED',
        400
      )
    }
  }

  const baseFare = type === 'cab'
    ? cabBaseFare(item, distanceKm)
    : Math.round(unitPrice * units * stayNights)

  const gst = Math.round(baseFare * policy.gstRate)
  const convenience = policy.conveniencePerUnit * units
  const preDiscountTotal = baseFare + gst + convenience

  // Coupons are evaluated server-side so a client can never inflate a discount.
  // The discount is folded into the signed quote so it can't drift at checkout.
  let discount = 0
  let coupon = null
  if (couponCode) {
    const snap = await db.collection('coupons').doc(String(couponCode).toUpperCase()).get()
    coupon = snap.exists ? { id: snap.id, ...snap.data() } : null
    const result = evaluateCoupon(coupon, { amount: preDiscountTotal, type, userId })
    if (couponCode && !result.valid) {
      throw priceError(result.reason || 'That coupon is not valid', 'COUPON_INVALID', 400)
    }
    if (result.valid) discount = result.discount
  }

  const totalAmount = preDiscountTotal - discount

  const distanceNote = type === 'cab' && Number(item.perKmRate) > 0
    ? ` on ${distanceKm} km at ₹${item.perKmRate}/km`
    : ''

  const couponNote = discount > 0 && coupon?.code ? ` · ${coupon.code} −₹${discount}` : ''

  return {
    type,
    itemId,
    quantity: units,
    nights: stayNights,
    distanceKm,
    unitPrice,
    baseFare,
    taxes: gst,
    gst,
    convenience,
    discount,
    couponCode: couponCode || null,
    totalAmount,
    currency: 'INR',
    policy: `${Math.round(policy.gstRate * 100)}% GST${
      policy.conveniencePerUnit ? ` + ₹${policy.conveniencePerUnit} convenience fee per ${catalog.unit}` : ''
    }${distanceNote}${couponNote}`
  }
}

/** Binds a quote to the user who requested it, for a short window. */
export const signQuote = (quote, userId) =>
  jwt.sign(
    {
      sub: userId,
      type: quote.type,
      itemId: quote.itemId,
      quantity: quote.quantity,
      nights: quote.nights,
      // Carried in the signed claims so the distance cannot be lowered between
      // being quoted and being charged.
      distanceKm: quote.distanceKm,
      couponCode: quote.couponCode || null,
      totalAmount: quote.totalAmount
    },
    QUOTE_SECRET,
    { expiresIn: QUOTE_TTL_SECONDS }
  )

/**
 * Verifies a quote token and re-prices from live inventory. A stale token whose
 * price has since moved is rejected rather than honoured, so the customer is
 * never charged against a fare that no longer exists.
 */
export const redeemQuote = async (token, userId) => {
  let claims
  try {
    claims = jwt.verify(token, QUOTE_SECRET)
  } catch (err) {
    throw priceError(
      err instanceof jwt.TokenExpiredError
        ? 'This price quote has expired. Please refresh and try again.'
        : 'Invalid price quote',
      'QUOTE_INVALID',
      400
    )
  }

  if (claims.sub !== userId) {
    throw priceError('This price quote was issued to another account', 'QUOTE_OWNER_MISMATCH', 403)
  }

  const fresh = await quoteTrip({
    type: claims.type,
    itemId: claims.itemId,
    quantity: claims.quantity,
    nights: claims.nights,
    distance: claims.distanceKm,
    couponCode: claims.couponCode,
    userId
  })

  if (fresh.totalAmount !== claims.totalAmount) {
    throw priceError(
      'The price of this trip changed. Please review the new fare and try again.',
      'QUOTE_STALE',
      409
    )
  }

  return fresh
}

export const PRICING_LIMITS = { MAX_UNITS, MAX_NIGHTS }
