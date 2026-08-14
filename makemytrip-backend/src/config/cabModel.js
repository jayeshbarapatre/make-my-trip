/**
 * The cab domain: every enum, shape and rule the vendor form, the admin
 * approval screen, the search and the fare engine all have to agree on.
 *
 * It lives in one module because the last version of this vertical did not have
 * one. The vendor form asked for a single "Base City", the search matched on a
 * from/to route, and the admin list showed one city column — three components
 * each holding a different idea of what a cab is, so a cab listed through the
 * form could never be found by a customer. Anything both sides need to agree on
 * belongs here rather than in a component.
 *
 * STORAGE
 *
 * Firestore, in the existing `cabs` collection — not a parallel one. The richer
 * fields are all optional, so the 290 cabs already in there keep working: they
 * simply have no `pricing` map and fall back to the flat `price` + `perKmRate`
 * the old fare path already understands. A cab is upgraded by editing it.
 *
 * Bounded child collections (images, documents, amenities, service areas,
 * pricing) are embedded on the cab document rather than split out. They are
 * small, always read together with the cab, and — the deciding reason — the
 * admin approves the whole thing in one transaction. Splitting them across
 * collections would make approval a multi-document write with no way to keep
 * the parts consistent.
 *
 * Drivers are the exception and live in `cabDrivers`, because one driver is
 * assigned across many cabs and bookings, and the vendor picks from a roster
 * when assigning one to a trip.
 */

/** §3 — vehicle classification. */
export const VehicleType = {
  HATCHBACK: 'HATCHBACK',
  SEDAN: 'SEDAN',
  SUV: 'SUV',
  MUV: 'MUV',
  LUXURY: 'LUXURY',
  PREMIUM: 'PREMIUM',
  TEMPO_TRAVELLER: 'TEMPO_TRAVELLER'
}

export const FuelType = {
  PETROL: 'PETROL',
  DIESEL: 'DIESEL',
  CNG: 'CNG',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID'
}

/**
 * §5 — what a cab may be sold as. A cab supports several of these at once, and
 * each one is priced differently, which is why `pricing` is keyed by them.
 */
export const ServiceType = {
  LOCAL: 'LOCAL',
  AIRPORT_TRANSFER: 'AIRPORT_TRANSFER',
  RAILWAY_TRANSFER: 'RAILWAY_TRANSFER',
  OUTSTATION_ONE_WAY: 'OUTSTATION_ONE_WAY',
  OUTSTATION_ROUND_TRIP: 'OUTSTATION_ROUND_TRIP',
  HOURLY_RENTAL: 'HOURLY_RENTAL'
}

/**
 * §16 — the lifecycle.
 *
 * The first four are the platform-wide `ListingStatus` that hotels and buses
 * share; the rest are cab-only post-approval states. They are additive on
 * purpose: the shared approval factory only ever writes the common four, so
 * nothing here changes how another vertical behaves.
 */
export const CabStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
  DOCUMENT_EXPIRED: 'DOCUMENT_EXPIRED'
}

/** §8 — paperwork the admin verifies before a cab may carry passengers. */
export const DocumentType = {
  RC: 'RC',
  INSURANCE: 'INSURANCE',
  PERMIT: 'PERMIT',
  FITNESS: 'FITNESS',
  POLLUTION: 'POLLUTION',
  REGISTRATION: 'REGISTRATION',
  OTHER: 'OTHER'
}

/** Without these a cab is not road-legal, so approval refuses to publish it. */
export const MANDATORY_DOCUMENTS = [DocumentType.RC, DocumentType.INSURANCE, DocumentType.PERMIT]

export const VerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
}

/** §9 — the angles a customer expects to see before booking. */
export const ImageAngle = {
  FRONT: 'FRONT',
  BACK: 'BACK',
  SIDE: 'SIDE',
  INTERIOR: 'INTERIOR',
  DASHBOARD: 'DASHBOARD',
  LUGGAGE: 'LUGGAGE'
}

/** §10 — filterable, so these are codes rather than free text. */
export const Amenity = {
  AC: 'AC',
  MUSIC_SYSTEM: 'MUSIC_SYSTEM',
  BLUETOOTH: 'BLUETOOTH',
  CHARGING_PORT: 'CHARGING_PORT',
  USB: 'USB',
  WATER_BOTTLE: 'WATER_BOTTLE',
  SANITIZED: 'SANITIZED',
  GPS: 'GPS',
  FIRST_AID: 'FIRST_AID',
  CHILD_SEAT: 'CHILD_SEAT',
  EXTRA_LUGGAGE: 'EXTRA_LUGGAGE',
  WIFI: 'WIFI'
}

/** §18, §41 — a pickup point is not always a city. */
export const PlaceKind = {
  CITY: 'CITY',
  AIRPORT: 'AIRPORT',
  RAILWAY_STATION: 'RAILWAY_STATION',
  HOTEL: 'HOTEL',
  AREA: 'AREA'
}

/**
 * §6 — which charge fields each service type actually uses.
 *
 * The fare engine reads this rather than guessing, so an hourly rental is never
 * quoted a per-km rate and an airport transfer is never charged a daily
 * minimum. `required` is what the vendor must supply for that service to be
 * sellable at all; the rest are optional add-ons.
 */
export const PRICING_FIELDS = {
  [ServiceType.LOCAL]: {
    required: ['perHour', 'perKm'],
    optional: ['minimumHours', 'minimumKm']
  },
  [ServiceType.AIRPORT_TRANSFER]: {
    required: ['fixedFare'],
    optional: ['perKm', 'airportSurcharge']
  },
  [ServiceType.RAILWAY_TRANSFER]: {
    required: ['fixedFare'],
    optional: ['perKm']
  },
  [ServiceType.OUTSTATION_ONE_WAY]: {
    required: ['baseFare', 'perKm'],
    optional: ['minimumKm', 'driverAllowance', 'toll', 'parking', 'stateTax']
  },
  [ServiceType.OUTSTATION_ROUND_TRIP]: {
    required: ['perKm'],
    optional: ['minimumKm', 'dailyMinimumKm', 'driverAllowance', 'toll', 'parking', 'stateTax']
  },
  [ServiceType.HOURLY_RENTAL]: {
    required: ['perHour', 'minimumHours'],
    optional: ['extraHourCharge']
  }
}

/** Charges that apply on top of any service type. §6, "Additional charges". */
export const SURCHARGE_FIELDS = [
  'extraKmCharge',
  'extraHourCharge',
  'nightCharge',
  'waitingCharge',
  'airportCharge',
  'driverAllowance',
  'toll',
  'parking'
]

/**
 * §11 — the default cancellation ladder a new cab starts with.
 *
 * Vendors may change the percentages within the platform bounds below. Stored
 * on the cab so a customer's refund is computed against the policy that was in
 * force when they booked, not whatever the vendor has since changed it to.
 */
export const DEFAULT_CANCELLATION_POLICY = [
  { minHoursBefore: 24, feePercent: 0, label: 'Free cancellation more than 24 hours before pickup' },
  { minHoursBefore: 12, feePercent: 25, label: '25% charge between 12 and 24 hours' },
  { minHoursBefore: 6, feePercent: 50, label: '50% charge between 6 and 12 hours' },
  { minHoursBefore: 0, feePercent: 100, label: 'No refund within 6 hours of pickup' }
]

/** Platform-level bounds an admin enforces on any vendor policy. §11. */
export const CANCELLATION_BOUNDS = { minFeePercent: 0, maxFeePercent: 100 }

/** §12 — day-to-day state of the vehicle, distinct from its listing lifecycle. */
export const AvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  ON_TRIP: 'ON_TRIP',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
}

/** §24 — booking lifecycle. */
export const CabBookingStatus = {
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  CONFIRMED: 'CONFIRMED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DRIVER_ON_THE_WAY: 'DRIVER_ON_THE_WAY',
  TRIP_STARTED: 'TRIP_STARTED',
  TRIP_COMPLETED: 'TRIP_COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED',
  NO_SHOW: 'NO_SHOW'
}

export const CAB_DRIVERS = 'cabDrivers'

/**
 * India's vehicle registration format, e.g. GJ01AB1234 / MH-12-AB-1234.
 * Also accepts the BH series (23BH1234A) now issued for inter-state vehicles.
 */
const PLATE_STANDARD = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/
const PLATE_BH = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/

export const normalizePlate = (value) =>
  String(value ?? '').toUpperCase().replace(/[\s-]/g, '')

export const isValidPlate = (value) => {
  const p = normalizePlate(value)
  return PLATE_STANDARD.test(p) || PLATE_BH.test(p)
}

/**
 * §16, §40.3 — only a cab that is approved *and* switched on may be sold.
 *
 * Written as one function so search, the fare engine and the booking path
 * cannot each decide "sellable" differently. Legacy cabs carry no status at
 * all; they are governed by `isActive` exactly as before, which is what keeps
 * the existing 290 bookable.
 */
export const isSellable = (cab) => {
  if (!cab || cab.isDeleted) return false
  if (cab.isActive === false) return false

  const status = cab.listingStatus
  if (!status) return true

  return status === CabStatus.APPROVED || status === CabStatus.ACTIVE
}

/**
 * §8, §40.11 — documents that have lapsed.
 *
 * Expiry is a date on a document, but "expired" is a state the whole cab enters,
 * because a cab with lapsed insurance must stop taking bookings even though
 * nobody edited it. Computed rather than stored so it cannot go stale.
 */
export const expiredDocuments = (cab, now = new Date()) =>
  (cab?.documents ?? []).filter((d) => {
    if (!d?.expiryDate) return false
    const expiry = new Date(d.expiryDate)
    return !Number.isNaN(expiry.getTime()) && expiry < now
  })

export const missingMandatoryDocuments = (cab) => {
  const present = new Set((cab?.documents ?? []).map((d) => d.type))
  return MANDATORY_DOCUMENTS.filter((t) => !present.has(t))
}

/** The service types this cab is actually configured to sell. */
export const sellableServiceTypes = (cab) => {
  const declared = Array.isArray(cab?.serviceTypes) ? cab.serviceTypes : []
  const pricing = cab?.pricing ?? {}

  return declared.filter((type) => {
    const spec = PRICING_FIELDS[type]
    if (!spec) return false
    const config = pricing[type]
    if (!config) return false
    return spec.required.every((f) => Number(config[f]) > 0)
  })
}

/**
 * §35 — the routes a cab covers.
 *
 * A vendor's operating city is not a route. An Ahmedabad cab that serves
 * Udaipur and Surat must not appear for Ahmedabad -> Jaipur just because the
 * pickup matches, which is precisely the bug this replaces: the old form stored
 * one city and no destination at all.
 */
export const servesRoute = (cab, { from, to }, matcher) => {
  const routes = Array.isArray(cab?.routes) ? cab.routes : []

  if (routes.length) {
    return routes.some((r) => matcher(r.from, from) && matcher(r.to, to))
  }

  // Legacy shape: a single from/to pair on the document itself.
  return matcher(cab?.from, from) && matcher(cab?.to, to)
}

export default {
  VehicleType,
  FuelType,
  ServiceType,
  CabStatus,
  DocumentType,
  VerificationStatus,
  ImageAngle,
  Amenity,
  PlaceKind,
  AvailabilityStatus,
  CabBookingStatus,
  PRICING_FIELDS,
  SURCHARGE_FIELDS,
  DEFAULT_CANCELLATION_POLICY,
  isSellable,
  expiredDocuments,
  missingMandatoryDocuments,
  sellableServiceTypes,
  servesRoute,
  isValidPlate,
  normalizePlate
}
