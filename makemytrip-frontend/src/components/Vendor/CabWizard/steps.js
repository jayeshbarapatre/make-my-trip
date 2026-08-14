/**
 * The Add Cab steps, and what each one requires before you may leave it.
 *
 * Kept as data rather than logic scattered through the wizard so the stepper,
 * the Next button and the review page all read the same definition — and so the
 * rules can be tested without rendering anything.
 *
 * These checks are a courtesy, not a gate. The server validates the same things
 * again in `cabProfile.js`; nothing here is trusted for correctness (§37).
 */

import { MANDATORY_DOCUMENTS, PRICING_FIELDS } from '../../../constants/cabOptions'

const PLATE_STANDARD = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/
const PLATE_BH = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/

export const normalizePlate = (v) => String(v ?? '').toUpperCase().replace(/[\s-]/g, '')
export const isValidPlate = (v) => {
  const p = normalizePlate(v)
  return PLATE_STANDARD.test(p) || PLATE_BH.test(p)
}

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
const filled = (v) => String(v ?? '').trim().length > 0

export const emptyCab = () => ({
  cabName: '',
  vehicleType: 'SEDAN',
  vehicleBrand: '',
  vehicleModel: '',
  vehicleNumber: '',
  manufacturingYear: '',
  fuelType: 'PETROL',
  seatingCapacity: 4,
  luggageCapacity: 2,
  isAc: true,

  country: 'India',
  state: '',
  city: '',
  serviceAreas: [],
  airportService: false,
  railwayService: false,
  hotelPickup: false,
  homePickup: false,
  routes: [{ from: '', to: '' }],

  serviceTypes: [],
  pricing: {},
  surcharges: {},
  inclusions: {},

  driverId: '',
  documents: [],
  images: [],
  amenities: ['AC'],
  cancellationPolicy: []
})

/* ─────────────────────────── per-step checks ─────────────────────────── */

const validateVehicle = (cab) => {
  const e = {}
  if (!filled(cab.cabName)) e.cabName = 'Give this cab a name'
  if (!filled(cab.vehicleNumber)) e.vehicleNumber = 'Registration number is required'
  else if (!isValidPlate(cab.vehicleNumber)) e.vehicleNumber = 'Not a valid registration, e.g. GJ01AB1234'

  const year = num(cab.manufacturingYear)
  const thisYear = new Date().getFullYear()
  if (year !== null && (year < 1990 || year > thisYear + 1)) {
    e.manufacturingYear = `Between 1990 and ${thisYear + 1}`
  }

  const seats = num(cab.seatingCapacity)
  if (seats === null || seats < 1 || seats > 26) e.seatingCapacity = 'Between 1 and 26 seats'

  return e
}

const validateLocation = (cab) => {
  const e = {}
  if (!filled(cab.city)) e.city = 'Operating city is required'

  const routes = cab.routes ?? []
  const usable = routes.filter((r) => filled(r.from) && filled(r.to))

  // §35. The whole reason this step exists: a cab based in a city is not
  // automatically a cab to everywhere from that city.
  if (!usable.length) e.routes = 'Add at least one route this cab serves'

  routes.forEach((r, i) => {
    if (filled(r.from) && filled(r.to) && r.from.trim().toLowerCase() === r.to.trim().toLowerCase()) {
      e[`routes.${i}`] = 'Pickup and drop must differ'
    }
    if (filled(r.from) !== filled(r.to)) e[`routes.${i}`] = 'Both cities are needed'
  })

  return e
}

const validateServices = (cab) => {
  const e = {}
  if (!(cab.serviceTypes ?? []).length) e.serviceTypes = 'Pick at least one service this cab offers'
  return e
}

const validatePricing = (cab) => {
  const e = {}

  for (const type of cab.serviceTypes ?? []) {
    const spec = PRICING_FIELDS[type]
    if (!spec) continue
    for (const field of spec.required) {
      const v = num(cab.pricing?.[type]?.[field.key])
      // A service the customer can choose but the vendor never priced would
      // reach checkout with nothing to charge.
      if (v === null || v <= 0) e[`pricing.${type}.${field.key}`] = 'Required'
    }
  }

  return e
}

const validateDocuments = (cab) => {
  const e = {}
  const present = new Set((cab.documents ?? []).map((d) => d.type))
  const missing = MANDATORY_DOCUMENTS.filter((t) => !present.has(t))
  if (missing.length) e.documents = `Still needed: ${missing.join(', ')}`

  ;(cab.documents ?? []).forEach((d, i) => {
    if (!filled(d.number)) e[`documents.${i}`] = 'Document number is required'
    else if (d.issueDate && d.expiryDate && new Date(d.expiryDate) <= new Date(d.issueDate)) {
      e[`documents.${i}`] = 'Expiry must be after the issue date'
    } else if (d.expiryDate && new Date(d.expiryDate) < new Date()) {
      e[`documents.${i}`] = 'This document has already expired'
    }
  })

  return e
}

const validateImages = (cab) => {
  const e = {}
  if (!(cab.images ?? []).length) e.images = 'Add at least one photo of the vehicle'
  return e
}

const validateCancellation = (cab) => {
  const e = {}
  ;(cab.cancellationPolicy ?? []).forEach((t, i) => {
    const fee = num(t.feePercent)
    if (fee === null || fee < 0 || fee > 100) e[`cancellationPolicy.${i}`] = 'Fee must be 0–100%'
    if (num(t.minHoursBefore) === null || num(t.minHoursBefore) < 0) {
      e[`cancellationPolicy.${i}`] = 'Hours must be zero or more'
    }
  })
  return e
}

export const STEPS = [
  { key: 'vehicle', title: 'Vehicle', hint: 'What the cab is', validate: validateVehicle },
  { key: 'location', title: 'Location & Routes', hint: 'Where it operates', validate: validateLocation },
  { key: 'services', title: 'Services', hint: 'How it may be booked', validate: validateServices },
  { key: 'pricing', title: 'Pricing', hint: 'What each service costs', validate: validatePricing },
  { key: 'driver', title: 'Driver', hint: 'Who drives it', validate: () => ({}) },
  { key: 'documents', title: 'Documents', hint: 'Papers the admin verifies', validate: validateDocuments },
  { key: 'images', title: 'Photos', hint: 'What the customer sees', validate: validateImages },
  { key: 'amenities', title: 'Amenities', hint: 'What is on board', validate: () => ({}) },
  { key: 'cancellation', title: 'Cancellation', hint: 'Your refund ladder', validate: validateCancellation },
  { key: 'review', title: 'Review', hint: 'Check and submit', validate: () => ({}) }
]

/** Every step that is not yet complete, for the review page and the stepper. */
export const incompleteSteps = (cab) =>
  STEPS.filter((s) => Object.keys(s.validate(cab)).length > 0)

/**
 * Only what the server accepts. The wizard carries UI-only state (`driverId`
 * is assigned per booking, not stored on the cab), and sending it would be
 * ignored at best.
 */
export const toPayload = (cab) => {
  const routes = (cab.routes ?? []).filter((r) => filled(r.from) && filled(r.to))

  return {
    cabName: cab.cabName,
    vehicleType: cab.vehicleType,
    vehicleBrand: cab.vehicleBrand || undefined,
    vehicleModel: cab.vehicleModel || undefined,
    vehicleNumber: normalizePlate(cab.vehicleNumber),
    manufacturingYear: cab.manufacturingYear || undefined,
    fuelType: cab.fuelType,
    seatingCapacity: Number(cab.seatingCapacity),
    luggageCapacity: cab.luggageCapacity === '' ? undefined : Number(cab.luggageCapacity),
    isAc: Boolean(cab.isAc),

    country: cab.country,
    state: cab.state || undefined,
    city: cab.city,
    serviceAreas: cab.serviceAreas ?? [],
    airportService: Boolean(cab.airportService),
    railwayService: Boolean(cab.railwayService),
    hotelPickup: Boolean(cab.hotelPickup),
    homePickup: Boolean(cab.homePickup),
    routes,

    serviceTypes: cab.serviceTypes ?? [],
    pricing: cab.pricing ?? {},
    surcharges: cab.surcharges ?? {},
    inclusions: cab.inclusions ?? {},

    documents: cab.documents ?? [],
    images: cab.images ?? [],
    amenities: cab.amenities ?? [],
    cancellationPolicy: cab.cancellationPolicy ?? [],

    // The flat fare the existing search and fare path still read. Taken from
    // the cheapest configured service so an upgraded cab keeps a sane price
    // rather than dropping to zero.
    price: cheapestFare(cab),
    perKmRate: firstPerKm(cab)
  }
}

const cheapestFare = (cab) => {
  const candidates = Object.values(cab.pricing ?? {})
    .map((p) => num(p.baseFare) ?? num(p.fixedFare) ?? num(p.perHour))
    .filter((v) => v !== null && v > 0)

  return candidates.length ? Math.min(...candidates) : undefined
}

const firstPerKm = (cab) => {
  const candidates = Object.values(cab.pricing ?? {})
    .map((p) => num(p.perKm))
    .filter((v) => v !== null && v > 0)

  return candidates.length ? Math.min(...candidates) : undefined
}
