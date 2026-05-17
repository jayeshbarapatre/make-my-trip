import prisma from '../config/prismaClient.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

export const createBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to create booking' })
    }

    const {
      type = 'flight',
      flightId,
      hotelId,
      fromCity,
      toCity,
      departureDate,
      returnDate,
      checkIn,
      checkOut,
      travellers,
      rooms,
      nights,
      totalAmount
    } = req.body

    if (!type || !totalAmount) {
      return res.status(400).json({ message: 'Booking type and totalAmount are required' })
    }

    const bookingId = 'MMT-' + (type === 'hotel' ? 'HT-' : 'FL-') + Math.floor(100000 + Math.random() * 900000)
    const pnr = (type === 'hotel' ? 'HTL-' : 'PNR-') + Math.floor(100000 + Math.random() * 900000)

    let newBooking
    let seatsCabsRoomsToDecrement = 0

    if (type === 'flight' && flightId) {
      const flight = await prisma.flight.findUnique({ where: { id: flightId } })
      if (!flight) {
        return res.status(404).json({ message: 'Flight not found' })
      }

      const passengerCount = Array.isArray(travellers) ? travellers.length : (travellers?.adults || 1) + (travellers?.children || 0) + (travellers?.infants || 0)

      if (flight.seatsAvailable < passengerCount) {
        return res.status(400).json({ message: `Only ${flight.seatsAvailable} seats available` })
      }

      seatsCabsRoomsToDecrement = passengerCount

      newBooking = await prisma.booking.create({
        data: {
          userId,
          type,
          flightId,
          fromCity: flight.from,
          toCity: flight.to,
          departureDate,
          returnDate,
          travellers,
          totalAmount,
          bookingId,
          pnr,
          status: 'confirmed'
        }
      })

      await prisma.flight.update({
        where: { id: flightId },
        data: { seatsAvailable: { decrement: passengerCount } }
      })
    } else if (type === 'hotel' && hotelId) {
      const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } })
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' })
      }

      const roomsNeeded = rooms || 1
      if (hotel.roomsAvailable < roomsNeeded) {
        return res.status(400).json({ message: `Only ${hotel.roomsAvailable} rooms available` })
      }

      newBooking = await prisma.booking.create({
        data: {
          userId,
          type,
          hotelId,
          fromCity: hotel.city,
          toCity: hotel.city,
          checkIn,
          checkOut,
          travellers,
          rooms: roomsNeeded,
          nights,
          totalAmount,
          bookingId,
          pnr,
          status: 'confirmed'
        }
      })

      await prisma.hotel.update({
        where: { id: hotelId },
        data: { roomsAvailable: { decrement: roomsNeeded } }
      })
    } else {
      return res.status(400).json({ message: 'Valid flightId or hotelId required for the booking type' })
    }

    sendBookingConfirmationEmail(newBooking)

    res.status(201).json({ success: true, data: newBooking })
  } catch (err) {
    console.error('Create booking error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const bookings = await prisma.booking.findMany({ where: { userId } })
    res.json({ success: true, data: bookings })
  } catch (err) {
    console.error('Get user bookings error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const getBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own bookings' })
    }

    res.json({ success: true, data: booking })
  } catch (err) {
    console.error('Get booking error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const cancelBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only cancel your own bookings' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    if (booking.type === 'flight' && booking.flightId) {
      const passengerCount = Array.isArray(booking.travellers) ? booking.travellers.length : (booking.travellers?.adults || 1) + (booking.travellers?.children || 0) + (booking.travellers?.infants || 0)
      await prisma.flight.update({
        where: { id: booking.flightId },
        data: { seatsAvailable: { increment: passengerCount } }
      })
    } else if (booking.type === 'hotel' && booking.hotelId) {
      const roomsBooked = booking.rooms || 1
      await prisma.hotel.update({
        where: { id: booking.hotelId },
        data: { roomsAvailable: { increment: roomsBooked } }
      })
    }

    res.json({ success: true, data: updated, message: 'Booking cancelled successfully' })
  } catch (err) {
    console.error('Cancel booking error:', err)
    res.status(500).json({ message: err.message })
  }
}
