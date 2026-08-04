import { parseSearchDate } from '../utils/searchDate.js'

// Per-travel-date inventory.
//
// Hotels, buses and trains previously carried a single scalar counter
// (`roomsAvailable` / `seatsAvailable`) with no date attached. A 50-room hotel
// therefore sold 50 bookings *in total* rather than 50 *per night*: two guests
// with non-overlapping stays competed for the same number, and a cancelled
// January booking returned a room to July. Flights were never affected — each
// flight document already represents one dated departure.
//
// Availability now lives in a subcollection keyed by travel date:
//
//   hotels/{id}/availability/2026-08-10  -> { date, total, booked }
//   buses/{id}/availability/2026-08-10   -> { date, total, booked }
//   trains/{id}/availability/2026-08-10  -> { date, classes: { SL: {total, booked}, … } }
//
// Documents are created lazily, on the first reservation for a date.
// Pre-materialising a rolling year would cost hundreds of thousands of
// documents that mostly record "nobody has booked this yet"; an absent document
// means exactly that, and the capacity is read from the parent item.
//
// `total` is stored per date rather than only on the parent so that changing a
// property's room count later cannot retroactively alter nights that are
// already sold.

/** Item field holding the per-date capacity, written by the migration. */
export const DAILY_INVENTORY_FIELD = 'dailyInventory'

/** Item flag marking an item as migrated to dated availability. */
export const DATED_FLAG = 'datedAvailability'

export const AVAILABILITY_SUBCOLLECTION = 'availability'

/** Types that book a dated slot. Cabs are on-demand; flights are dated already. */
export const DATED_TYPES = new Set(['hotel', 'bus', 'train'])

/** Types whose availability is subdivided by travel class. */
export const CLASSED_TYPES = new Set(['train'])

export const DEFAULT_TRAIN_CLASS = 'SL'

const MAX_STAY_NIGHTS = 90

const err = (message, code, status = 400) => {
  const e = new Error(message)
  e.code = code
  e.status = status
  return e
}

/** Adds `days` to a YYYY-MM-DD date, returning YYYY-MM-DD. */
const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return t.toISOString().slice(0, 10)
}

/**
 * The nights a stay occupies.
 *
 * Checkout is exclusive: a guest arriving on the 10th and leaving on the 12th
 * occupies the nights of the 10th and 11th, not the 12th. Counting the checkout
 * date would block a room that is free from 11:00 that morning.
 *
 * @returns {string[]} ascending YYYY-MM-DD, one per night
 */
export const stayNights = (checkIn, checkOut) => {
  const start = parseSearchDate(checkIn)
  const end = parseSearchDate(checkOut)
  if (!start || !end) throw err('Check-in and check-out must be YYYY-MM-DD dates', 'INVALID_DATES')
  if (end <= start) throw err('Check-out must be after check-in', 'INVALID_DATE_RANGE')

  const nights = []
  for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
    nights.push(cursor)
    if (nights.length > MAX_STAY_NIGHTS) {
      throw err(`A stay cannot exceed ${MAX_STAY_NIGHTS} nights`, 'STAY_TOO_LONG')
    }
  }
  return nights
}

/**
 * The travel dates a booking payload occupies, for any dated type.
 *
 * Hotels span every night of the stay; buses and trains occupy the single
 * departure date. Returns [] for types that are not date-scoped, so callers can
 * fall through to the legacy path without branching on type twice.
 *
 * @returns {string[]}
 */
export const travelDatesFor = (type, payload = {}) => {
  if (type === 'hotel') {
    const checkIn = payload.checkIn ?? payload.checkin ?? payload.fromDate
    const checkOut = payload.checkOut ?? payload.checkout ?? payload.toDate
    if (!checkIn || !checkOut) {
      throw err('A hotel booking needs checkIn and checkOut dates', 'DATES_REQUIRED')
    }
    return stayNights(checkIn, checkOut)
  }

  if (type === 'bus' || type === 'train') {
    const raw = payload.travelDate ?? payload.departureDate ?? payload.date ?? payload.journeyDate
    const date = parseSearchDate(raw)
    if (!date) {
      throw err(`A ${type} booking needs a travel date as YYYY-MM-DD`, 'DATE_REQUIRED')
    }
    return [date]
  }

  return []
}

/** The travel class a payload books, normalised. Trains only. */
export const travelClassFor = (type, payload = {}) => {
  if (!CLASSED_TYPES.has(type)) return null
  const raw = payload.travelClass ?? payload.classCode ?? payload.coachClass ?? payload.class
  const code = String(raw ?? '').trim().toUpperCase()
  return code || DEFAULT_TRAIN_CLASS
}

/**
 * Per-date capacity for an item, falling back through the legacy scalar fields
 * so an item that has not been migrated still yields a sensible number.
 *
 * @returns {number|null} null when the item declares no capacity at all
 */
export const capacityOf = (item = {}, type, classCode = null) => {
  const inventory = item[DAILY_INVENTORY_FIELD]

  if (inventory && typeof inventory === 'object') {
    if (classCode) {
      const perClass = inventory.classes?.[classCode]
      if (Number.isFinite(Number(perClass))) return Number(perClass)
      // A class the item does not offer is not bookable.
      if (inventory.classes && Object.keys(inventory.classes).length) return null
    }
    if (Number.isFinite(Number(inventory.total))) return Number(inventory.total)
  }

  const legacy = type === 'hotel'
    ? [item.totalRooms, item.rooms, item.roomsAvailable]
    : [item.totalSeats, item.seats, item.seatsAvailable]

  const found = legacy.find((v) => Number.isFinite(Number(v)) && Number(v) >= 0)
  return found === undefined ? null : Number(found)
}

/** True once an item has been migrated to dated availability. */
export const isDated = (item = {}) => item[DATED_FLAG] === true

const subRef = (itemRef, date) =>
  itemRef.collection(AVAILABILITY_SUBCOLLECTION).doc(date)

/** Reads one date document into { total, booked, exists }. */
const readSlot = (snap, capacity, classCode) => {
  if (!snap.exists) return { total: capacity, booked: 0, exists: false }

  const data = snap.data() ?? {}

  if (classCode) {
    const entry = data.classes?.[classCode]
    return {
      total: Number.isFinite(Number(entry?.total)) ? Number(entry.total) : capacity,
      booked: Number(entry?.booked) || 0,
      exists: true,
      raw: data
    }
  }

  return {
    total: Number.isFinite(Number(data.total)) ? Number(data.total) : capacity,
    booked: Number(data.booked) || 0,
    exists: true,
    raw: data
  }
}

const applySlot = (slot, classCode, nextBooked, date, now) => {
  if (classCode) {
    const classes = { ...(slot.raw?.classes ?? {}) }
    classes[classCode] = { total: slot.total, booked: nextBooked }
    return { date, classes, updatedAt: now }
  }
  return { date, total: slot.total, booked: nextBooked, updatedAt: now }
}

/**
 * Reserves `quantity` on every date, inside the caller's transaction.
 *
 * Every read is issued before any write, which Firestore requires and which is
 * also what makes a multi-night stay all-or-nothing: if any single night is
 * short, the whole transaction aborts and no night is taken.
 *
 * @throws INSUFFICIENT_AVAILABILITY naming the first date that cannot be met
 * @returns {Promise<{applied: boolean, dates: string[], remaining: object}>}
 */
export const reserveDatedInTx = async (tx, {
  itemRef,
  item,
  type,
  dates,
  quantity,
  classCode = null,
  now = new Date().toISOString()
}) => {
  if (!dates?.length || !(quantity > 0)) return { applied: false, dates: [], remaining: {} }

  const capacity = capacityOf(item, type, classCode)
  if (capacity === null) {
    throw err(
      classCode
        ? `This service does not offer class ${classCode}`
        : 'This item has no bookable inventory',
      'NO_INVENTORY',
      409
    )
  }

  const refs = dates.map((d) => subRef(itemRef, d))
  const snaps = await Promise.all(refs.map((r) => tx.get(r)))

  const slots = snaps.map((s) => readSlot(s, capacity, classCode))

  for (let i = 0; i < slots.length; i++) {
    const free = slots[i].total - slots[i].booked
    if (free < quantity) {
      throw err(
        type === 'hotel'
          ? `Only ${Math.max(0, free)} room(s) left for ${dates[i]}`
          : `Only ${Math.max(0, free)} seat(s) left on ${dates[i]}`,
        'INSUFFICIENT_AVAILABILITY',
        409
      )
    }
  }

  const remaining = {}
  for (let i = 0; i < slots.length; i++) {
    const nextBooked = slots[i].booked + quantity
    tx.set(refs[i], applySlot(slots[i], classCode, nextBooked, dates[i], now), { merge: true })
    remaining[dates[i]] = slots[i].total - nextBooked
  }

  return { applied: true, dates: [...dates], remaining }
}

/**
 * Returns `quantity` to every date, inside the caller's transaction.
 *
 * `booked` is floored at zero: a double-release caused by a retried
 * cancellation must not manufacture inventory that never existed.
 */
export const releaseDatedInTx = async (tx, {
  itemRef,
  item,
  type,
  dates,
  quantity,
  classCode = null,
  now = new Date().toISOString()
}) => {
  if (!dates?.length || !(quantity > 0)) return { applied: false, dates: [], restored: 0 }

  const capacity = capacityOf(item, type, classCode) ?? 0
  const refs = dates.map((d) => subRef(itemRef, d))
  const snaps = await Promise.all(refs.map((r) => tx.get(r)))

  const writes = []
  for (let i = 0; i < snaps.length; i++) {
    // Nothing was ever reserved for this date; there is nothing to give back.
    if (!snaps[i].exists) continue
    const slot = readSlot(snaps[i], capacity, classCode)
    const nextBooked = Math.max(0, slot.booked - quantity)
    writes.push([refs[i], applySlot(slot, classCode, nextBooked, dates[i], now)])
  }

  for (const [ref, payload] of writes) tx.set(ref, payload, { merge: true })

  return { applied: writes.length > 0, dates: [...dates], restored: quantity }
}

/**
 * Free units per date, for search and detail pages. Read-only.
 *
 * @returns {Promise<Record<string, number>>}
 */
export const readAvailability = async (itemRef, item, type, dates, classCode = null) => {
  const capacity = capacityOf(item, type, classCode)
  if (capacity === null) return Object.fromEntries(dates.map((d) => [d, 0]))

  const snaps = await Promise.all(dates.map((d) => subRef(itemRef, d).get()))

  return Object.fromEntries(dates.map((d, i) => {
    const slot = readSlot(snaps[i], capacity, classCode)
    return [d, Math.max(0, slot.total - slot.booked)]
  }))
}

/**
 * Free units for many items over the same dates, for a results page.
 *
 * Returns the MINIMUM across the requested dates per item, which is what
 * decides whether a stay is bookable: a room free on two nights of a three
 * night stay is not a bookable stay.
 *
 * Callers pass only the rows they are about to render, not every candidate —
 * availability costs one document read per item per date, so enriching a whole
 * unpaginated result set would reintroduce the read amplification that indexed
 * search removed.
 *
 * Items still on the legacy counter are reported from it, so a partially
 * migrated collection shows honest numbers throughout.
 *
 * @returns {Promise<Record<string, number>>} itemId -> free units
 */
export const availabilityForItems = async (collectionRef, items, type, dates, classCode = null) => {
  if (!dates?.length) return {}

  const entries = await Promise.all(items.map(async (item) => {
    const capacity = capacityOf(item, type, classCode)
    if (capacity === null) return [item.id, 0]

    if (!isDated(item)) {
      const legacy = type === 'hotel' ? item.roomsAvailable : item.seatsAvailable
      return [item.id, Number.isFinite(Number(legacy)) ? Number(legacy) : capacity]
    }

    const free = await readAvailability(collectionRef.doc(item.id), item, type, dates, classCode)
    return [item.id, Math.min(...Object.values(free))]
  }))

  return Object.fromEntries(entries)
}

export default {
  stayNights,
  availabilityForItems,
  travelDatesFor,
  travelClassFor,
  capacityOf,
  isDated,
  reserveDatedInTx,
  releaseDatedInTx,
  readAvailability,
  DAILY_INVENTORY_FIELD,
  DATED_FLAG,
  DATED_TYPES,
  CLASSED_TYPES,
  AVAILABILITY_SUBCOLLECTION
}
