import prisma from '../config/prismaClient.js'

export const searchFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })
    res.json({ data: flights })
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
    res.json({ data: flight })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAllFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({ orderBy: { price: 'asc' } })
    res.json({ data: flights })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createFlight = async (req, res) => {
  try {
    const { airline, flightNumber, departure, arrival, duration, price, seats, stops, aircraft, baggage } = req.body

    if (!airline || !flightNumber || !departure || !arrival || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const depStr = typeof departure === 'string' ? departure : JSON.stringify(departure)
    const arrStr = typeof arrival === 'string' ? arrival : JSON.stringify(arrival)

    const flight = await prisma.flight.create({
      data: {
        airline,
        flightNumber,
        departure: depStr,
        arrival: arrStr,
        duration: duration || '2h',
        price: parseFloat(price),
        seats: seats || 180,
        seatsAvailable: seats || 180,
        stops: stops || 0,
        aircraft: aircraft || 'Boeing 737',
        baggage: baggage || 15,
        isActive: true
      }
    })

    res.status(201).json({ data: flight, message: 'Flight created successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateFlight = async (req, res) => {
  try {
    const { id } = req.params
    const { airline, departure, arrival, duration, price, seats, stops, aircraft, baggage, isActive } = req.body

    const flight = await prisma.flight.findUnique({ where: { id } })
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' })
    }

    let depStr = flight.departure
    let arrStr = flight.arrival

    if (departure) {
      depStr = typeof departure === 'string' ? departure : JSON.stringify(departure)
    }
    if (arrival) {
      arrStr = typeof arrival === 'string' ? arrival : JSON.stringify(arrival)
    }

    const updated = await prisma.flight.update({
      where: { id },
      data: {
        airline: airline || flight.airline,
        departure: depStr,
        arrival: arrStr,
        duration: duration || flight.duration,
        price: price ? parseFloat(price) : flight.price,
        seats: seats !== undefined ? seats : flight.seats,
        seatsAvailable: seats !== undefined ? seats : flight.seatsAvailable,
        stops: stops !== undefined ? stops : flight.stops,
        aircraft: aircraft || flight.aircraft,
        baggage: baggage !== undefined ? baggage : flight.baggage,
        isActive: isActive !== undefined ? isActive : flight.isActive
      }
    })

    res.json({ data: updated, message: 'Flight updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteFlight = async (req, res) => {
  try {
    const { id } = req.params
    const flight = await prisma.flight.findUnique({ where: { id } })
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' })
    }

    await prisma.flight.delete({ where: { id } })
    res.json({ message: 'Flight deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
