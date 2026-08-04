// Bus search, end to end through the real controller.
//
// Pins the defect that made the Bus Results page render "0 of 0 buses" on
// routes that had inventory: `npm run seed:buses` wrote documents without the
// denormalised `fromCanonical`/`toCanonical` fields, while the admin and vendor
// create paths wrote them. That left the collection PARTIALLY indexed, and an
// equality filter on `fromCanonical` cannot match a document that has no such
// field — so every seeded bus was invisible while the collection still looked
// "indexed" to the one-document readiness probe.
//
// The datastore is faked. Doing this against real Firestore costs read quota
// (this project has exhausted the free-tier daily allowance more than once,
// which is itself how the page went blank), and a test that cannot be reset
// between runs is not a test.

import 'dotenv/config'

import { test, describe, mock, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { newDb } from './fakeFirestore.mjs'

const db = newDb()

// Must be mocked before anything under src/ is imported: the controller closes
// over the `db` binding at module scope.
mock.module('../src/config/firebase.js', { namedExports: { db } })

const { searchBuses } = await import('../src/controllers/firebaseBusController.js')
const { resetIndexReadiness } = await import('../src/services/inventorySearch.js')
const { buildAllBuses, buildBusesForRoute } = await import('../scripts/lib/busInventory.js')

/** The seven routes the Bus Results page must return inventory for. */
const REQUIRED_ROUTES = [
  ['Chennai', 'Bengaluru'],
  ['Bengaluru', 'Chennai'],
  ['Delhi', 'Jaipur'],
  ['Mumbai', 'Pune'],
  ['Hyderabad', 'Chennai'],
  ['Ahmedabad', 'Surat'],
  ['Jaipur', 'Delhi']
]

const seedInventory = (docs) => {
  db.records.clear()
  db.versions.clear()
  for (const { id, data } of docs) db.seed(`buses/${id}`, data)
  resetIndexReadiness()
}

/** Runs the controller and returns { status, body } like a client would see. */
const search = async (query) => {
  let status = 200
  let body = null
  const res = {
    status (code) { status = code; return this },
    json (payload) { body = payload; return this }
  }
  await searchBuses({ query }, res)
  return { status, body }
}

before(() => {
  // The controller logs a line per search; keep the suite output readable.
  mock.method(console, 'log', () => {})
  mock.method(console, 'warn', () => {})
})

describe('bus inventory', () => {
  beforeEach(() => seedInventory(buildAllBuses(15)))

  test('the seed produces at least 100 buses', () => {
    const docs = buildAllBuses(15)
    assert.ok(docs.length >= 100, `expected 100+ buses, built ${docs.length}`)
  })

  test('every bus carries the fields search and booking depend on', () => {
    for (const { id, data } of buildAllBuses(15)) {
      for (const field of [
        'from', 'to', 'fromCanonical', 'toCanonical', 'routeIndexed',
        'departureTime', 'arrivalTime', 'seatsAvailable', 'totalSeats',
        'price', 'busType', 'category', 'operatorName', 'isActive'
      ]) {
        assert.ok(data[field] !== undefined && data[field] !== null, `${id} is missing ${field}`)
      }
      assert.equal(data.isActive, true, `${id} must be active`)
      assert.equal(data.routeIndexed, true, `${id} must be route-indexed`)
      assert.ok(data.seatsAvailable > 0, `${id} must have bookable seats`)
    }
  })

  test('inventory spans operators, classes and every departure window', () => {
    const docs = buildAllBuses(15).map((d) => d.data)

    assert.ok(new Set(docs.map((d) => d.operatorName)).size >= 5, 'needs multiple operators')
    assert.ok(new Set(docs.map((d) => d.price)).size >= 20, 'needs varied prices')

    for (const category of ['AC', 'Non-AC', 'Sleeper', 'Luxury']) {
      assert.ok(docs.some((d) => d.category === category), `no ${category} buses`)
    }
    assert.ok(docs.some((d) => d.isAc === true), 'no AC buses')
    assert.ok(docs.some((d) => d.isAc === false), 'no non-AC buses')
    assert.ok(docs.some((d) => d.berthType === 'sleeper'), 'no sleeper buses')
    assert.ok(docs.some((d) => d.berthType === 'seater'), 'no seater buses')
    assert.ok(docs.some((d) => /Volvo|Scania/.test(d.busType)), 'no Volvo/luxury coaches')

    const hour = (d) => Number(d.departureTime.split(':')[0])
    assert.ok(docs.some((d) => hour(d) >= 4 && hour(d) < 12), 'no morning departures')
    assert.ok(docs.some((d) => hour(d) >= 12 && hour(d) < 18), 'no afternoon departures')
    assert.ok(docs.some((d) => hour(d) >= 18 && hour(d) < 22), 'no evening departures')
    assert.ok(docs.some((d) => hour(d) >= 22 || hour(d) < 4), 'no night departures')
  })
})

describe('bus search returns results on every required route', () => {
  beforeEach(() => seedInventory(buildAllBuses(15)))

  for (const [from, to] of REQUIRED_ROUTES) {
    test(`${from} → ${to}`, async () => {
      const { status, body } = await search({ from, to, date: '2026-08-04', passengers: '1' })

      assert.equal(status, 200)
      assert.ok(body.data.length > 0, `${from} → ${to} returned zero buses`)
      assert.ok(body.pagination.total > 0, 'pagination reports zero')

      for (const bus of body.data) {
        assert.equal(bus.isAvailable, true, `${bus.busNumber} came back unavailable`)
        assert.ok(bus.availableSeats > 0)
        assert.ok(bus.price > 0)
        assert.ok(bus.id, 'a bus without an id cannot be booked')
      }
    })
  }

  test('the city picker spelling matches stored inventory', async () => {
    // The picker sends "Bengaluru"; some inventory stores "Bangalore".
    const a = await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04' })
    const b = await search({ from: 'Chennai', to: 'Bangalore', date: '2026-08-04' })
    assert.ok(a.body.data.length > 0)
    assert.equal(a.body.pagination.total, b.body.pagination.total)
  })

  test('a route with no inventory honestly returns zero', async () => {
    const { body } = await search({ from: 'Chennai', to: 'Guwahati', date: '2026-08-04' })
    assert.equal(body.data.length, 0)
  })
})

describe('partially indexed inventory stays visible', () => {
  test('unindexed buses are still found when part of the collection is indexed', async () => {
    // Exactly the production shape: legacy seeded buses with no canonical
    // fields, alongside one admin-created bus that has them.
    const legacy = buildBusesForRoute({ from: 'Chennai', to: 'Bengaluru', km: 350 }, 6)
      .map(({ id, data }) => {
        const { fromCanonical, toCanonical, routeIndexed, ...rest } = data
        return { id: `legacy-${id}`, data: rest }
      })

    const indexedElsewhere = buildBusesForRoute({ from: 'Mumbai', to: 'Pune', km: 150 }, 2)

    seedInventory([...legacy, ...indexedElsewhere])

    const { body } = await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04' })

    assert.equal(body.pagination.total, 6, 'unindexed inventory must not vanish from search')
  })

  test('a fully indexed collection uses the indexed query and reads only the route', async () => {
    seedInventory(buildAllBuses(15))

    // Warm the readiness probe so its reads are not counted below.
    await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04' })

    const before = db.reads
    await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04' })
    const read = db.reads - before

    // 15 buses on the route + one availability read each. The point is that it
    // is nowhere near the ~195 documents a full collection scan would pull.
    assert.ok(read < 60, `expected an indexed read, pulled ${read} documents`)
  })
})

describe('sorting', () => {
  beforeEach(() => seedInventory(buildAllBuses(15)))

  const criteria = { from: 'Chennai', to: 'Bengaluru', date: '2026-08-04', limit: '50' }

  test('price ascending is the default', async () => {
    const { body } = await search(criteria)
    const prices = body.data.map((b) => b.price)
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b))
  })

  test('price descending', async () => {
    const { body } = await search({ ...criteria, sortBy: 'price_desc' })
    const prices = body.data.map((b) => b.price)
    assert.deepEqual(prices, [...prices].sort((a, b) => b - a))
  })

  test('duration', async () => {
    const { body } = await search({ ...criteria, sortBy: 'duration' })
    const mins = body.data.map((b) => b.durationMinutes)
    assert.deepEqual(mins, [...mins].sort((a, b) => a - b))
  })

  test('departure time', async () => {
    const { body } = await search({ ...criteria, sortBy: 'departure' })
    const times = body.data.map((b) => b.departureTime)
    assert.deepEqual(times, [...times].sort())
  })

  test('rating, best first', async () => {
    const { body } = await search({ ...criteria, sortBy: 'rating' })
    const ratings = body.data.map((b) => b.rating)
    assert.deepEqual(ratings, [...ratings].sort((a, b) => b - a))
  })
})

describe('filtering', () => {
  beforeEach(() => seedInventory(buildAllBuses(15)))

  const criteria = { from: 'Chennai', to: 'Bengaluru', date: '2026-08-04', limit: '50' }

  test('price window', async () => {
    const all = await search(criteria)
    const prices = all.body.data.map((b) => b.price)
    const min = Math.min(...prices) + 1
    const max = Math.max(...prices) - 1

    const { body } = await search({ ...criteria, minPrice: String(min), maxPrice: String(max) })

    assert.ok(body.data.length > 0, 'the price window filtered everything out')
    assert.ok(body.data.length < all.body.data.length, 'the price window filtered nothing')
    for (const bus of body.data) {
      assert.ok(bus.price >= min && bus.price <= max, `${bus.price} is outside ₹${min}-₹${max}`)
    }
  })

  test('operator', async () => {
    const all = await search(criteria)
    const operator = all.body.data[0].operatorName

    const { body } = await search({ ...criteria, operator })

    assert.ok(body.data.length > 0)
    for (const bus of body.data) assert.equal(bus.operatorName, operator)
  })

  test('bus type', async () => {
    const { body } = await search({ ...criteria, busType: 'Sleeper' })
    assert.ok(body.data.length > 0, 'no sleeper buses matched')
    for (const bus of body.data) assert.match(bus.busType, /Sleeper/i)
  })

  test('passenger count excludes buses that cannot seat the party', async () => {
    const { body } = await search({ ...criteria, passengers: '40' })
    for (const bus of body.data) {
      assert.ok(bus.seatsAvailable >= 40, `${bus.busNumber} has only ${bus.seatsAvailable} seats`)
    }
  })

  test('total price scales with the party size', async () => {
    const { body } = await search({ ...criteria, passengers: '3' })
    for (const bus of body.data) {
      assert.equal(bus.totalPrice, bus.price * 3)
      assert.equal(bus.passengers, 3)
    }
  })
})

describe('pagination', () => {
  beforeEach(() => seedInventory(buildAllBuses(15)))

  test('pages do not overlap and cover the route', async () => {
    const criteria = { from: 'Chennai', to: 'Bengaluru', date: '2026-08-04', limit: '5' }

    const p1 = await search({ ...criteria, page: '1' })
    const p2 = await search({ ...criteria, page: '2' })

    assert.equal(p1.body.data.length, 5)
    assert.equal(p1.body.pagination.total, 15)
    assert.equal(p1.body.pagination.pages, 3)

    const ids = new Set([...p1.body.data, ...p2.body.data].map((b) => b.id))
    assert.equal(ids.size, 10, 'pages overlap')
  })
})

describe('failures are not reported as "no buses"', () => {
  beforeEach(() => seedInventory(buildAllBuses(15)))

  test('an exhausted read quota returns 503, not an empty result set', async () => {
    const original = db.collection.bind(db)
    db.collection = () => {
      const err = new Error('8 RESOURCE_EXHAUSTED: Quota exceeded.')
      err.code = 8
      throw err
    }

    try {
      const { status, body } = await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04' })
      assert.equal(status, 503)
      assert.equal(body.code, 'SEARCH_UNAVAILABLE')
      assert.equal(body.data, undefined, 'a failed search must not present an empty bus list')
    } finally {
      db.collection = original
    }
  })

  test('an unexpected failure returns 500, not an empty result set', async () => {
    const original = db.collection.bind(db)
    db.collection = () => { throw new Error('boom') }

    try {
      const { status, body } = await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04' })
      assert.equal(status, 500)
      assert.equal(body.code, 'SEARCH_FAILED')
      assert.equal(body.data, undefined)
    } finally {
      db.collection = original
    }
  })
})

describe('dated availability', () => {
  beforeEach(() => seedInventory(buildAllBuses(15)))

  test('seats sold on one date do not reduce availability on another', async () => {
    const first = await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04' })
    const bus = first.body.data[0]

    // Sell the whole bus on 4 Aug.
    db.seed(`buses/${bus.id}/availability/2026-08-04`, {
      date: '2026-08-04',
      total: bus.totalSeats,
      booked: bus.totalSeats
    })

    const sameDay = await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-04', limit: '50' })
    const nextDay = await search({ from: 'Chennai', to: 'Bengaluru', date: '2026-08-05', limit: '50' })

    const soldOut = sameDay.body.data.find((b) => b.id === bus.id)
    const stillFree = nextDay.body.data.find((b) => b.id === bus.id)

    assert.equal(soldOut.availableSeats, 0)
    assert.equal(soldOut.isAvailable, false)
    assert.equal(stillFree.availableSeats, bus.totalSeats)
    assert.equal(stillFree.isAvailable, true)
  })

  test('availability is reported per travel date, not from a global counter', async () => {
    const { body } = await search({ from: 'Mumbai', to: 'Pune', date: '2026-08-04' })
    for (const bus of body.data) assert.equal(bus.availabilityBasis, 'dates')
  })
})
