// Loaded before any src/ import: firebase.js reads its credentials at module
// scope, so without this the suite dies on import rather than on assertion.
import 'dotenv/config'

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { newDb } from './fakeFirestore.mjs'
import {
  stayNights,
  travelDatesFor,
  travelClassFor,
  capacityOf,
  isDated,
  reserveDatedInTx,
  releaseDatedInTx,
  readAvailability,
  availabilityForItems,
  DAILY_INVENTORY_FIELD,
  DATED_FLAG
} from '../src/services/availability.js'
import { deriveInventory } from '../scripts/backfillDatedAvailability.js'

// Per-travel-date inventory. The defect being pinned here:
//
// Hotels, buses and trains carried one scalar counter with no date attached, so
// a 50-room hotel sold 50 bookings in total rather than 50 per night. Two guests
// with non-overlapping stays competed for the same number, and cancelling a
// January booking returned a room to July.
//
// These run against an in-memory Firestore (tests/fakeFirestore.mjs) so that
// overselling and interleaved transactions are deterministic and cost no quota.

const HOTEL = { [DAILY_INVENTORY_FIELD]: { total: 3 }, [DATED_FLAG]: true }
const BUS = { [DAILY_INVENTORY_FIELD]: { total: 2 }, [DATED_FLAG]: true }
const TRAIN = {
  [DAILY_INVENTORY_FIELD]: { classes: { SL: 2, '3A': 1 } },
  [DATED_FLAG]: true
}

const setup = (collection, id, item) => {
  const db = newDb()
  db.seed(`${collection}/${id}`, item)
  return { db, ref: db.collection(collection).doc(id) }
}

const reserve = (db, ref, item, type, dates, quantity, classCode = null) =>
  db.runTransaction((tx) => reserveDatedInTx(tx, { itemRef: ref, item, type, dates, quantity, classCode }))

const release = (db, ref, item, type, dates, quantity, classCode = null) =>
  db.runTransaction((tx) => releaseDatedInTx(tx, { itemRef: ref, item, type, dates, quantity, classCode }))

const booked = (db, collection, id, date, classCode = null) => {
  const doc = db.peek(`${collection}/${id}/availability/${date}`)
  if (!doc) return null
  return classCode ? doc.classes?.[classCode]?.booked : doc.booked
}

describe('stay nights', () => {
  test('checkout is exclusive — a 10th-to-12th stay occupies two nights', () => {
    assert.deepEqual(stayNights('2026-08-10', '2026-08-12'), ['2026-08-10', '2026-08-11'])
  })

  test('a single night', () => {
    assert.deepEqual(stayNights('2026-08-10', '2026-08-11'), ['2026-08-10'])
  })

  test('spans a month boundary', () => {
    assert.deepEqual(stayNights('2026-08-30', '2026-09-02'), ['2026-08-30', '2026-08-31', '2026-09-01'])
  })

  test('spans a leap day', () => {
    assert.deepEqual(stayNights('2028-02-28', '2028-03-01'), ['2028-02-28', '2028-02-29'])
  })

  test('rejects checkout on or before checkin', () => {
    assert.throws(() => stayNights('2026-08-10', '2026-08-10'), /Check-out must be after/)
    assert.throws(() => stayNights('2026-08-10', '2026-08-09'), /Check-out must be after/)
  })

  test('rejects malformed dates', () => {
    assert.throws(() => stayNights('10/08/2026', '2026-08-12'), /YYYY-MM-DD/)
    assert.throws(() => stayNights('2026-02-30', '2026-03-02'), /YYYY-MM-DD/)
  })

  test('rejects a stay beyond the 90-night ceiling', () => {
    assert.throws(() => stayNights('2026-01-01', '2026-12-31'), /cannot exceed 90 nights/)
  })
})

describe('travel dates from a booking payload', () => {
  test('hotel spans every night of the stay', () => {
    assert.deepEqual(
      travelDatesFor('hotel', { checkIn: '2026-08-10', checkOut: '2026-08-13' }),
      ['2026-08-10', '2026-08-11', '2026-08-12']
    )
  })

  test('hotel accepts the alternate field spellings already in use', () => {
    assert.deepEqual(travelDatesFor('hotel', { checkin: '2026-08-10', checkout: '2026-08-11' }), ['2026-08-10'])
  })

  test('bus and train occupy the single departure date', () => {
    assert.deepEqual(travelDatesFor('bus', { travelDate: '2026-08-10' }), ['2026-08-10'])
    assert.deepEqual(travelDatesFor('train', { journeyDate: '2026-08-10' }), ['2026-08-10'])
  })

  test('types without a dated slot return nothing', () => {
    assert.deepEqual(travelDatesFor('cab', {}), [])
    assert.deepEqual(travelDatesFor('flight', {}), [])
  })

  test('a dated type without a date is refused rather than silently unbounded', () => {
    assert.throws(() => travelDatesFor('hotel', {}), /checkIn and checkOut/)
    assert.throws(() => travelDatesFor('bus', {}), /travel date/)
  })

  test('train class defaults, and normalises case', () => {
    assert.equal(travelClassFor('train', {}), 'SL')
    assert.equal(travelClassFor('train', { travelClass: '3a' }), '3A')
    assert.equal(travelClassFor('bus', { travelClass: '3A' }), null)
  })
})

describe('capacity resolution stays backward compatible', () => {
  test('prefers the migrated per-date inventory', () => {
    assert.equal(capacityOf({ [DAILY_INVENTORY_FIELD]: { total: 12 }, rooms: 99 }, 'hotel'), 12)
  })

  test('falls back to legacy fields for an unmigrated item', () => {
    assert.equal(capacityOf({ roomsAvailable: 7 }, 'hotel'), 7)
    assert.equal(capacityOf({ seats: 40 }, 'bus'), 40)
  })

  test('resolves a train class, and refuses a class not offered', () => {
    assert.equal(capacityOf(TRAIN, 'train', 'SL'), 2)
    assert.equal(capacityOf(TRAIN, 'train', '2A'), null)
  })

  test('an item with no capacity at all yields null', () => {
    assert.equal(capacityOf({}, 'hotel'), null)
  })

  test('isDated only reports migrated items', () => {
    assert.equal(isDated(HOTEL), true)
    assert.equal(isDated({ roomsAvailable: 5 }), false)
  })
})

describe('hotel — same-day and multi-night reservation', () => {
  test('a single night decrements only that night', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)

    assert.equal(booked(db, 'hotels', 'h1', '2026-08-10'), 1)
    assert.equal(booked(db, 'hotels', 'h1', '2026-08-11'), null, 'an untouched night must not be materialised')
  })

  test('a multi-night stay decrements every night', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    const nights = stayNights('2026-08-10', '2026-08-13')
    await reserve(db, ref, HOTEL, 'hotel', nights, 2)

    for (const n of nights) assert.equal(booked(db, 'hotels', 'h1', n), 2, `night ${n}`)
  })

  test('non-overlapping stays do not compete — the original defect', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    // Capacity is 3. Under the old global counter these six room-nights would
    // have exhausted it; per date they are independent.
    await reserve(db, ref, HOTEL, 'hotel', stayNights('2026-01-10', '2026-01-13'), 3)
    await reserve(db, ref, HOTEL, 'hotel', stayNights('2026-07-10', '2026-07-13'), 3)

    assert.equal(booked(db, 'hotels', 'h1', '2026-01-10'), 3)
    assert.equal(booked(db, 'hotels', 'h1', '2026-07-10'), 3)
  })

  test('overlapping stays accumulate on the shared night only', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await reserve(db, ref, HOTEL, 'hotel', stayNights('2026-08-10', '2026-08-12'), 1)
    await reserve(db, ref, HOTEL, 'hotel', stayNights('2026-08-11', '2026-08-13'), 1)

    assert.equal(booked(db, 'hotels', 'h1', '2026-08-10'), 1)
    assert.equal(booked(db, 'hotels', 'h1', '2026-08-11'), 2, 'the shared night carries both')
    assert.equal(booked(db, 'hotels', 'h1', '2026-08-12'), 1)
  })
})

describe('overbooking is impossible', () => {
  test('a reservation beyond capacity is refused', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await assert.rejects(
      () => reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 4),
      (e) => e.code === 'INSUFFICIENT_AVAILABILITY'
    )
  })

  test('the shortfall names the date that failed', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-11'], 3)

    await assert.rejects(
      () => reserve(db, ref, HOTEL, 'hotel', stayNights('2026-08-10', '2026-08-13'), 1),
      (e) => e.code === 'INSUFFICIENT_AVAILABILITY' && /2026-08-11/.test(e.message)
    )
  })

  test('PARTIAL AVAILABILITY: one short night aborts the whole stay', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    // Sell out the middle night only.
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-11'], 3)

    await assert.rejects(
      () => reserve(db, ref, HOTEL, 'hotel', stayNights('2026-08-10', '2026-08-13'), 1),
      (e) => e.code === 'INSUFFICIENT_AVAILABILITY'
    )

    // The nights either side must be untouched: a half-reserved stay would take
    // rooms the guest was never sold.
    assert.equal(booked(db, 'hotels', 'h1', '2026-08-10'), null, 'no partial write on night 1')
    assert.equal(booked(db, 'hotels', 'h1', '2026-08-12'), null, 'no partial write on night 3')
    assert.equal(booked(db, 'hotels', 'h1', '2026-08-11'), 3, 'the sold-out night is unchanged')
  })

  test('an item declaring no inventory cannot be booked', async () => {
    const { db, ref } = setup('hotels', 'empty', { [DATED_FLAG]: true })
    await assert.rejects(
      () => reserve(db, ref, { [DATED_FLAG]: true }, 'hotel', ['2026-08-10'], 1),
      (e) => e.code === 'NO_INVENTORY'
    )
  })
})

describe('concurrent bookings cannot oversell', () => {
  test('two transactions racing for the last seat: one wins, one retries and fails', async () => {
    const { db, ref } = setup('buses', 'b1', BUS)
    await reserve(db, ref, BUS, 'bus', ['2026-08-10'], 1) // 1 of 2 taken

    // Both transactions read before either commits, so the second commits
    // against a version that has moved and is forced to retry.
    let released = false
    db.beforeCommit = async (attempt) => {
      if (attempt === 0 && !released) {
        released = true
        await db.runTransaction((tx) =>
          reserveDatedInTx(tx, { itemRef: ref, item: BUS, type: 'bus', dates: ['2026-08-10'], quantity: 1 })
        )
      }
    }

    await assert.rejects(
      () => reserve(db, ref, BUS, 'bus', ['2026-08-10'], 1),
      (e) => e.code === 'INSUFFICIENT_AVAILABILITY',
      'the retry must observe the competing write and refuse'
    )

    db.beforeCommit = null
    assert.equal(booked(db, 'buses', 'b1', '2026-08-10'), 2, 'exactly capacity, never more')
  })

  test('many sequential bookings stop exactly at capacity', async () => {
    const { db, ref } = setup('buses', 'b1', BUS)
    let ok = 0
    let refused = 0
    for (let i = 0; i < 6; i++) {
      try {
        await reserve(db, ref, BUS, 'bus', ['2026-08-10'], 1)
        ok++
      } catch (e) {
        if (e.code !== 'INSUFFICIENT_AVAILABILITY') throw e
        refused++
      }
    }
    assert.equal(ok, 2, 'only capacity may succeed')
    assert.equal(refused, 4)
    assert.equal(booked(db, 'buses', 'b1', '2026-08-10'), 2)
  })
})

describe('train classes are independent', () => {
  test('booking one class does not consume another', async () => {
    const { db, ref } = setup('trains', 't1', TRAIN)
    await reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 2, 'SL')

    assert.equal(booked(db, 'trains', 't1', '2026-08-10', 'SL'), 2)
    assert.equal(booked(db, 'trains', 't1', '2026-08-10', '3A'), undefined, '3A untouched')

    // 3A still has its own seat available.
    await reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 1, '3A')
    assert.equal(booked(db, 'trains', 't1', '2026-08-10', '3A'), 1)
  })

  test('a sold-out class is refused while another still sells', async () => {
    const { db, ref } = setup('trains', 't1', TRAIN)
    await reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 1, '3A')

    await assert.rejects(
      () => reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 1, '3A'),
      (e) => e.code === 'INSUFFICIENT_AVAILABILITY'
    )
    await reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 1, 'SL')
    assert.equal(booked(db, 'trains', 't1', '2026-08-10', 'SL'), 1)
  })

  test('a class the train does not run is refused', async () => {
    const { db, ref } = setup('trains', 't1', TRAIN)
    await assert.rejects(
      () => reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 1, '1A'),
      (e) => e.code === 'NO_INVENTORY'
    )
  })
})

describe('cancellation restores inventory', () => {
  test('a cancelled stay frees every night it held', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    const nights = stayNights('2026-08-10', '2026-08-13')
    await reserve(db, ref, HOTEL, 'hotel', nights, 2)
    await release(db, ref, HOTEL, 'hotel', nights, 2)

    for (const n of nights) assert.equal(booked(db, 'hotels', 'h1', n), 0, `night ${n} returned`)
  })

  test('the freed room is sellable again', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 3)
    await assert.rejects(() => reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1))

    await release(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)
    assert.equal(booked(db, 'hotels', 'h1', '2026-08-10'), 3)
  })

  test('a train cancellation returns seats to its own class only', async () => {
    const { db, ref } = setup('trains', 't1', TRAIN)
    await reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 2, 'SL')
    await reserve(db, ref, TRAIN, 'train', ['2026-08-10'], 1, '3A')
    await release(db, ref, TRAIN, 'train', ['2026-08-10'], 2, 'SL')

    assert.equal(booked(db, 'trains', 't1', '2026-08-10', 'SL'), 0)
    assert.equal(booked(db, 'trains', 't1', '2026-08-10', '3A'), 1, '3A unaffected')
  })

  test('a repeated cancellation cannot manufacture inventory', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)
    await release(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)
    await release(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)
    await release(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)

    assert.equal(booked(db, 'hotels', 'h1', '2026-08-10'), 0, 'floored at zero, never negative')
  })

  test('releasing a date that was never reserved is a no-op', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    const result = await release(db, ref, HOTEL, 'hotel', ['2026-08-10'], 1)

    assert.equal(result.applied, false)
    assert.equal(db.peek('hotels/h1/availability/2026-08-10'), undefined, 'no phantom document')
  })
})

describe('availability reads', () => {
  test('reports free units per date, including untouched dates', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 2)

    const free = await readAvailability(ref, HOTEL, 'hotel', ['2026-08-10', '2026-08-11'])
    assert.deepEqual(free, { '2026-08-10': 1, '2026-08-11': 3 })
  })

  test('an item with no inventory reports zero rather than throwing', async () => {
    const { db, ref } = setup('hotels', 'x', {})
    assert.deepEqual(await readAvailability(ref, {}, 'hotel', ['2026-08-10']), { '2026-08-10': 0 })
  })
})

describe('transaction discipline', () => {
  test('the engine issues every read before any write', async () => {
    // The fake throws if a read follows a write, matching Firestore. A
    // multi-night stay is the case where getting this wrong is easiest.
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await assert.doesNotReject(
      () => reserve(db, ref, HOTEL, 'hotel', stayNights('2026-08-10', '2026-08-20'), 1)
    )
  })

  test('capacity is pinned per date, so raising it later cannot alter sold nights', async () => {
    const { db, ref } = setup('hotels', 'h1', HOTEL)
    await reserve(db, ref, HOTEL, 'hotel', ['2026-08-10'], 3)

    const enlarged = { ...HOTEL, [DAILY_INVENTORY_FIELD]: { total: 10 } }
    const free = await readAvailability(ref, enlarged, 'hotel', ['2026-08-10', '2026-08-11'])

    assert.equal(free['2026-08-10'], 0, 'the sold night keeps the capacity it was sold under')
    assert.equal(free['2026-08-11'], 10, 'an unsold night picks up the new capacity')
  })
})

describe('migration: capacity derivation', () => {
  const HOTEL_SPEC = { capacityFields: ['totalRooms', 'rooms', 'roomsAvailable'], classed: false }
  const BUS_SPEC = { capacityFields: ['totalSeats', 'seats', 'seatsAvailable'], classed: false }
  const TRAIN_SPEC = { capacityFields: ['totalSeats', 'seats', 'seatsAvailable'], classed: true }

  test('prefers an explicit total over a live remaining count', () => {
    // roomsAvailable is what is left today; migrating from it would permanently
    // shrink the property to its current occupancy.
    assert.deepEqual(deriveInventory({ totalRooms: 50, roomsAvailable: 3 }, HOTEL_SPEC), { total: 50 })
    assert.deepEqual(deriveInventory({ rooms: 40, roomsAvailable: 3 }, HOTEL_SPEC), { total: 40 })
  })

  test('falls back to the remaining count when nothing better exists', () => {
    assert.deepEqual(deriveInventory({ roomsAvailable: 12 }, HOTEL_SPEC), { total: 12 })
    assert.deepEqual(deriveInventory({ seatsAvailable: 30 }, BUS_SPEC), { total: 30 })
  })

  test('an item with no capacity yields null rather than a guess', () => {
    assert.equal(deriveInventory({ name: 'Hotel X' }, HOTEL_SPEC), null)
  })

  test('zero capacity is preserved, not treated as missing', () => {
    assert.deepEqual(deriveInventory({ rooms: 0 }, HOTEL_SPEC), { total: 0 })
  })

  test('a train that declares its coach mix keeps it', () => {
    assert.deepEqual(
      deriveInventory({ classes: { sl: 72, '3a': 64 } }, TRAIN_SPEC),
      { classes: { SL: 72, '3A': 64 } }
    )
  })

  test('a scalar train seat count is split WITHOUT changing the total', () => {
    for (const total of [184, 100, 7, 1, 0, 250]) {
      const out = deriveInventory({ seats: total }, TRAIN_SPEC)
      const sum = Object.values(out.classes).reduce((a, b) => a + b, 0)
      assert.equal(sum, total, `split of ${total} must sum back to ${total}, got ${JSON.stringify(out.classes)}`)
      assert.ok(Object.values(out.classes).every((n) => n >= 0), 'no negative class')
    }
  })

  test('derivation is deterministic — re-running yields the same result', () => {
    const doc = { seats: 184 }
    assert.deepEqual(deriveInventory(doc, TRAIN_SPEC), deriveInventory(doc, TRAIN_SPEC))
  })
})

describe('search reflects dated availability', () => {
  const hotel = (id, total) => ({ id, [DAILY_INVENTORY_FIELD]: { total }, [DATED_FLAG]: true })

  test('a hotel sold out on ONE night of a stay reports zero for that stay', async () => {
    const db = newDb()
    db.seed('hotels/h1', hotel('h1', 2))
    const col = db.collection('hotels')

    // Sell out only the middle night.
    await db.runTransaction((tx) => reserveDatedInTx(tx, {
      itemRef: col.doc('h1'), item: hotel('h1', 2), type: 'hotel', dates: ['2026-08-11'], quantity: 2
    }))

    const free = await availabilityForItems(col, [hotel('h1', 2)], 'hotel', stayNights('2026-08-10', '2026-08-13'))
    assert.equal(free.h1, 0, 'the minimum across nights decides bookability')
  })

  test('the same hotel is still bookable on unaffected dates', async () => {
    const db = newDb()
    db.seed('hotels/h1', hotel('h1', 2))
    const col = db.collection('hotels')
    await db.runTransaction((tx) => reserveDatedInTx(tx, {
      itemRef: col.doc('h1'), item: hotel('h1', 2), type: 'hotel', dates: ['2026-08-11'], quantity: 2
    }))

    const free = await availabilityForItems(col, [hotel('h1', 2)], 'hotel', stayNights('2026-09-10', '2026-09-12'))
    assert.equal(free.h1, 2, 'a different month is unaffected — the original defect')
  })

  test('an unmigrated item reports its legacy counter, not zero', async () => {
    const db = newDb()
    const legacy = { id: 'h2', roomsAvailable: 5 }
    db.seed('hotels/h2', legacy)

    const free = await availabilityForItems(db.collection('hotels'), [legacy], 'hotel', ['2026-08-10'])
    assert.equal(free.h2, 5, 'a partially migrated collection must still show honest numbers')
  })

  test('a bus sold out on one date still sells on another', async () => {
    const db = newDb()
    const bus = { id: 'b1', [DAILY_INVENTORY_FIELD]: { total: 2 }, [DATED_FLAG]: true }
    db.seed('buses/b1', bus)
    const col = db.collection('buses')

    await db.runTransaction((tx) => reserveDatedInTx(tx, {
      itemRef: col.doc('b1'), item: bus, type: 'bus', dates: ['2026-08-10'], quantity: 2
    }))

    assert.equal((await availabilityForItems(col, [bus], 'bus', ['2026-08-10'])).b1, 0)
    assert.equal((await availabilityForItems(col, [bus], 'bus', ['2026-08-11'])).b1, 2)
  })

  test('a sold-out train class does not hide availability in another class', async () => {
    const db = newDb()
    const train = { id: 't1', [DAILY_INVENTORY_FIELD]: { classes: { SL: 1, '3A': 4 } }, [DATED_FLAG]: true }
    db.seed('trains/t1', train)
    const col = db.collection('trains')

    await db.runTransaction((tx) => reserveDatedInTx(tx, {
      itemRef: col.doc('t1'), item: train, type: 'train', dates: ['2026-08-10'], quantity: 1, classCode: 'SL'
    }))

    assert.equal((await availabilityForItems(col, [train], 'train', ['2026-08-10'], 'SL')).t1, 0)
    assert.equal((await availabilityForItems(col, [train], 'train', ['2026-08-10'], '3A')).t1, 4)
  })

  test('no dates requested means no availability reads are issued', async () => {
    const db = newDb()
    db.seed('hotels/h1', hotel('h1', 2))
    const before = db.reads
    const free = await availabilityForItems(db.collection('hotels'), [hotel('h1', 2)], 'hotel', [])
    assert.deepEqual(free, {})
    assert.equal(db.reads, before, 'quota must not be spent when the shopper gave no dates')
  })
})
