// What the Add Cab wizard will and will not let through.
//
// The rules that matter here are the ones whose absence caused real defects:
// a cab with no route (unfindable in search), a service with no price (nothing
// to charge at checkout), and a plate that is not a plate (duplicates cannot be
// detected). Each is pinned rather than left to the form's markup.

import { describe, it, expect } from 'vitest'
import { STEPS, emptyCab, incompleteSteps, toPayload, isValidPlate, normalizePlate } from './steps'

const stepFor = (key) => STEPS.find((s) => s.key === key)

/** A cab that satisfies every step, used as the baseline to break one at a time. */
const completeCab = () => ({
  ...emptyCab(),
  cabName: 'Phase1 Cabs',
  vehicleNumber: 'GJ01AB2024',
  seatingCapacity: 6,
  city: 'Ahmedabad',
  routes: [{ from: 'Ahmedabad', to: 'Udaipur' }],
  serviceTypes: ['OUTSTATION_ONE_WAY'],
  pricing: { OUTSTATION_ONE_WAY: { baseFare: 800, perKm: 13 } },
  documents: [
    { type: 'RC', number: 'RC-1', expiryDate: '2030-01-01' },
    { type: 'INSURANCE', number: 'INS-1', expiryDate: '2030-01-01' },
    { type: 'PERMIT', number: 'PMT-1', expiryDate: '2030-01-01' }
  ],
  images: [{ url: 'https://example.test/a.jpg', angle: 'FRONT', isPrimary: true }]
})

describe('a cab must say where it goes', () => {
  it('accepts a cab with a route', () => {
    expect(stepFor('location').validate(completeCab())).toEqual({})
  })

  it('refuses a cab with an operating city but no route', () => {
    // The exact defect: the old form collected one city and no destination, so
    // the cab could never match a search that named one.
    const cab = { ...completeCab(), routes: [] }
    expect(stepFor('location').validate(cab).routes).toBeTruthy()
  })

  it('refuses a half-filled route', () => {
    const cab = { ...completeCab(), routes: [{ from: 'Ahmedabad', to: '' }] }
    expect(stepFor('location').validate(cab)['routes.0']).toBeTruthy()
  })

  it('refuses a route to the same city', () => {
    const cab = { ...completeCab(), routes: [{ from: 'Surat', to: 'surat' }] }
    expect(stepFor('location').validate(cab)['routes.0']).toBeTruthy()
  })
})

describe('a service cannot be offered unpriced', () => {
  it('refuses a declared service with no pricing', () => {
    const cab = { ...completeCab(), pricing: {} }
    expect(stepFor('pricing').validate(cab)['pricing.OUTSTATION_ONE_WAY.baseFare']).toBeTruthy()
  })

  it('refuses a service missing one required rate', () => {
    const cab = { ...completeCab(), pricing: { OUTSTATION_ONE_WAY: { baseFare: 800 } } }
    expect(stepFor('pricing').validate(cab)['pricing.OUTSTATION_ONE_WAY.perKm']).toBeTruthy()
  })

  it('only demands the fields that service actually uses', () => {
    // An hourly rental has no per-km rate, so asking for one would make the
    // step impossible to complete.
    const cab = {
      ...completeCab(),
      serviceTypes: ['HOURLY_RENTAL'],
      pricing: { HOURLY_RENTAL: { perHour: 250, minimumHours: 4 } }
    }
    expect(stepFor('pricing').validate(cab)).toEqual({})
  })
})

describe('registration numbers', () => {
  it('accepts real formats and normalises them', () => {
    expect(isValidPlate('GJ 01 AB 2024')).toBe(true)
    expect(isValidPlate('23BH1234A')).toBe(true)
    expect(normalizePlate('gj-01-ab-2024')).toBe('GJ01AB2024')
  })

  it('rejects anything else', () => {
    expect(isValidPlate('NOTAPLATE')).toBe(false)
    expect(stepFor('vehicle').validate({ ...completeCab(), vehicleNumber: 'NOTAPLATE' }).vehicleNumber)
      .toBeTruthy()
  })
})

describe('documents gate the submission', () => {
  it('names the missing mandatory documents', () => {
    const cab = { ...completeCab(), documents: [{ type: 'RC', number: 'RC-1' }] }
    const error = stepFor('documents').validate(cab).documents
    expect(error).toContain('INSURANCE')
    expect(error).toContain('PERMIT')
  })

  it('rejects an already-expired document', () => {
    const cab = {
      ...completeCab(),
      documents: [
        { type: 'RC', number: 'RC-1', expiryDate: '2000-01-01' },
        { type: 'INSURANCE', number: 'I', expiryDate: '2030-01-01' },
        { type: 'PERMIT', number: 'P', expiryDate: '2030-01-01' }
      ]
    }
    expect(stepFor('documents').validate(cab)['documents.0']).toBeTruthy()
  })
})

describe('the review step reports what is still outstanding', () => {
  it('reports nothing for a complete cab', () => {
    expect(incompleteSteps(completeCab())).toEqual([])
  })

  it('reports every unfinished step, not just the first', () => {
    const bare = emptyCab()
    const keys = incompleteSteps(bare).map((s) => s.key)
    expect(keys).toContain('vehicle')
    expect(keys).toContain('location')
    expect(keys).toContain('services')
    expect(keys).toContain('documents')
    expect(keys).toContain('images')
  })
})

describe('the payload sent to the server', () => {
  it('drops half-filled routes rather than sending them', () => {
    const cab = { ...completeCab(), routes: [{ from: 'Ahmedabad', to: 'Udaipur' }, { from: 'Surat', to: '' }] }
    expect(toPayload(cab).routes).toEqual([{ from: 'Ahmedabad', to: 'Udaipur' }])
  })

  it('normalises the plate so duplicates are comparable', () => {
    expect(toPayload({ ...completeCab(), vehicleNumber: 'gj 01 ab 2024' }).vehicleNumber).toBe('GJ01AB2024')
  })

  it('carries a flat fare so the existing search and fare path still work', () => {
    // Legacy cabs are priced from `price` + `perKmRate`; an upgraded cab that
    // sent neither would drop to zero in the current fare engine.
    const payload = toPayload(completeCab())
    expect(payload.price).toBe(800)
    expect(payload.perKmRate).toBe(13)
  })

  it('does not send wizard-only state', () => {
    expect(toPayload({ ...completeCab(), driverId: 'drv_1' }).driverId).toBeUndefined()
  })
})
