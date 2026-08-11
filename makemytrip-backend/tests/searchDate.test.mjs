// Flight schedules are wall-clock values, not instants.
//
// "15 Aug, 20:00" means 20:00 at the airport. flightAdminController stores that
// as 2026-08-15T20:00:00.000Z and reads it back unchanged, so the number an
// admin types is the number they see and the number search shows.
//
// Search used to run those same values through an IST conversion, which moved
// anything departing at or after 18:30 into the FOLLOWING day: a 20:00
// departure on the 15th became 01:30 IST on the 16th and disappeared from a
// search for its own date. No test caught it because the seeder only generates
// morning and afternoon departures — the first evening flight anyone created
// was the first to fall through.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { wallClockDayRange, istDayRangeUtc, parseSearchDate } from '../src/utils/searchDate.js'

const within = (iso, range) => iso >= range.startIso && iso <= range.endIso

describe('a wall-clock day covers its own departures', () => {
  const day = wallClockDayRange('2026-08-15')

  test('an evening departure belongs to the day it departs', () => {
    // The exact case reported: admin created a 20:00 flight, search found none.
    assert.equal(within('2026-08-15T20:00:00.000Z', day), true)
  })

  test('the whole day is covered, midnight to just before the next', () => {
    assert.equal(within('2026-08-15T00:00:00.000Z', day), true)
    assert.equal(within('2026-08-15T23:59:59.999Z', day), true)
  })

  test('neighbouring days are excluded', () => {
    assert.equal(within('2026-08-14T23:59:59.999Z', day), false)
    assert.equal(within('2026-08-16T00:00:00.000Z', day), false)
  })

  test('an invalid date yields no window rather than a wrong one', () => {
    for (const bad of ['', 'tomorrow', '15-08-2026', null, undefined]) {
      assert.equal(wallClockDayRange(bad), null)
    }
  })
})

describe('why the IST window was wrong for this data', () => {
  test('it pushed evening departures into the next day', () => {
    // Kept as a regression note: the two helpers disagree exactly where the bug
    // lived, so swapping back would fail this test rather than pass silently.
    const ist = istDayRangeUtc('2026-08-15')
    const wall = wallClockDayRange('2026-08-15')
    const eveningDeparture = '2026-08-15T20:00:00.000Z'

    assert.equal(within(eveningDeparture, ist), false, 'the old behaviour that lost the flight')
    assert.equal(within(eveningDeparture, wall), true, 'the behaviour that finds it')
  })

  test('morning departures matched under both, which is why this went unnoticed', () => {
    const morning = '2026-08-15T09:00:00.000Z'
    assert.equal(within(morning, istDayRangeUtc('2026-08-15')), true)
    assert.equal(within(morning, wallClockDayRange('2026-08-15')), true)
  })
})

describe('date parsing is unchanged', () => {
  test('accepts YYYY-MM-DD and rejects anything else', () => {
    assert.equal(parseSearchDate('2026-08-15'), '2026-08-15')
    assert.equal(parseSearchDate('15/08/2026'), null)
  })
})
