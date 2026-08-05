/**
 * Which verticals may be sold.
 *
 * Cabs are off by default. `bookingService.RESOURCE_COLLECTIONS` covers flight,
 * hotel, bus and train — not cab — so a cab booking reserves nothing and sells
 * without limit. Every cab sold is a promise with no vehicle behind it, and the
 * customer finds out at the curb. Selling something that cannot be delivered is
 * worse than not selling it, so the vertical stays closed until cabs have a
 * daily capacity model per route and class (BLOCKED.md B5).
 *
 * Enforced in `pricingService.quoteTrip`, which is the chokepoint: no quote
 * means no signed quoteToken, which means `create-order` refuses, which means
 * there is no captured payment for a booking to be built from. Existing cab
 * bookings stay readable and cancellable.
 *
 * To reopen a vertical, set UNSELLABLE_TYPES to the remaining list (or empty).
 */
const DEFAULT_UNSELLABLE = 'cab'

const configured = process.env.UNSELLABLE_TYPES ?? DEFAULT_UNSELLABLE

export const UNSELLABLE_TYPES = new Set(
  configured.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
)

export const isSellable = (type) => !UNSELLABLE_TYPES.has(String(type).toLowerCase())
