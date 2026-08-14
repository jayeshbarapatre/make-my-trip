/**
 * Everything the cab forms offer the user to pick from.
 *
 * The values here are the backend's enum values verbatim — `cabOptions.test.js`
 * imports `makemytrip-backend/src/config/cabModel.js` and fails if the two ever
 * disagree. That test exists because the previous version of this vertical had
 * the vendor form, the search and the admin list each holding their own idea of
 * a cab's shape, and nothing noticed until a listed cab turned out to be
 * unfindable.
 *
 * Labels live here; values belong to the backend.
 */

export const VEHICLE_TYPES = [
  { value: 'HATCHBACK', label: 'Hatchback', seats: 4 },
  { value: 'SEDAN', label: 'Sedan', seats: 4 },
  { value: 'SUV', label: 'SUV', seats: 6 },
  { value: 'MUV', label: 'MUV', seats: 7 },
  { value: 'LUXURY', label: 'Luxury', seats: 4 },
  { value: 'PREMIUM', label: 'Premium', seats: 4 },
  { value: 'TEMPO_TRAVELLER', label: 'Tempo Traveller', seats: 12 }
]

export const FUEL_TYPES = [
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'CNG', label: 'CNG' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYBRID', label: 'Hybrid' }
]

export const SERVICE_TYPES = [
  { value: 'LOCAL', label: 'Local', hint: 'Within one city, charged by hour and distance' },
  { value: 'AIRPORT_TRANSFER', label: 'Airport Transfer', hint: 'To or from an airport' },
  { value: 'RAILWAY_TRANSFER', label: 'Railway Transfer', hint: 'To or from a station' },
  { value: 'OUTSTATION_ONE_WAY', label: 'Outstation One Way', hint: 'City to city, dropped and done' },
  { value: 'OUTSTATION_ROUND_TRIP', label: 'Outstation Round Trip', hint: 'City to city and back' },
  { value: 'HOURLY_RENTAL', label: 'Hourly Rental', hint: 'Booked by the hour' }
]

/**
 * Which charges each service type uses, mirroring PRICING_FIELDS on the server.
 *
 * The form renders only these fields per service, so a vendor is never asked for
 * a per-km rate on an hourly rental — and the server refuses to accept one it
 * did not ask for either.
 */
export const PRICING_FIELDS = {
  LOCAL: {
    required: [
      { key: 'perHour', label: 'Per Hour (₹)' },
      { key: 'perKm', label: 'Per KM (₹)' }
    ],
    optional: [
      { key: 'minimumHours', label: 'Minimum Hours' },
      { key: 'minimumKm', label: 'Minimum KM' }
    ]
  },
  AIRPORT_TRANSFER: {
    required: [{ key: 'fixedFare', label: 'Fixed Fare (₹)' }],
    optional: [
      { key: 'perKm', label: 'Per KM beyond the fixed leg (₹)' },
      { key: 'airportSurcharge', label: 'Airport Surcharge (₹)' }
    ]
  },
  RAILWAY_TRANSFER: {
    required: [{ key: 'fixedFare', label: 'Fixed Fare (₹)' }],
    optional: [{ key: 'perKm', label: 'Per KM beyond the fixed leg (₹)' }]
  },
  OUTSTATION_ONE_WAY: {
    required: [
      { key: 'baseFare', label: 'Base Fare (₹)' },
      { key: 'perKm', label: 'Per KM (₹)' }
    ],
    optional: [
      { key: 'minimumKm', label: 'Minimum KM' },
      { key: 'driverAllowance', label: 'Driver Allowance (₹)' },
      { key: 'toll', label: 'Toll (₹)' },
      { key: 'parking', label: 'Parking (₹)' },
      { key: 'stateTax', label: 'State Tax (₹)' }
    ]
  },
  OUTSTATION_ROUND_TRIP: {
    required: [{ key: 'perKm', label: 'Per KM (₹)' }],
    optional: [
      { key: 'minimumKm', label: 'Minimum KM' },
      { key: 'dailyMinimumKm', label: 'Daily Minimum KM' },
      { key: 'driverAllowance', label: 'Driver Allowance (₹)' },
      { key: 'toll', label: 'Toll (₹)' },
      { key: 'parking', label: 'Parking (₹)' },
      { key: 'stateTax', label: 'State Tax (₹)' }
    ]
  },
  HOURLY_RENTAL: {
    required: [
      { key: 'perHour', label: 'Per Hour (₹)' },
      { key: 'minimumHours', label: 'Minimum Hours' }
    ],
    optional: [{ key: 'extraHourCharge', label: 'Extra Hour Charge (₹)' }]
  }
}

export const SURCHARGES = [
  { key: 'extraKmCharge', label: 'Extra KM Charge (₹)' },
  { key: 'extraHourCharge', label: 'Extra Hour Charge (₹)' },
  { key: 'nightCharge', label: 'Night Charge (₹)' },
  { key: 'waitingCharge', label: 'Waiting Charge (₹/hr)' },
  { key: 'airportCharge', label: 'Airport Charge (₹)' },
  { key: 'driverAllowance', label: 'Driver Allowance (₹/day)' },
  { key: 'toll', label: 'Toll (₹)' },
  { key: 'parking', label: 'Parking (₹)' }
]

export const DOCUMENT_TYPES = [
  { value: 'RC', label: 'Registration Certificate (RC)', mandatory: true },
  { value: 'INSURANCE', label: 'Insurance', mandatory: true },
  { value: 'PERMIT', label: 'Permit', mandatory: true },
  { value: 'FITNESS', label: 'Fitness Certificate', mandatory: false },
  { value: 'POLLUTION', label: 'Pollution Certificate (PUC)', mandatory: false },
  { value: 'REGISTRATION', label: 'Vehicle Registration', mandatory: false },
  { value: 'OTHER', label: 'Other', mandatory: false }
]

export const IMAGE_ANGLES = [
  { value: 'FRONT', label: 'Front' },
  { value: 'BACK', label: 'Back' },
  { value: 'SIDE', label: 'Side' },
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'LUGGAGE', label: 'Boot / Luggage' }
]

export const AMENITIES = [
  { value: 'AC', label: 'Air Conditioning' },
  { value: 'MUSIC_SYSTEM', label: 'Music System' },
  { value: 'BLUETOOTH', label: 'Bluetooth' },
  { value: 'CHARGING_PORT', label: 'Charging Port' },
  { value: 'USB', label: 'USB' },
  { value: 'WATER_BOTTLE', label: 'Water Bottle' },
  { value: 'SANITIZED', label: 'Sanitized Vehicle' },
  { value: 'GPS', label: 'GPS' },
  { value: 'FIRST_AID', label: 'First Aid Kit' },
  { value: 'CHILD_SEAT', label: 'Child Seat' },
  { value: 'EXTRA_LUGGAGE', label: 'Extra Luggage Space' },
  { value: 'WIFI', label: 'Wi-Fi' }
]

/** Mirrors DEFAULT_CANCELLATION_POLICY so a new cab starts somewhere sensible. */
export const DEFAULT_CANCELLATION_POLICY = [
  { minHoursBefore: 24, feePercent: 0, label: 'Free cancellation more than 24 hours before pickup' },
  { minHoursBefore: 12, feePercent: 25, label: '25% charge between 12 and 24 hours' },
  { minHoursBefore: 6, feePercent: 50, label: '50% charge between 6 and 12 hours' },
  { minHoursBefore: 0, feePercent: 100, label: 'No refund within 6 hours of pickup' }
]

export const MANDATORY_DOCUMENTS = DOCUMENT_TYPES.filter((d) => d.mandatory).map((d) => d.value)

export const labelFor = (options, value) =>
  options.find((o) => o.value === value)?.label ?? value
