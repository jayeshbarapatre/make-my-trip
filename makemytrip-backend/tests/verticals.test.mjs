// The vertical kill switch.
//
// Cabs were closed for a while because they reserved no inventory and so sold
// the same vehicle without limit. They now book a dated slot per vehicle and
// are open again, so this suite pins the *mechanism* rather than that decision:
// whatever is listed in UNSELLABLE_TYPES must be unsellable, and everything
// else must still price.
//
// quoteTrip is the chokepoint. No quote means no signed token, which means
// create-order refuses, which means there is no captured payment for a booking
// to be built from — so closing a vertical here closes it everywhere.

import 'dotenv/config'

import { test, describe, mock, before } from 'node:test'
import assert from 'node:assert/strict'

import { newDb } from './fakeFirestore.mjs'

// Read at module load by src/config/verticals.js, so it has to be set before
// pricingService is imported.
process.env.UNSELLABLE_TYPES = 'cab'

const db = newDb()
mock.module('../src/config/firebase.js', { namedExports: { db } })
mock.module('firebase-admin/firestore', {
  namedExports: {
    Timestamp: class { static now () { return new Date() } },
    FieldValue: { serverTimestamp: () => new Date(), increment: (n) => n }
  }
})

const { quoteTrip } = await import('../src/services/pricingService.js')
const { isSellable, UNSELLABLE_TYPES } = await import('../src/config/verticals.js')

before(() => {
  mock.method(console, 'warn', () => {})
  mock.method(console, 'error', () => {})

  db.seed('cabs/cab_1', {
    from: 'Delhi', to: 'Agra', price: 3000, perKmRate: 12, distanceKm: 200, isActive: true
  })
  db.seed('buses/bus_1', {
    from: 'Delhi', to: 'Mumbai', price: 882, seatsAvailable: 30, isActive: true
  })
})

describe('a closed vertical cannot be priced', () => {
  test('the configured type is refused', async () => {
    await assert.rejects(
      () => quoteTrip({ type: 'cab', itemId: 'cab_1', quantity: 1, distance: 200 }),
      (err) => {
        assert.equal(err.code, 'VERTICAL_UNAVAILABLE')
        assert.equal(err.status, 503)
        return true
      }
    )
  })

  test('the refusal happens before any inventory is read', async () => {
    // No such document exists. A 503 rather than a 404 proves the gate closed
    // first, so a closed vertical costs no Firestore read.
    await assert.rejects(
      () => quoteTrip({ type: 'cab', itemId: 'no_such_cab', quantity: 1, distance: 10 }),
      (err) => err.code === 'VERTICAL_UNAVAILABLE'
    )
  })

  test('an open vertical still prices', async () => {
    const quote = await quoteTrip({ type: 'bus', itemId: 'bus_1', quantity: 1 })
    assert.equal(quote.type, 'bus')
    assert.ok(quote.totalAmount > 0)
  })
})

describe('the switch itself', () => {
  test('isSellable reflects the configured list', () => {
    assert.equal(isSellable('cab'), false)
    assert.equal(isSellable('bus'), true)
    assert.equal(isSellable('flight'), true)
  })

  test('it is case-insensitive', () => {
    assert.equal(isSellable('CAB'), false)
    assert.equal(isSellable('Cab'), false)
  })

  test('the list parses to exactly what was configured', () => {
    assert.deepEqual([...UNSELLABLE_TYPES], ['cab'])
  })
})

describe('nothing is closed by default', () => {
  test('an unset UNSELLABLE_TYPES sells every vertical', async () => {
    // Re-read the module's own default rather than trusting the env this suite
    // deliberately set above.
    const src = await import('node:fs/promises')
      .then((fs) => fs.readFile(new URL('../src/config/verticals.js', import.meta.url), 'utf8'))

    assert.match(src, /const DEFAULT_UNSELLABLE = ''/,
      'every vertical reserves dated inventory now, so none should ship closed')
  })
})
