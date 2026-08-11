/**
 * Local-timezone date helpers.
 *
 * `new Date().toISOString()` returns UTC, so before ~5:30 AM IST it yields
 * YESTERDAY's date — which made every default booking date wrong in the early
 * morning. These helpers format in the user's local timezone instead.
 */

const pad = (n) => String(n).padStart(2, '0')

/** Returns YYYY-MM-DD for a Date in the local timezone (not UTC). */
export const toLocalDateStr = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Today's date as YYYY-MM-DD in the local timezone. */
export const todayLocal = () => toLocalDateStr(new Date())

/** `n` days from today as YYYY-MM-DD in the local timezone (n may be negative). */
export const addDaysLocal = (days, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return toLocalDateStr(d)
}

export default { toLocalDateStr, todayLocal, addDaysLocal }

/**
 * Formats a date that may arrive in any of the shapes this API produces.
 *
 * Firestore Timestamps serialise to `{ _seconds, _nanoseconds }` over JSON, and
 * `new Date({_seconds: …})` yields Invalid Date — which is exactly what the
 * approval tables showed. Other records carry ISO strings, and a few carry
 * epoch milliseconds, so a display helper has to accept all three rather than
 * assume whichever one it happened to be handed.
 *
 * @returns {string} a localised date, or the fallback when there is nothing to show
 */
export const formatApiDate = (value, { fallback = 'N/A', withTime = false } = {}) => {
  if (value === null || value === undefined || value === '') return fallback

  let date

  if (typeof value === 'object' && value !== null && typeof value._seconds === 'number') {
    date = new Date(value._seconds * 1000)
  } else if (typeof value === 'object' && value !== null && typeof value.seconds === 'number') {
    date = new Date(value.seconds * 1000)
  } else if (typeof value === 'number') {
    date = new Date(value)
  } else {
    date = new Date(value)
  }

  if (Number.isNaN(date.getTime())) return fallback

  return withTime ? date.toLocaleString() : date.toLocaleDateString()
}
