// The vendor form and the server must agree on what a cab is.
//
// This vertical shipped with them disagreeing: the form wrote a single
// "Base City", search matched a from/to route, and the admin list showed one
// city column. A cab listed through the form had no destination and could never
// be found. Nothing caught it, because nothing compared the two sides.
//
// `cabModel.js` is a pure module with no imports, so it can be read directly
// from here — the comparison is against the real server enums, not a copy.

import { describe, it, expect } from 'vitest'
import {
  VehicleType, FuelType, ServiceType, DocumentType, ImageAngle, Amenity,
  PRICING_FIELDS as SERVER_PRICING_FIELDS,
  SURCHARGE_FIELDS as SERVER_SURCHARGES,
  MANDATORY_DOCUMENTS as SERVER_MANDATORY,
  DEFAULT_CANCELLATION_POLICY as SERVER_POLICY
} from '../../../makemytrip-backend/src/config/cabModel.js'

import {
  VEHICLE_TYPES, FUEL_TYPES, SERVICE_TYPES, DOCUMENT_TYPES, IMAGE_ANGLES,
  AMENITIES, PRICING_FIELDS, SURCHARGES, MANDATORY_DOCUMENTS,
  DEFAULT_CANCELLATION_POLICY
} from './cabOptions'

const values = (options) => options.map((o) => o.value).sort()
const enumValues = (e) => Object.values(e).sort()

describe('the form offers exactly what the server accepts', () => {
  it.each([
    ['vehicle types', VEHICLE_TYPES, VehicleType],
    ['fuel types', FUEL_TYPES, FuelType],
    ['service types', SERVICE_TYPES, ServiceType],
    ['document types', DOCUMENT_TYPES, DocumentType],
    ['image angles', IMAGE_ANGLES, ImageAngle],
    ['amenities', AMENITIES, Amenity]
  ])('%s match the server enum', (_name, options, serverEnum) => {
    // A value the form offers but the server rejects is silently dropped on
    // save; one the server expects but the form never offers is unreachable.
    expect(values(options)).toEqual(enumValues(serverEnum))
  })
})

describe('pricing fields match per service type', () => {
  it('covers every service the server prices, and no others', () => {
    expect(Object.keys(PRICING_FIELDS).sort()).toEqual(Object.keys(SERVER_PRICING_FIELDS).sort())
  })

  it.each(Object.keys(SERVER_PRICING_FIELDS))('%s asks for the fields the server requires', (type) => {
    const formRequired = PRICING_FIELDS[type].required.map((f) => f.key).sort()
    const formOptional = PRICING_FIELDS[type].optional.map((f) => f.key).sort()

    // Required is the one that matters: a field the server demands but the form
    // never shows makes the service impossible to configure.
    expect(formRequired).toEqual([...SERVER_PRICING_FIELDS[type].required].sort())
    expect(formOptional).toEqual([...SERVER_PRICING_FIELDS[type].optional].sort())
  })
})

describe('the rest of the shared shape matches', () => {
  it('surcharges match', () => {
    expect(SURCHARGES.map((s) => s.key).sort()).toEqual([...SERVER_SURCHARGES].sort())
  })

  it('the same documents are mandatory on both sides', () => {
    // The server refuses to accept a submission without these; the form marks
    // them so the vendor is told before they try.
    expect([...MANDATORY_DOCUMENTS].sort()).toEqual([...SERVER_MANDATORY].sort())
  })

  it('the default cancellation ladder matches', () => {
    expect(DEFAULT_CANCELLATION_POLICY.map(({ minHoursBefore, feePercent }) => ({ minHoursBefore, feePercent })))
      .toEqual(SERVER_POLICY.map(({ minHoursBefore, feePercent }) => ({ minHoursBefore, feePercent })))
  })
})
