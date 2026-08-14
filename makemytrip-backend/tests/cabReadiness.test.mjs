// What stops a cab reaching the approval queue.
//
// The rule that matters most here is the one that is currently *relaxed*:
// documents and photos are required by the spec, but the screen that collects
// them has not shipped yet, so blocking on them would leave a vendor unable to
// submit anything. Both settings are pinned, so turning the gate on when the
// upload steps land is a checked change rather than a hope.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { readinessProblems } from '../src/services/cabReadiness.js'

const yesterday = new Date(Date.now() - 86_400_000).toISOString()
const nextYear = new Date(Date.now() + 365 * 86_400_000).toISOString()

const papers = [
  { type: 'RC', number: 'RC-1', expiryDate: nextYear },
  { type: 'INSURANCE', number: 'INS-1', expiryDate: nextYear },
  { type: 'PERMIT', number: 'PMT-1', expiryDate: nextYear }
]

/** A cab that is complete apart from whatever a test removes. */
const readyCab = () => ({
  routes: [{ from: 'Ahmedabad', to: 'Udaipur' }],
  serviceTypes: ['OUTSTATION_ONE_WAY'],
  pricing: { OUTSTATION_ONE_WAY: { baseFare: 800, perKm: 13 } },
  documents: papers,
  images: [{ url: 'https://example.test/a.jpg', angle: 'FRONT', isPrimary: true }]
})

describe('a cab with no route cannot be submitted', () => {
  test('no route at all is blocking', () => {
    const { blocking } = readinessProblems({ ...readyCab(), routes: [], from: null, to: null })
    assert.equal(blocking.length, 1)
    assert.match(blocking[0], /route/i)
  })

  test('a legacy flat from/to counts as a route', () => {
    const cab = { ...readyCab(), routes: [], from: 'Delhi', to: 'Jaipur' }
    assert.deepEqual(readinessProblems(cab).blocking, [])
  })

  test('a pickup with no destination does not count', () => {
    // The cab the old form produced: from = "Nepal", no destination.
    const cab = { ...readyCab(), routes: [], from: 'Nepal', to: undefined }
    assert.equal(readinessProblems(cab).blocking.length, 1)
  })
})

describe('a service that is offered must be priced', () => {
  test('an unpriced service is blocking', () => {
    const { blocking } = readinessProblems({ ...readyCab(), pricing: {} })
    assert.equal(blocking.length, 1)
    assert.match(blocking[0], /pricing/i)
  })
})

describe('expired paperwork is always blocking', () => {
  test('a lapsed document blocks even while uploads are unavailable', () => {
    // Not a missing file — a vehicle that is not road-legal today.
    const cab = {
      ...readyCab(),
      documents: [{ type: 'RC', number: 'RC-1', expiryDate: yesterday }, ...papers.slice(1)]
    }
    const { blocking } = readinessProblems(cab, { uploadsAvailable: false })
    assert.equal(blocking.length, 1)
    assert.match(blocking[0], /expired/i)
  })
})

describe('missing uploads are advisory until the upload screen exists', () => {
  const bare = () => ({ ...readyCab(), documents: [], images: [] })

  test('with no upload screen, they warn rather than refuse', () => {
    const { blocking, advisory } = readinessProblems(bare(), { uploadsAvailable: false })

    assert.deepEqual(blocking, [], 'a vendor with no way to upload must still be able to submit')
    assert.equal(advisory.length, 2)
    assert.ok(advisory.some((a) => /RC, INSURANCE, PERMIT/.test(a)))
    assert.ok(advisory.some((a) => /photo/i.test(a)))
  })

  test('once the upload screen exists, the same two refuse the submission', () => {
    const { blocking, advisory } = readinessProblems(bare(), { uploadsAvailable: true })

    assert.equal(blocking.length, 2)
    assert.deepEqual(advisory, [])
  })

  test('a complete cab is clean either way', () => {
    for (const uploadsAvailable of [true, false]) {
      const { blocking, advisory } = readinessProblems(readyCab(), { uploadsAvailable })
      assert.deepEqual(blocking, [], `blocking with uploadsAvailable=${uploadsAvailable}`)
      assert.deepEqual(advisory, [], `advisory with uploadsAvailable=${uploadsAvailable}`)
    }
  })
})
