// Travel-date handling for inventory search.
//
// Departure timestamps are stored as UTC ISO strings (scripts/seed.js builds
// them from an IST wall-clock time via `new Date(\`${date}T${time}:00+05:30\`)`).
// A traveller searching "2026-08-10" means the IST calendar day, so the query
// window is not midnight-to-midnight UTC: IST is UTC+05:30 with no daylight
// saving, which puts the day boundary at 18:30 UTC the previous day.
//
// Getting this wrong is not cosmetic. A UTC-midnight window would drop every
// departure between 00:00 and 05:30 IST — the early-morning bank that carries a
// large share of domestic departures — and would wrongly include the previous
// evening's late flights.

/** India Standard Time offset in minutes. Fixed: India observes no DST. */
const IST_OFFSET_MINUTES = 330

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Validates a YYYY-MM-DD search date.
 *
 * Rejects malformed strings and impossible calendar dates (2026-02-30), both of
 * which would otherwise produce an Invalid Date and silently widen the query to
 * the whole collection.
 *
 * @param {unknown} value
 * @returns {string|null} the normalised date, or null if unusable
 */
export const parseSearchDate = (value) => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!DATE_PATTERN.test(trimmed)) return null

  const [year, month, day] = trimmed.split('-').map(Number)

  // Round-trip through UTC to reject dates the calendar does not have; the
  // Date constructor would roll 2026-02-30 forward to 2026-03-02.
  const probe = new Date(Date.UTC(year, month - 1, day))
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null
  }

  return trimmed
}

/**
 * The UTC instant range covering one IST calendar day.
 *
 * Both bounds are inclusive and formatted exactly like the stored values, so a
 * Firestore range filter on the ISO string compares correctly — ISO-8601 UTC
 * strings of identical shape sort lexicographically in chronological order.
 *
 * @param {string} dateStr YYYY-MM-DD, already validated by parseSearchDate
 * @returns {{ startIso: string, endIso: string }|null}
 */
export const istDayRangeUtc = (dateStr) => {
  const valid = parseSearchDate(dateStr)
  if (!valid) return null

  const [year, month, day] = valid.split('-').map(Number)

  const startMs = Date.UTC(year, month - 1, day) - IST_OFFSET_MINUTES * 60_000
  const endMs = startMs + 24 * 60 * 60 * 1000 - 1

  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString()
  }
}

/**
 * The UTC window covering one wall-clock day.
 *
 * Flight schedules are stored as wall-clock values at the airport: an admin
 * entering "15 Aug, 20:00" is saved as 2026-08-15T20:00:00.000Z, and read back
 * unchanged so the number typed is the number shown. See the note in
 * flightAdminController.
 *
 * `istDayRangeUtc` treated those same values as true instants and shifted them
 * into IST, which moved everything departing at or after 18:30 into the FOLLOWING
 * day. A 20:00 departure on the 15th became 01:30 IST on the 16th and vanished
 * from a search for its own date. Nothing caught it because the seeder only ever
 * generates morning and afternoon departures — the first evening flight anyone
 * created was the first to fall through.
 *
 * Comparing wall-clock to wall-clock keeps the write path and the read path
 * speaking the same language.
 */
export const wallClockDayRange = (dateStr) => {
  const valid = parseSearchDate(dateStr)
  if (!valid) return null

  return {
    startIso: `${valid}T00:00:00.000Z`,
    endIso: `${valid}T23:59:59.999Z`
  }
}

/** Today's date in IST as YYYY-MM-DD. */
export const todayIst = (now = new Date()) =>
  new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10)

/**
 * True when the date is in the past relative to today in IST.
 * Used to reject searches for departures that cannot be booked.
 */
export const isPastIstDate = (dateStr, now = new Date()) => {
  const valid = parseSearchDate(dateStr)
  if (!valid) return false
  return valid < todayIst(now)
}

export default { parseSearchDate, istDayRangeUtc, wallClockDayRange, todayIst, isPastIstDate }
