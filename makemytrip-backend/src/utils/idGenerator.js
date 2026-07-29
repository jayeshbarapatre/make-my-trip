// Centralized ID generation for bookings, PNRs, and invoices.
// Uses crypto randomness (not Math.random) because these values are shown to
// customers as booking references and must not be guessable or collide.

import { randomInt } from 'crypto'

const BOOKING_PREFIX = { hotel: 'HT', cab: 'CB', bus: 'BS', train: 'TR', flight: 'FL' }
const PNR_PREFIX = { hotel: 'HTL', cab: 'CAB', bus: 'BUS', train: 'TRN', flight: 'PNR' }

// Crockford-style alphabet: no I/L/O/U, so references stay unambiguous when
// read aloud or retyped from a printed ticket.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const randomToken = (length) => {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}

export const generateBookingId = (type = 'flight') =>
  `MMT-${BOOKING_PREFIX[type] || BOOKING_PREFIX.flight}-${randomToken(8)}`

export const generatePNR = (type = 'flight') =>
  `${PNR_PREFIX[type] || PNR_PREFIX.flight}-${randomToken(6)}`

// Invoice numbers must be unique across restarts, so they carry the same random
// token rather than an in-memory counter that resets to 0001 on every deploy.
export const generateInvoiceNumber = (type = 'flight') => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `INV-${BOOKING_PREFIX[type] || BOOKING_PREFIX.flight}-${today}-${randomToken(6)}`
}

export default { generateBookingId, generatePNR, generateInvoiceNumber }
