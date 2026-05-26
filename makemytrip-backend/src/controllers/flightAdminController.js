import prisma from '../config/prismaClient.js'
import { validatePrice, validateSeats } from '../utils/validation.js'

export const createFlight = async (req, res) => {
  try {
    const { airline, flightNumber, departure, arrival, duration, price, seats, baggage, stops, aircraft, image } = req.body

    const errors = {}
    if (!airline || !airline.trim()) errors.airline = 'Airline name is required'
    if (!flightNumber || !flightNumber.trim()) errors.flightNumber = 'Flight number is required'
    if (!departure) errors.departure = 'Departure details are required'
    if (!arrival) errors.arrival = 'Arrival details are required'
    if (!price) errors.price = 'Price is required'
    else if (!validatePrice(price).valid) errors.price = 'Invalid price'

    if (seats && !validateSeats(seats).valid) {
      errors.seats = 'Seats must be between 0 and 500'
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const seatCount = parseInt(seats) || 180
    const flight = await prisma.flight.create({
      data: {
        airline: airline.trim(),
        flightNumber: flightNumber.trim(),
        departure,
        arrival,
        duration: duration || '2h',
        price: parseFloat(price),
        seats: seatCount,
        seatsAvailable: seatCount,
        baggage: baggage ? parseInt(baggage) : 15,
        stops: parseInt(stops) || 0,
        aircraft: aircraft || 'Boeing 737',
        image,
        isActive: true
      }
    })

    res.status(201).json({ message: 'Flight created successfully', data: { flight } })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Flight number already exists' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const getAllFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ data: { flights, pagination: { total: flights.length, page: 1 } } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getFlightById = async (req, res) => {
  try {
    const flight = await prisma.flight.findUnique({ where: { id: req.params.id } })
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' })
    }
    res.json({ data: { flight } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateFlight = async (req, res) => {
  try {
    const { id, createdAt, updatedAt, ...updates } = req.body

    const errors = {}
    if (updates.price && !validatePrice(updates.price).valid) errors.price = 'Invalid price'
    if (updates.seats && !validateSeats(updates.seats).valid) errors.seats = 'Seats must be between 0 and 500'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const flight = await prisma.flight.update({
      where: { id: req.params.id },
      data: {
        ...updates,
        price: updates.price ? parseFloat(updates.price) : undefined,
        seats: updates.seats ? parseInt(updates.seats) : undefined,
        seatsAvailable: updates.seatsAvailable ? parseInt(updates.seatsAvailable) : undefined,
        baggage: updates.baggage ? parseInt(updates.baggage) : undefined,
        stops: updates.stops ? parseInt(updates.stops) : undefined
      }
    })

    res.json({ message: 'Flight updated successfully', data: { flight } })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Flight not found' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const deleteFlight = async (req, res) => {
  try {
    await prisma.flight.delete({ where: { id: req.params.id } })
    res.json({ message: 'Flight deleted successfully' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Flight not found' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const toggleFlightStatus = async (req, res) => {
  try {
    const flight = await prisma.flight.findUnique({ where: { id: req.params.id } })
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' })
    }

    const updated = await prisma.flight.update({
      where: { id: req.params.id },
      data: { isActive: !flight.isActive }
    })

    res.json({ message: `Flight ${updated.isActive ? 'activated' : 'deactivated'}`, data: { flight: updated } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
