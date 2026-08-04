/**
 * Timestamp normalisation.
 *
 * Firestore documents in this project carry `createdAt` in two shapes: an ISO
 * string (written by `new Date().toISOString()`) and a Firestore Timestamp
 * (written by `FieldValue.serverTimestamp()`). Both are legitimate; mixing them
 * in one field is not.
 *
 * That mix broke three things at once, because Firestore orders by TYPE before
 * value and `new Date(timestampObject)` is Invalid Date:
 *
 *   - `getAllBookings` ordered every string-dated booking ahead of every
 *     Timestamp-dated one, so the admin's "recent bookings" list showed the
 *     newest bookings last.
 *   - `getUserBookings` sorted with `new Date(x)`, which is NaN for a
 *     Timestamp, leaving My Trips in an undefined order.
 *   - `apiHealthController`'s `where('createdAt', '>=', <Date>)` could never
 *     match a string-typed document, so "bookings today" was always 0.
 *
 * `scripts/normalizeTimestamps.js` converts stored data to Timestamp. These
 * helpers accept every shape regardless, so readers stay correct before,
 * during and after that migration.
 *
 * This logic previously existed as six separate copies of `toDate` across
 * controllers, and the two call sites that did NOT have a copy were precisely
 * the two that were broken.
 */

import { Timestamp } from 'firebase-admin/firestore'

/**
 * The value every stored date field should be written with.
 *
 * Returns a Firestore Timestamp rather than an ISO string, because a field that
 * holds both cannot be indexed, sorted or range-filtered — see the note above.
 *
 * Deliberately `Timestamp.now()` and not `FieldValue.serverTimestamp()`: the
 * sentinel cannot appear inside an array, and several documents here store
 * dated history entries (`history: [{ status, at }]`). This is server-side code,
 * so the local clock is the server clock either way.
 */
export const now = () => Timestamp.now()

/**
 * @param {unknown} value  Firestore Timestamp, ISO string, Date, or epoch ms
 * @returns {Date|null}    null when the value is absent or unparseable
 */
export const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value?.toDate === 'function') return value.toDate()
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Epoch milliseconds, or `fallback` when the value cannot be read as a date. */
export const toMillis = (value, fallback = 0) => toDate(value)?.getTime() ?? fallback

/** ISO string, or null. */
export const toIso = (value) => toDate(value)?.toISOString() ?? null

/**
 * Comparator for sorting documents newest-first on a date field of any shape.
 *
 *   docs.sort(byNewest('createdAt'))
 */
export const byNewest = (field = 'createdAt') => (a, b) =>
  toMillis(b?.[field]) - toMillis(a?.[field])

export default { now, toDate, toMillis, toIso, byNewest }
