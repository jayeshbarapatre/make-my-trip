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
      totalAmount,
      userEmail,
      userName
    } = req.body

    if (!type || !totalAmount) {
      return res.status(400).json({ message: 'Booking type and totalAmount are required' })
    }

    const bookingId = 'MMT-' + (type === 'hotel' ? 'HT-' : 'FL-') + Math.floor(100000 + Math.random() * 900000)
    const pnr = (type === 'hotel' ? 'HTL-' : 'PNR-') + Math.floor(100000 + Math.random() * 900000)

    let newBooking
    let seatsCabsRoomsToDecrement = 0

    if (type === 'flight') {
      let bookingFromCity = fromCity
      let bookingToCity = toCity

      if (flightId) {
        const flight = await prisma.flight.findUnique({ where: { id: flightId } })
        if (!flight) {
          return res.status(404).json({ message: 'Flight not found' })
        }

        const passengerCount = Array.isArray(travellers) ? travellers.length : (travellers?.adults || 1) + (travellers?.children || 0) + (travellers?.infants || 0)

        if (flight.seatsAvailable < passengerCount) {
          return res.status(400).json({ message: `Only ${flight.seatsAvailable} seats available` })
        }

        const dep = typeof flight.departure === 'string' ? JSON.parse(flight.departure) : flight.departure
        const arr = typeof flight.arrival === 'string' ? JSON.parse(flight.arrival) : flight.arrival
        bookingFromCity = dep?.city || fromCity
        bookingToCity = arr?.city || toCity

        await prisma.flight.update({
          where: { id: flightId },
          data: { seatsAvailable: { decrement: passengerCount } }
        })
      }

      newBooking = await prisma.booking.create({
        data: {
          userId,
          type,
          fromCity: bookingFromCity || 'Unknown',
          toCity: bookingToCity || 'Unknown',
          departureDate: departureDate || checkIn || new Date().toISOString().split('T')[0],
          returnDate: returnDate || checkOut || null,
          travellers,
          totalAmount,
          bookingId,
          pnr,
          status: 'confirmed'
        }
      })
    } else if (type === 'hotel') {
      const roomsNeeded = rooms || 1

      // If hotelId provided, validate availability
      if (hotelId) {
        const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } })
        if (!hotel) {
          return res.status(404).json({ message: 'Hotel not found' })
        }

        if (hotel.roomsAvailable < roomsNeeded) {
          return res.status(400).json({ message: `Only ${hotel.roomsAvailable} rooms available` })
        }

        newBooking = await prisma.booking.create({
          data: {
            userId,
            type,
            fromCity: hotel.name || hotel.city,
            toCity: hotel.city,
            departureDate: checkIn || departureDate,
            returnDate: checkOut || returnDate,
            travellers: { ...travellers, rooms: roomsNeeded, nights },
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
        // Create booking without hotel lookup (for payment page flow)
        newBooking = await prisma.booking.create({
          data: {
            userId,
            type,
            fromCity: fromCity || 'Unknown Hotel',
            toCity: toCity || '',
            departureDate: checkIn || departureDate,
            returnDate: checkOut || returnDate,
            travellers,
            totalAmount,
            bookingId,
            pnr,
            status: 'confirmed'
          }
        })
      }
    } else if (['train', 'bus', 'cab'].includes(type)) {
      newBooking = await prisma.booking.create({
        data: {
          userId,
          type,
          fromCity: fromCity || 'Unknown',
          toCity: toCity || '',
          departureDate: departureDate || new Date().toISOString().split('T')[0],
          returnDate: returnDate || null,
          travellers: travellers || {},
          totalAmount: parseFloat(totalAmount),
          bookingId: req.body.bookingId || bookingId,
          pnr: req.body.pnr || pnr,
          status: 'confirmed'
        }
      })
    } else {
      return res.status(400).json({ message: 'Valid booking type (flight, hotel, train, bus, or cab) required' })
    }

    sendBookingConfirmationEmail({
      ...newBooking,
      userEmail: userEmail || newBooking.userEmail,
      userName: userName || newBooking.userName
    })

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

    res.json({ success: true, data: updated, message: 'Booking cancelled successfully' })
  } catch (err) {
    console.error('Cancel booking error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const checkHotelOverlap = async (req, res) => {
  try {
    const { fromCity, toCity, departureDate, returnDate, travellers, hotelName, checkIn, checkOut, bookEntireHotel } = req.body;
    
    const targetHotel = toCity || hotelName;
    const targetCheckIn = departureDate || checkIn;
    const targetCheckOut = returnDate || checkOut;
    const isRequestingEntireHotel = bookEntireHotel !== undefined ? bookEntireHotel : travellers?.bookEntireHotel;

    if (!targetHotel || !targetCheckIn || !targetCheckOut) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }
    
    // Find overlapping hotel bookings for the exact same dates
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        type: 'hotel',
        OR: [
          { fromCity: targetHotel },
          { toCity: targetHotel }
        ],
        status: { in: ['confirmed'] },
        AND: [
          { departureDate: targetCheckIn },
          { returnDate: targetCheckOut }
        ]
      }
    });

    if (overlappingBookings.length === 0) {
      return res.json({ success: true, available: true });
    }

    // If requesting entire hotel
    if (isRequestingEntireHotel) {
      return res.json({ 
        success: true, 
        available: false, 
        message: 'This property cannot be booked as an entire property because some rooms are already booked for these dates.' 
      });
    } else {
      // If requesting a room, check if ANY existing booking is an entire hotel takeover
      const isEntireHotelBooked = overlappingBookings.some(b => {
        let isEntire = false;
        try {
          const t = typeof b.travellers === 'string' ? JSON.parse(b.travellers) : b.travellers;
          isEntire = t?.bookEntireHotel === true;
        } catch (e) {
          console.error("Error parsing travellers", e);
        }
        return isEntire;
      });

      if (isEntireHotelBooked) {
        return res.json({ 
          success: true, 
          available: false, 
          message: 'This entire property is already booked for these dates.' 
        });
      }
    }

    return res.json({ success: true, available: true });
  } catch (err) {
    console.error('Check hotel overlap error:', err);
    res.status(500).json({ message: err.message });
  }
}

export const getHotelBlockedDates = async (req, res) => {
  try {
    const { hotelName } = req.params;
    const bookings = await prisma.booking.findMany({
      where: {
        type: 'hotel',
        OR: [
          { fromCity: hotelName },
          { toCity: hotelName }
        ],
        status: { in: ['confirmed'] }
      },
      select: {
        departureDate: true,
        returnDate: true,
        travellers: true
      }
    });

    const blockedDates = new Set();
    
    bookings.forEach(b => {
      if (b.departureDate && b.returnDate) {
        const start = new Date(b.departureDate + 'T00:00:00');
        const end = new Date(b.returnDate + 'T00:00:00');
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Adjust for timezone offset to ensure YYYY-MM-DD matches local date
          const offset = d.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(d.getTime() - offset)).toISOString().split('T')[0];
          blockedDates.add(localISOTime);
        }
      }
    });

    res.json({ success: true, data: Array.from(blockedDates) });
  } catch (err) {
    console.error('Get blocked dates error:', err);
    res.status(500).json({ message: err.message });
  }
}

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Get all bookings error:', err);
    res.status(500).json({ message: err.message });
  }
}
