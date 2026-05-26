import prisma from '../config/prismaClient.js'

// Generate unique PNR
const generatePNR = (type) => {
  const prefix = type === 'flight' ? 'MMT-FL' : 'MMT-TR'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

// Generate unique booking ID
const generateBookingId = (type) => {
  const prefix = type === 'flight' ? 'BKG-FL' : 'BKG-TR'
  const timestamp = Date.now().toString().slice(-8)
  return `${prefix}-${timestamp}`
}

export const bookingService = {
  // Create flight booking with seat decrement
  createFlightBooking: async ({ userId, flightId, passengers, fareClass, totalAmount, travellers }) => {
    const flight = await prisma.flight.findUnique({ where: { id: flightId } })
    if (!flight) throw new Error('Flight not found')

    const passengerCount = Array.isArray(passengers) ? passengers.length : parseInt(passengers)

    if (flight.seatsAvailable < passengerCount) {
      throw new Error('Not enough seats available')
    }

    // Use transaction to ensure seat decrement is atomic
    const booking = await prisma.$transaction(async (tx) => {
      // Decrement seats
      await tx.flight.update({
        where: { id: flightId },
        data: { seatsAvailable: { decrement: passengerCount } }
      })

      // Create booking
      return await tx.booking.create({
        data: {
          userId,
          type: 'flight',
          fromCity: flight.from,
          toCity: flight.to,
          departureDate: travellers?.searchParams?.date || new Date().toISOString().split('T')[0],
          travellers: {
            passengers,
            fareClass,
            flightDetails: {
              id: flight.id,
              airline: flight.airline,
              flightNumber: flight.flightNumber,
              departure: flight.departure,
              arrival: flight.arrival
            }
          },
          totalAmount,
          bookingId: generateBookingId('flight'),
          pnr: generatePNR('flight'),
          status: 'confirmed'
        }
      })
    })

    return {
      success: true,
      bookingId: booking.bookingId,
      pnr: booking.pnr,
      status: booking.status
    }
  },

  // Create train booking with seat decrement
  createTrainBooking: async ({ userId, trainId, passengers, class: fareClass, quota, totalAmount, travellers }) => {
    const train = await prisma.train.findUnique({ where: { id: trainId } })
    if (!train) throw new Error('Train not found')

    const passengerCount = Array.isArray(passengers) ? passengers.length : parseInt(passengers)

    if (train.seatsAvailable < passengerCount) {
      throw new Error('Not enough seats available')
    }

    // Use transaction to ensure seat decrement is atomic
    const booking = await prisma.$transaction(async (tx) => {
      // Decrement seats
      await tx.train.update({
        where: { id: trainId },
        data: { seatsAvailable: { decrement: passengerCount } }
      })

      // Create booking
      return await tx.booking.create({
        data: {
          userId,
          type: 'train',
          fromCity: train.departure?.city || 'Unknown',
          toCity: train.arrival?.city || 'Unknown',
          departureDate: travellers?.searchParams?.date || new Date().toISOString().split('T')[0],
          travellers: {
            passengers,
            class: fareClass,
            quota,
            trainDetails: {
              id: train.id,
              trainNumber: train.trainNumber,
              operatorName: train.operatorName,
              type: train.type,
              departure: train.departure,
              arrival: train.arrival
            }
          },
          totalAmount,
          bookingId: generateBookingId('train'),
          pnr: generatePNR('train'),
          status: 'confirmed'
        }
      })
    })

    return {
      success: true,
      bookingId: booking.bookingId,
      pnr: booking.pnr,
      status: booking.status
    }
  },

  // Get booking by PNR
  getBookingByPNR: async (pnr) => {
    return await prisma.booking.findFirst({
      where: { pnr },
      include: { user: { select: { id: true, name: true, email: true } } }
    })
  },

  // Get user's bookings
  getUserBookings: async (userId, type = null) => {
    return await prisma.booking.findMany({
      where: {
        userId,
        ...(type && { type })
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  // Get booking status
  getBookingStatus: async (bookingId) => {
    const booking = await prisma.booking.findFirst({
      where: { bookingId }
    })
    if (!booking) return null
    return {
      bookingId: booking.bookingId,
      pnr: booking.pnr,
      status: booking.status,
      type: booking.type,
      createdAt: booking.createdAt
    }
  }
}

export default bookingService
