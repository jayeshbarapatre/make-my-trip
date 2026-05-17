import prisma from '../config/prismaClient.js'
import { validateCity, validatePageNumber, validatePageSize, validateGuestCount, validateDateFormat, validatePrice } from '../utils/validation.js'

export const searchFlights = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20, minPrice, maxPrice } = req.query

    const errors = {}
    if (from && !validateCity(from)) errors.from = 'Invalid departure city'
    if (to && !validateCity(to)) errors.to = 'Invalid arrival city'
    if (date && !validateDateFormat(date)) errors.date = 'Invalid date format (YYYY-MM-DD)'
    if (passengers && !validateGuestCount(passengers).valid) errors.passengers = 'Invalid passenger count'
    if (minPrice && !validatePrice(minPrice).valid) errors.minPrice = 'Invalid minimum price'
    if (maxPrice && !validatePrice(maxPrice).valid) errors.maxPrice = 'Invalid maximum price'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const pageNum = validatePageNumber(page)
    const pageSize = validatePageSize(limit)
    const skip = (pageNum - 1) * pageSize

    const whereClause = { isActive: true }

    const flights = await prisma.flight.findMany({
      where: whereClause,
      orderBy: { price: 'asc' },
      skip,
      take: pageSize
    })

    const filtered = flights
      .filter(f => !from || (f.departure && f.departure.city && f.departure.city.toLowerCase().includes(from.toLowerCase())))
      .filter(f => !to || (f.arrival && f.arrival.city && f.arrival.city.toLowerCase().includes(to.toLowerCase())))
      .filter(f => !passengers || f.seatsAvailable >= parseInt(passengers))
      .filter(f => !minPrice || f.price >= parseFloat(minPrice))
      .filter(f => !maxPrice || f.price <= parseFloat(maxPrice))

    const total = flights.filter(f =>
      (!from || (f.departure && f.departure.city && f.departure.city.toLowerCase().includes(from.toLowerCase()))) &&
      (!to || (f.arrival && f.arrival.city && f.arrival.city.toLowerCase().includes(to.toLowerCase())))
    ).length

    res.json({
      data: filtered,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    })
  } catch (err) {
    console.error('Search flights error:', err)
    res.status(500).json({ message: 'Failed to search flights' })
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

    const depObj = typeof departure === 'string' ? JSON.parse(departure) : departure
    const arrObj = typeof arrival === 'string' ? JSON.parse(arrival) : arrival

    const flight = await prisma.flight.create({
      data: {
        airline,
        flightNumber,
        departure: depObj,
        arrival: arrObj,
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

    let depObj = flight.departure
    let arrObj = flight.arrival

    if (departure) {
      depObj = typeof departure === 'string' ? JSON.parse(departure) : departure
    }
    if (arrival) {
      arrObj = typeof arrival === 'string' ? JSON.parse(arrival) : arrival
    }

    const updated = await prisma.flight.update({
      where: { id },
      data: {
        airline: airline || flight.airline,
        departure: depObj,
        arrival: arrObj,
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
