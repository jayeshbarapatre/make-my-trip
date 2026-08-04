/**
 * Journey duration, derived — never stored.
 *
 * The admin bus, train and flight forms each computed a `duration` string in a
 * `useEffect` and wrote it back into form state. That is derived data held in
 * state, which costs an extra render on every keystroke in the time fields and
 * can desync: editing a departure time re-rendered once with the old duration
 * still displayed before the effect corrected it.
 *
 * Computing during render removes both problems and makes the value impossible
 * to get out of step with its inputs.
 */

const pad = (n) => String(n).padStart(2, '0')

/** `"7h 25m"`, or '' when either end is missing or unparseable. */
export const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes < 0) return ''
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/**
 * Minutes between two `"HH:MM"` times on an assumed same-or-next day.
 * An arrival earlier than the departure is treated as the following day, which
 * is what an overnight service means.
 */
export const minutesBetweenTimes = (departure, arrival) => {
  const parse = (t) => {
    const [h, m] = String(t ?? '').split(':').map(Number)
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
  }

  const dep = parse(departure)
  const arr = parse(arrival)
  if (dep === null || arr === null) return null

  return arr < dep ? arr + 24 * 60 - dep : arr - dep
}

/** `"7h 25m"` for a same/next-day `"HH:MM"` pair, or '' if incomplete. */
export const durationFromTimes = (departure, arrival) =>
  formatDuration(minutesBetweenTimes(departure, arrival))

/**
 * Minutes between two explicit date+time pairs. Used where the form captures a
 * date as well, so an overnight or multi-day leg is unambiguous rather than
 * assumed.
 */
export const minutesBetweenDateTimes = (depDate, depTime, arrDate, arrTime) => {
  if (!depDate || !depTime || !arrDate || !arrTime) return null

  const start = new Date(`${depDate}T${depTime}`)
  const end = new Date(`${arrDate}T${arrTime}`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null

  const diff = end.getTime() - start.getTime()
  return diff > 0 ? Math.floor(diff / 60000) : null
}

/** `"7h 25m"` for a date+time pair, or '' if incomplete or non-positive. */
export const durationFromDateTimes = (depDate, depTime, arrDate, arrTime) =>
  formatDuration(minutesBetweenDateTimes(depDate, depTime, arrDate, arrTime))

export default {
  formatDuration,
  minutesBetweenTimes,
  minutesBetweenDateTimes,
  durationFromTimes,
  durationFromDateTimes,
  pad
}
