/**
 * Which verticals may be sold.
 *
 * Nothing is closed by default any more. Cabs were, because they reserved no
 * inventory and so sold without limit; they now book a dated slot per vehicle
 * like every other vertical (`ALWAYS_DATED` in services/availability.js), so
 * the reason is gone.
 *
 * The switch stays because it is the right chokepoint: `pricingService.quoteTrip`
 * refuses a closed type, and no quote means no signed quoteToken, which means
 * `create-order` refuses, which means there is no captured payment for a booking
 * to be built from. Existing bookings of a closed type stay readable and
 * cancellable.
 *
 * To close a vertical, list it in UNSELLABLE_TYPES (comma-separated).
 */
const DEFAULT_UNSELLABLE = ''

const configured = process.env.UNSELLABLE_TYPES ?? DEFAULT_UNSELLABLE

export const UNSELLABLE_TYPES = new Set(
  configured.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
)

export const isSellable = (type) => !UNSELLABLE_TYPES.has(String(type).toLowerCase())
