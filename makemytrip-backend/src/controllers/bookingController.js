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
      passengers,
      rooms,
      nights,
      totalAmount,
      userEmail,
      userName,
      // Flight details
      airlineName,
      airlineCode,
      flightNumber,
      departureTime,
      arrivalTime,
      departureAirport,
      arrivalAirport,
      departureTerminal,
      arrivalTerminal,
      boardingTime,
      stops = 0,
      cabinClass,
      numBags = 1,
      travelInsurance = false,
      // Fare breakdown
      baseFare = 0,
      taxes = 0,
      convenience = 0,
      discount = 0,
      couponCode,
      gst = 0,
      // Payment details
      paymentMethod,
      paymentStatus = 'completed',
      transactionId
    } = req.body

    if (!type || !totalAmount) {
      return res.status(400).json({ message: 'Booking type and totalAmount are required' })
    }

    const bookingId = 'MMT-' + (type === 'hotel' ? 'HT-' : 'FL-') + Math.floor(100000 + Math.random() * 900000)
    const pnr = (type === 'hotel' ? 'HTL-' : 'PNR-') + Math.floor(100000 + Math.random() * 900000)

    const db = req.mockPrisma || prisma
    let newBooking
    let seatsCabsRoomsToDecrement = 0

    if (type === 'flight') {
      let bookingFromCity = fromCity
      let bookingToCity = toCity

      if (flightId) {
        const flight = await db.flight.findUnique({ where: { id: flightId } })
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

        await db.flight.update({
          where: { id: flightId },
          data: { seatsAvailable: flight.seatsAvailable - passengerCount }
        })
      }

      newBooking = await db.booking.create({
        data: {
          userId,
          type,
          fromCity: bookingFromCity || 'Unknown',
          toCity: bookingToCity || 'Unknown',
          departureDate: departureDate || checkIn || new Date().toISOString().split('T')[0],
          returnDate: returnDate || checkOut || null,
          travellers,
          passengers,
          totalAmount,
          bookingId,
          pnr,
          status: 'confirmed',
          // Flight details
          airlineName,
          airlineCode,
          flightNumber,
          departureTime,
          arrivalTime,
          departureAirport,
          arrivalAirport,
          departureTerminal,
          arrivalTerminal,
          boardingTime,
          stops,
          cabinClass,
          numBags,
          travelInsurance,
          // Fare breakdown
          baseFare: baseFare || totalAmount * 0.8,
          taxes: taxes || totalAmount * 0.15,
          convenience: convenience || 0,
          discount: discount || 0,
          couponCode,
          gst: gst || totalAmount * 0.05,
          // Payment details
          paymentMethod,
          paymentStatus,
          transactionId
        }
      })
    } else if (type === 'hotel') {
      const roomsNeeded = rooms || 1

      // If hotelId provided, validate availability
      if (hotelId) {
        const hotel = await db.hotel.findUnique({ where: { id: hotelId } })
        if (!hotel) {
          return res.status(404).json({ message: 'Hotel not found' })
        }

        if (hotel.roomsAvailable < roomsNeeded) {
          return res.status(400).json({ message: `Only ${hotel.roomsAvailable} rooms available` })
        }

        newBooking = await db.booking.create({
          data: {
            userId,
            type,
            fromCity: hotel.name || hotel.city,
            toCity: hotel.city,
            departureDate: checkIn || departureDate,
            returnDate: checkOut || returnDate,
            travellers: { ...travellers, rooms: roomsNeeded, nights },
            passengers,
            totalAmount,
            bookingId,
            pnr,
            status: 'confirmed',
            baseFare: baseFare || totalAmount * 0.8,
            taxes: taxes || totalAmount * 0.15,
            convenience: convenience || 0,
            discount: discount || 0,
            couponCode,
            gst: gst || totalAmount * 0.05,
            paymentMethod,
            paymentStatus,
            transactionId,
            numBags: nights || 1
          }
        })

        await db.hotel.update({
          where: { id: hotelId },
          data: { roomsAvailable: hotel.roomsAvailable - roomsNeeded }
        })
      } else {
        // Create booking without hotel lookup (for payment page flow)
        newBooking = await db.booking.create({
          data: {
            userId,
            type,
            fromCity: fromCity || 'Unknown Hotel',
            toCity: toCity || '',
            departureDate: checkIn || departureDate,
            returnDate: checkOut || returnDate,
            travellers,
            passengers,
            totalAmount,
            bookingId,
            pnr,
            status: 'confirmed',
            baseFare: baseFare || totalAmount * 0.8,
            taxes: taxes || totalAmount * 0.15,
            convenience: convenience || 0,
            discount: discount || 0,
            couponCode,
            gst: gst || totalAmount * 0.05,
            paymentMethod,
            paymentStatus,
            transactionId,
            numBags: nights || 1
          }
        })
      }
    } else if (type === 'bus') {
      let busOperatorName = ''
      let busBusNumber = ''
      let busArrivalTime = ''
      let busDepartureTime = ''
      let bookingFromCity = fromCity
      let bookingToCity = toCity

      // If busId provided, fetch and validate bus
      if (req.body.busId) {
        const bus = await db.bus.findUnique({ where: { id: req.body.busId } })
        if (!bus) {
          return res.status(404).json({ message: 'Bus not found' })
        }

        busOperatorName = bus.operatorName || ''
        busBusNumber = bus.busNumber || ''
        busDepartureTime = bus.departure?.time || departureTime || ''
        busArrivalTime = bus.arrival?.time || arrivalTime || ''

        const dep = typeof bus.departure === 'string' ? JSON.parse(bus.departure) : bus.departure
        const arr = typeof bus.arrival === 'string' ? JSON.parse(bus.arrival) : bus.arrival
        bookingFromCity = dep?.city || bus.from || fromCity || 'Unknown'
        bookingToCity = arr?.city || bus.to || toCity || 'Unknown'

        // Check availability
        const passengerCount = Array.isArray(travellers?.passengers) ? travellers.passengers.length : 1
        if (bus.seatsAvailable < passengerCount) {
          return res.status(400).json({ message: `Only ${bus.seatsAvailable} seats available` })
        }

        // Decrement available seats
        await db.bus.update({
          where: { id: req.body.busId },
          data: { seatsAvailable: bus.seatsAvailable - passengerCount }
        })
      }

      newBooking = await db.booking.create({
        data: {
          userId,
          type,
          fromCity: bookingFromCity,
          toCity: bookingToCity,
          departureDate: departureDate || new Date().toISOString().split('T')[0],
          returnDate: returnDate || null,
          travellers: travellers || {},
          passengers,
          totalAmount: parseFloat(totalAmount),
          bookingId: req.body.bookingId || bookingId,
          pnr: req.body.pnr || pnr,
          status: 'confirmed',
          baseFare: baseFare || parseFloat(totalAmount) * 0.8,
          taxes: taxes || parseFloat(totalAmount) * 0.15,
          convenience: convenience || 0,
          discount: discount || 0,
          couponCode,
          gst: gst || parseFloat(totalAmount) * 0.05,
          paymentMethod,
          paymentStatus,
          transactionId,
          // Bus-specific fields
          airlineName: busOperatorName,
          busNumber: busBusNumber,
          departureTime: busDepartureTime,
          arrivalTime: busArrivalTime
        }
      })
    } else if (['train', 'cab'].includes(type)) {
      newBooking = await db.booking.create({
        data: {
          userId,
          type,
          fromCity: fromCity || 'Unknown',
          toCity: toCity || '',
          departureDate: departureDate || new Date().toISOString().split('T')[0],
          returnDate: returnDate || null,
          travellers: travellers || {},
          passengers,
          totalAmount: parseFloat(totalAmount),
          bookingId: req.body.bookingId || bookingId,
          pnr: req.body.pnr || pnr,
          status: 'confirmed',
          baseFare: baseFare || parseFloat(totalAmount) * 0.8,
          taxes: taxes || parseFloat(totalAmount) * 0.15,
          convenience: convenience || 0,
          discount: discount || 0,
          couponCode,
          gst: gst || parseFloat(totalAmount) * 0.05,
          paymentMethod,
          paymentStatus,
          transactionId
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

    const db = req.mockPrisma || prisma
    const bookings = await db.booking.findMany({ where: { userId } })
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

    const db = req.mockPrisma || prisma
    const booking = await db.booking.findUnique({ where: { id } })

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

    const db = req.mockPrisma || prisma
    const booking = await db.booking.findUnique({ where: { id } })

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only cancel your own bookings' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' })
    }

    const updated = await db.booking.update({
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
    const db = req.mockPrisma || prisma
    const overlappingBookings = await db.booking.findMany({
      where: {
        type: 'hotel',
        OR: [
          { fromCity: targetHotel },
          { toCity: targetHotel }
        ],
        status: 'confirmed',
        departureDate: targetCheckIn,
        returnDate: targetCheckOut
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
    const db = req.mockPrisma || prisma
    const bookings = await db.booking.findMany({
      where: {
        type: 'hotel',
        OR: [
          { fromCity: hotelName },
          { toCity: hotelName }
        ],
        status: 'confirmed'
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
    const db = req.mockPrisma || prisma
    const bookings = await db.booking.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('Get all bookings error:', err);
    res.status(500).json({ message: err.message });
  }
}
