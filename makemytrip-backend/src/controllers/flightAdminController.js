import prisma from '../config/prismaClient.js'

export const createFlight = async (req, res) => {
  try {
    const { airline, flightNumber, departure, arrival, duration, price, seats, baggage, stops, aircraft, image } = req.body

    if (!airline || !flightNumber || !departure || !arrival || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const flight = await prisma.flight.create({
      data: {
        airline,
        flightNumber,
        departure,
        arrival,
        duration,
        price: parseFloat(price),
        seats: parseInt(seats) || 180,
        seatsAvailable: parseInt(seats) || 180,
        baggage: baggage ? parseInt(baggage) : null,
        stops: parseInt(stops) || 0,
        aircraft,
        image
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
    const updates = req.body
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
