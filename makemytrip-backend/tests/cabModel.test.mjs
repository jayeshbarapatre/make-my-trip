// The cab domain rules, pinned.
//
// These exist because the cab vertical shipped with three components each
// holding a different idea of what a cab is: the vendor form stored one city,
// the search matched a from/to route, and the admin list showed a single city
// column. A cab listed through the form had no destination and could therefore
// never be found by any customer who named one — 289 seeded cabs worked and the
// one real vendor cab did not.
//
// Everything here is a pure function on purpose, so the rules can be tested
// without a datastore and cannot drift back into the components.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  CabStatus,
  ServiceType,
  DocumentType,
  isSellable,
  expiredDocuments,
  missingMandatoryDocuments,
  sellableServiceTypes,
  servesRoute,
  isValidPlate,
  normalizePlate
} from '../src/config/cabModel.js'

/** Stands in for `cityMatches`, which the controllers pass through. */
const matcher = (stored, query) => {
  if (!query) return true
  if (!stored) return false
  return String(stored).trim().toLowerCase() === String(query).trim().toLowerCase()
}

describe('only an approved, switched-on cab may be sold', () => {
  test('a cab awaiting approval is not sellable', () => {
    assert.equal(isSellable({ listingStatus: CabStatus.PENDING_APPROVAL, isActive: true }), false)
  })

  test('a rejected or suspended cab is not sellable', () => {
    assert.equal(isSellable({ listingStatus: CabStatus.REJECTED, isActive: true }), false)
    assert.equal(isSellable({ listingStatus: CabStatus.SUSPENDED, isActive: true }), false)
    assert.equal(isSellable({ listingStatus: CabStatus.DOCUMENT_EXPIRED, isActive: true }), false)
  })

  test('an approved cab that has been switched off is not sellable', () => {
    assert.equal(isSellable({ listingStatus: CabStatus.APPROVED, isActive: false }), false)
  })

  test('an approved, active cab is sellable', () => {
    assert.equal(isSellable({ listingStatus: CabStatus.APPROVED, isActive: true }), true)
    assert.equal(isSellable({ listingStatus: CabStatus.ACTIVE, isActive: true }), true)
  })

  test('a cab from before the lifecycle existed keeps selling', () => {
    // The 290 already in Firestore carry no listingStatus. Treating an absent
    // status as "not approved" would take every one of them off sale.
    assert.equal(isSellable({ isActive: true }), true)
    assert.equal(isSellable({}), true)
    assert.equal(isSellable({ isActive: false }), false)
  })

  test('a deleted cab is never sellable', () => {
    assert.equal(isSellable({ listingStatus: CabStatus.ACTIVE, isActive: true, isDeleted: true }), false)
  })
})

describe('a cab is only offered on the routes it actually serves', () => {
  const cab = {
    routes: [
      { from: 'Ahmedabad', to: 'Udaipur' },
      { from: 'Ahmedabad', to: 'Surat' }
    ]
  }

  test('a declared route matches', () => {
    assert.equal(servesRoute(cab, { from: 'Ahmedabad', to: 'Udaipur' }, matcher), true)
    assert.equal(servesRoute(cab, { from: 'Ahmedabad', to: 'Surat' }, matcher), true)
  })

  test('a matching pickup with an unserved destination does NOT match', () => {
    // §35. The whole point: an Ahmedabad cab is not automatically an
    // Ahmedabad -> Jaipur cab.
    assert.equal(servesRoute(cab, { from: 'Ahmedabad', to: 'Jaipur' }, matcher), false)
  })

  test('the reverse direction is not assumed', () => {
    assert.equal(servesRoute(cab, { from: 'Udaipur', to: 'Ahmedabad' }, matcher), false)
  })

  test('a legacy single-route cab still matches', () => {
    assert.equal(servesRoute({ from: 'Delhi', to: 'Jaipur' }, { from: 'Delhi', to: 'Jaipur' }, matcher), true)
    assert.equal(servesRoute({ from: 'Delhi', to: 'Jaipur' }, { from: 'Delhi', to: 'Agra' }, matcher), false)
  })

  test('a cab with no destination at all matches nothing that names one', () => {
    // Exactly the cab the old vendor form produced.
    assert.equal(servesRoute({ from: 'Nepal' }, { from: 'Nepal', to: 'Ahmedabad' }, matcher), false)
  })
})

describe('a service type is only sellable once it is priced', () => {
  test('a declared service with no pricing is not offered', () => {
    const cab = { serviceTypes: [ServiceType.OUTSTATION_ONE_WAY], pricing: {} }
    assert.deepEqual(sellableServiceTypes(cab), [])
  })

  test('a service missing one required rate is not offered', () => {
    const cab = {
      serviceTypes: [ServiceType.OUTSTATION_ONE_WAY],
      pricing: { [ServiceType.OUTSTATION_ONE_WAY]: { baseFare: 500 } }
    }
    assert.deepEqual(sellableServiceTypes(cab), [])
  })

  test('a fully priced service is offered', () => {
    const cab = {
      serviceTypes: [ServiceType.OUTSTATION_ONE_WAY, ServiceType.HOURLY_RENTAL],
      pricing: {
        [ServiceType.OUTSTATION_ONE_WAY]: { baseFare: 500, perKm: 12 },
        [ServiceType.HOURLY_RENTAL]: { perHour: 200 }
      }
    }
    // Hourly needs minimumHours too, so only the outstation service qualifies.
    assert.deepEqual(sellableServiceTypes(cab), [ServiceType.OUTSTATION_ONE_WAY])
  })
})

describe('paperwork gates a cab', () => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString()
  const nextYear = new Date(Date.now() + 365 * 86_400_000).toISOString()

  test('a lapsed document is reported', () => {
    const cab = { documents: [{ type: DocumentType.INSURANCE, expiryDate: yesterday }] }
    assert.equal(expiredDocuments(cab).length, 1)
  })

  test('a valid document is not reported', () => {
    const cab = { documents: [{ type: DocumentType.INSURANCE, expiryDate: nextYear }] }
    assert.equal(expiredDocuments(cab).length, 0)
  })

  test('a document with no expiry is not treated as expired', () => {
    const cab = { documents: [{ type: DocumentType.RC }] }
    assert.equal(expiredDocuments(cab).length, 0)
  })

  test('the road-legal set is required', () => {
    assert.deepEqual(
      missingMandatoryDocuments({ documents: [{ type: DocumentType.RC }] }),
      [DocumentType.INSURANCE, DocumentType.PERMIT]
    )
    assert.deepEqual(
      missingMandatoryDocuments({
        documents: [
          { type: DocumentType.RC },
          { type: DocumentType.INSURANCE },
          { type: DocumentType.PERMIT }
        ]
      }),
      []
    )
  })
})

describe('registration numbers are validated, not just collected', () => {
  test('accepts the formats actually issued in India', () => {
    for (const plate of ['GJ01AB1234', 'MH-12-AB-1234', 'mh 12 ab 1234', 'DL3CAB4567', '23BH1234A']) {
      assert.equal(isValidPlate(plate), true, `${plate} should be valid`)
    }
  })

  test('rejects anything that is not a plate', () => {
    for (const plate of ['', 'ABCD', '1234', 'GJ01AB', 'XX-01-AA-1111-2', 'hello world']) {
      assert.equal(isValidPlate(plate), false, `${plate} should be rejected`)
    }
  })

  test('normalises spacing and case so duplicates cannot slip through', () => {
    assert.equal(normalizePlate('mh-12-ab-1234'), 'MH12AB1234')
    assert.equal(normalizePlate(' GJ 01 AB 1234 '), 'GJ01AB1234')
  })
})
