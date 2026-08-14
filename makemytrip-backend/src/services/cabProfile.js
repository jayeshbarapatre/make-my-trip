/**
 * Turns what a cab form submits into what Firestore stores, and says what is
 * wrong when it cannot.
 *
 * Pure on purpose. The vendor controller and the admin controller both call it,
 * so the two cannot drift into accepting different shapes — which is exactly
 * what happened before: the vendor form wrote `currentCity` and no destination
 * while search read `from`/`to`, and nothing reconciled them.
 *
 * BACKWARD COMPATIBILITY
 *
 * Every rich field is optional. A body carrying only the old flat fields
 * (`from`, `to`, `price`, `perKmRate`) still validates and still stores, so the
 * 290 cabs already in Firestore keep working and can be edited without being
 * forced through the full multi-step form.
 */

import {
  VehicleType, FuelType, ServiceType, DocumentType, VerificationStatus,
  ImageAngle, Amenity, PRICING_FIELDS, SURCHARGE_FIELDS,
  DEFAULT_CANCELLATION_POLICY, CANCELLATION_BOUNDS,
  isValidPlate, normalizePlate
} from '../config/cabModel.js'
import { canonicalCity } from '../utils/cities.js'

/**
 * One key per route the cab serves, so a multi-route cab can be found with a
 * single `array-contains` instead of a collection scan.
 *
 * The existing route index stores one `fromCanonical`/`toCanonical` pair per
 * document, which can only ever describe a cab's first route. Written here so
 * the data is correct from the moment a cab is saved; the search still reads
 * the flat pair until Phase 2 switches it over.
 */
export const routeKeysFor = (routes, from, to) => {
  const pairs = routes?.length ? routes : (from && to ? [{ from, to }] : [])

  return [...new Set(
    pairs
      .map((r) => {
        const f = canonicalCity(r.from) ?? String(r.from ?? '').trim().toLowerCase()
        const t = canonicalCity(r.to) ?? String(r.to ?? '').trim().toLowerCase()
        return f && t ? `${f}__${t}` : null
      })
      .filter(Boolean)
  )]
}

const num = (v, fallback = null) => {
  if (v === undefined || v === null || v === '') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const str = (v) => (v === undefined || v === null ? null : String(v).trim())
const arr = (v) => (Array.isArray(v) ? v : [])
const inEnum = (value, enumObj) => Object.values(enumObj).includes(value)

const CURRENT_YEAR = new Date().getFullYear()

/* ────────────────────────────── validation ────────────────────────────── */

const validateVehicle = (body, errors, partial) => {
  if (!partial) {
    if (!str(body.cabName ?? body.operatorName)) errors.cabName = 'Cab name is required'
    if (!str(body.vehicleNumber ?? body.cabNumber)) errors.vehicleNumber = 'Vehicle number is required'
  }

  const plate = body.vehicleNumber ?? body.cabNumber
  // Collected *and* checked. A plate that is not a plate cannot be matched
  // against a duplicate, and duplicate vehicles are the one thing a fleet
  // listing must never allow.
  if (plate !== undefined && !isValidPlate(plate)) {
    errors.vehicleNumber = 'Enter a valid registration number, e.g. GJ01AB1234'
  }

  if (body.vehicleType !== undefined && !inEnum(body.vehicleType, VehicleType)) {
    errors.vehicleType = 'Unknown vehicle type'
  }
  if (body.fuelType !== undefined && !inEnum(body.fuelType, FuelType)) {
    errors.fuelType = 'Unknown fuel type'
  }

  const year = num(body.manufacturingYear)
  if (year !== null && (year < 1990 || year > CURRENT_YEAR + 1)) {
    errors.manufacturingYear = `Year must be between 1990 and ${CURRENT_YEAR + 1}`
  }

  const seats = num(body.seatingCapacity ?? body.capacity ?? body.cabs)
  if (seats !== null && (seats < 1 || seats > 26)) {
    errors.seatingCapacity = 'Seating capacity must be between 1 and 26'
  }

  const luggage = num(body.luggageCapacity)
  if (luggage !== null && luggage < 0) errors.luggageCapacity = 'Luggage capacity cannot be negative'
}

const validateRoutes = (body, errors, partial) => {
  const routes = arr(body.routes)

  if (routes.length) {
    // §35. An operating city is not a route: a cab based in Ahmedabad is only
    // an Ahmedabad -> Udaipur cab if the vendor said so.
    const bad = routes.findIndex((r) => !str(r?.from) || !str(r?.to))
    if (bad !== -1) errors.routes = `Route ${bad + 1} needs both a pickup and a drop city`

    const same = routes.findIndex(
      (r) => str(r?.from)?.toLowerCase() === str(r?.to)?.toLowerCase()
    )
    if (same !== -1) errors.routes = `Route ${same + 1} has the same pickup and drop city`
    return
  }

  // No route list: fall back to the flat pair, which is what legacy cabs use.
  if (!partial) {
    if (!str(body.from ?? body.currentCity)) errors.from = 'Pickup city is required'
    if (!str(body.to)) errors.to = 'Drop-off city is required'
  }

  const from = str(body.from ?? body.currentCity)
  const to = str(body.to)
  if (from && to && from.toLowerCase() === to.toLowerCase()) {
    errors.to = 'Drop-off must differ from pickup'
  }
}

const validateServices = (body, errors) => {
  const types = arr(body.serviceTypes)
  const unknown = types.find((t) => !inEnum(t, ServiceType))
  if (unknown) {
    errors.serviceTypes = `Unknown service type: ${unknown}`
    return
  }

  // A service the customer can pick but the vendor never priced would reach the
  // fare engine with nothing to charge, so it is refused at the boundary
  // instead of failing at checkout.
  for (const type of types) {
    const config = body.pricing?.[type]
    const spec = PRICING_FIELDS[type]
    if (!spec) continue

    const missing = spec.required.filter((f) => !(num(config?.[f]) > 0))
    if (missing.length) {
      errors[`pricing.${type}`] = `${type} needs ${missing.join(', ')}`
    }
  }
}

const validateDocuments = (body, errors) => {
  arr(body.documents).forEach((doc, i) => {
    if (!inEnum(doc?.type, DocumentType)) {
      errors[`documents.${i}`] = 'Unknown document type'
      return
    }
    if (!str(doc.number)) errors[`documents.${i}`] = `${doc.type} needs a document number`

    for (const field of ['issueDate', 'expiryDate']) {
      if (doc[field] && Number.isNaN(new Date(doc[field]).getTime())) {
        errors[`documents.${i}`] = `${doc.type} has an invalid ${field}`
      }
    }

    if (doc.issueDate && doc.expiryDate && new Date(doc.expiryDate) <= new Date(doc.issueDate)) {
      errors[`documents.${i}`] = `${doc.type} expires before it was issued`
    }
  })
}

const validateCancellation = (body, errors) => {
  arr(body.cancellationPolicy).forEach((tier, i) => {
    const fee = num(tier?.feePercent)
    if (fee === null || fee < CANCELLATION_BOUNDS.minFeePercent || fee > CANCELLATION_BOUNDS.maxFeePercent) {
      errors[`cancellationPolicy.${i}`] =
        `Fee must be between ${CANCELLATION_BOUNDS.minFeePercent}% and ${CANCELLATION_BOUNDS.maxFeePercent}%`
    }
    if (num(tier?.minHoursBefore) === null || num(tier.minHoursBefore) < 0) {
      errors[`cancellationPolicy.${i}`] = 'Hours before pickup must be zero or more'
    }
  })
}

export const validateProfile = (body, { partial = false } = {}) => {
  const errors = {}

  validateVehicle(body, errors, partial)
  validateRoutes(body, errors, partial)
  validateServices(body, errors)
  validateDocuments(body, errors)
  validateCancellation(body, errors)

  const fare = num(body.price ?? body.baseFare)
  if (!partial && fare === null && !arr(body.serviceTypes).length) {
    errors.baseFare = 'Base fare is required'
  }
  if (fare !== null && fare <= 0) errors.baseFare = 'Fare must be greater than zero'

  return errors
}

/* ─────────────────────────────── storage ─────────────────────────────── */

const cleanPricing = (pricing) => {
  const out = {}
  for (const [type, config] of Object.entries(pricing ?? {})) {
    const spec = PRICING_FIELDS[type]
    if (!spec || !config) continue

    const row = {}
    for (const field of [...spec.required, ...spec.optional]) {
      const v = num(config[field])
      if (v !== null) row[field] = v
    }
    if (Object.keys(row).length) out[type] = row
  }
  return out
}

const cleanDocuments = (documents) =>
  arr(documents).map((d) => ({
    type: d.type,
    number: str(d.number),
    issueDate: d.issueDate ?? null,
    expiryDate: d.expiryDate ?? null,
    fileUrl: str(d.fileUrl) ?? null,
    // Vendor-supplied verification would let a vendor mark their own insurance
    // verified. It is the admin's field; a fresh or edited document always
    // re-enters the queue.
    verificationStatus: VerificationStatus.PENDING,
    rejectionReason: null
  }))

const cleanImages = (images) => {
  const rows = arr(images)
    .filter((i) => str(i?.url))
    .map((i) => ({
      url: str(i.url),
      angle: inEnum(i.angle, ImageAngle) ? i.angle : ImageAngle.FRONT,
      isPrimary: Boolean(i.isPrimary)
    }))

  // Exactly one primary, always. A card with no image to show is a worse
  // outcome than picking the first one.
  if (rows.length && !rows.some((r) => r.isPrimary)) rows[0].isPrimary = true
  let seen = false
  for (const r of rows) {
    if (r.isPrimary && seen) r.isPrimary = false
    if (r.isPrimary) seen = true
  }
  return rows
}

const cleanServiceAreas = (areas) =>
  arr(areas)
    .filter((a) => str(a?.city))
    .map((a) => ({
      country: str(a.country) ?? 'India',
      state: str(a.state) ?? null,
      city: str(a.city),
      area: str(a.area) ?? null,
      lat: num(a.lat),
      lng: num(a.lng)
    }))

const cleanRoutes = (routes) =>
  arr(routes)
    .filter((r) => str(r?.from) && str(r?.to))
    .map((r) => ({ from: str(r.from), to: str(r.to) }))

export const profileToStorage = (body, { partial = false } = {}) => {
  const out = {}

  /* §3 vehicle */
  const name = body.cabName ?? body.operatorName
  if (name !== undefined) {
    out.cabName = str(name)
    // Kept in step because the customer card, the admin table and the older
    // search all read `operatorName`.
    out.operatorName = str(name)
    out.driver = str(body.driver ?? name)
  }
  if (body.vehicleType !== undefined) out.vehicleType = body.vehicleType
  if (body.vehicleBrand !== undefined) out.vehicleBrand = str(body.vehicleBrand)
  if (body.vehicleModel !== undefined) out.vehicleModel = str(body.vehicleModel)
  if (body.vehicleNumber !== undefined || body.cabNumber !== undefined) {
    out.vehicleNumber = normalizePlate(body.vehicleNumber ?? body.cabNumber)
  }
  if (body.manufacturingYear !== undefined) out.manufacturingYear = num(body.manufacturingYear)
  if (body.fuelType !== undefined) out.fuelType = body.fuelType
  if (body.luggageCapacity !== undefined) out.luggageCapacity = num(body.luggageCapacity)
  if (body.isAc !== undefined) out.isAc = Boolean(body.isAc)

  // `type` is what the existing search filter and customer card read, so the
  // new vehicleType is mirrored onto it rather than replacing it.
  if (body.type !== undefined || body.cabType !== undefined) out.type = body.type ?? body.cabType
  else if (body.vehicleType !== undefined) out.type = body.vehicleType

  const seats = num(body.seatingCapacity ?? body.capacity ?? body.cabs)
  if (seats !== null) {
    out.seatingCapacity = seats
    out.capacity = seats
  }

  /* §4 location and service area */
  if (body.country !== undefined) out.country = str(body.country)
  if (body.state !== undefined) out.state = str(body.state)
  if (body.city !== undefined || body.currentCity !== undefined) {
    out.city = str(body.city ?? body.currentCity)
    out.currentCity = out.city
  }
  if (body.serviceAreas !== undefined) out.serviceAreas = cleanServiceAreas(body.serviceAreas)
  for (const flag of ['airportService', 'railwayService', 'hotelPickup', 'homePickup']) {
    if (body[flag] !== undefined) out[flag] = Boolean(body[flag])
  }
  if (body.lat !== undefined) out.lat = num(body.lat)
  if (body.lng !== undefined) out.lng = num(body.lng)

  /* §35 routes, plus the flat pair the existing indexed search reads */
  if (body.routes !== undefined) {
    out.routes = cleanRoutes(body.routes)
    if (out.routes.length) {
      out.from = out.routes[0].from
      out.to = out.routes[0].to
    }
  }
  if (body.from !== undefined || body.currentCity !== undefined) {
    out.from = str(body.from ?? body.currentCity) ?? out.from
  }
  if (body.to !== undefined) out.to = str(body.to) ?? out.to

  if (out.routes || out.from || out.to) {
    out.routeKeys = routeKeysFor(out.routes, out.from, out.to)
  }

  /* §5 §6 services and pricing */
  if (body.serviceTypes !== undefined) {
    out.serviceTypes = arr(body.serviceTypes).filter((t) => inEnum(t, ServiceType))
  }
  if (body.pricing !== undefined) out.pricing = cleanPricing(body.pricing)

  if (body.surcharges !== undefined) {
    const s = {}
    for (const field of SURCHARGE_FIELDS) {
      const v = num(body.surcharges[field])
      if (v !== null) s[field] = v
    }
    out.surcharges = s
  }
  // Whether each charge is already in the fare or billed on top. Displayed to
  // the customer as inclusions/exclusions before they pay.
  if (body.inclusions !== undefined && typeof body.inclusions === 'object') {
    out.inclusions = Object.fromEntries(
      Object.entries(body.inclusions).map(([k, v]) => [k, Boolean(v)])
    )
  }

  /* legacy flat fare, still what the current fare path uses */
  const price = num(body.price ?? body.baseFare)
  if (price !== null) {
    out.price = price
    out.baseFare = price
  }
  const perKm = num(body.perKmRate)
  if (perKm !== null) out.perKmRate = perKm
  const perMin = num(body.perMinuteRate)
  if (perMin !== null) out.perMinuteRate = perMin

  /* §8 §9 §10 §11 */
  if (body.documents !== undefined) out.documents = cleanDocuments(body.documents)
  if (body.images !== undefined) {
    out.images = cleanImages(body.images)
    const primary = out.images.find((i) => i.isPrimary)
    if (primary) out.image = primary.url
  }
  if (body.image !== undefined) out.image = str(body.image)
  if (body.amenities !== undefined) {
    out.amenities = arr(body.amenities).filter((a) => inEnum(a, Amenity))
  }
  if (body.cancellationPolicy !== undefined) {
    out.cancellationPolicy = arr(body.cancellationPolicy)
      .map((t) => ({
        minHoursBefore: num(t.minHoursBefore, 0),
        feePercent: num(t.feePercent, 0),
        label: str(t.label) ?? ''
      }))
      .sort((a, b) => b.minHoursBefore - a.minHoursBefore)
  }

  if (body.rating !== undefined) out.rating = num(body.rating)
  if (body.estimatedTime !== undefined) out.estimatedTime = body.estimatedTime
  if (body.phone !== undefined) out.phone = body.phone

  const availableNum = num(body.available)
  if (availableNum !== null) {
    out.availableCount = availableNum
    out.available = availableNum > 0
  }

  if (!partial) {
    out.capacity = out.capacity ?? 4
    out.seatingCapacity = out.seatingCapacity ?? out.capacity
    out.available = out.available ?? true
    out.availableCount = out.availableCount ?? null
    out.rating = out.rating ?? 4.5
    out.type = out.type ?? 'Sedan'
    out.country = out.country ?? 'India'
    out.serviceTypes = out.serviceTypes ?? []
    out.pricing = out.pricing ?? {}
    out.amenities = out.amenities ?? []
    out.documents = out.documents ?? []
    out.images = out.images ?? []
    out.serviceAreas = out.serviceAreas ?? []
    out.cancellationPolicy = out.cancellationPolicy ?? DEFAULT_CANCELLATION_POLICY
  }

  return out
}

export default { validateProfile, profileToStorage }
