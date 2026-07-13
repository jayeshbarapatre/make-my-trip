// Booking utility functions for consistent booking ID generation

import crypto from 'crypto'

export const generateBookingId = (type = 'flight') => {
  const prefix = type === 'hotel' ? 'HTL' : 'FLT'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export const generatePNR = (type = 'flight') => {
  const prefix = type === 'hotel' ? 'HTL' : 'PNR'
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}-${random}`
}

export const calculatePassengerCount = (travellers) => {
  if (Array.isArray(travellers)) {
    return travellers.length
  }

  if (typeof travellers === 'object' && travellers !== null) {
    return (travellers.adults || 1) + (travellers.children || 0) + (travellers.infants || 0)
  }

  return 1
}

export const calculateRoomCount = (travellers) => {
  if (typeof travellers === 'object' && travellers !== null) {
    return travellers.rooms || 1
  }
  return 1
}

export const validateBookingData = (data) => {
  const errors = {}

  if (!data.type) {
    errors.type = 'Booking type is required'
  }

  if (!data.totalAmount || typeof data.totalAmount !== 'number' || data.totalAmount <= 0) {
    errors.totalAmount = 'Valid total amount is required'
  }

  if (data.type === 'flight' && !data.flightId) {
    errors.flightId = 'Flight ID is required for flight booking'
  }

  // hotelId is optional - bookings can be created without specific hotel selection (e.g., on payment page)

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
