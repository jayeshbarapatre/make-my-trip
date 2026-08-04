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
