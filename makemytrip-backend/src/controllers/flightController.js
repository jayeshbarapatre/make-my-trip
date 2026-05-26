import prisma from '../config/prismaClient.js'
import { validateCity, validatePageNumber, validatePageSize, validateGuestCount, validateDateFormat, validatePrice } from '../utils/validation.js'

// Generate mock flights for any city pair
const generateMockFlights = (from, to) => {
  const airlines = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'Air India Express', 'GoAir', 'AirAsia']
  const aircraft = ['A320', 'Boeing 737', 'Boeing 777', 'Airbus A380', 'Bombardier']
  const flights = []

  for (let i = 0; i < 8; i++) {
    const hour = 6 + (i * 2)
    const depTime = String(hour).padStart(2, '0') + ':00'
    const arrTime = String((hour + 2) % 24).padStart(2, '0') + ':' + ['15', '30', '45', '00'][i % 4]

    flights.push({
      id: `${from}-${to}-${i}`,
      airline: airlines[i % airlines.length],
      flightNumber: `${['6E', 'AI', 'SG', 'UK', 'IX', 'G8', 'I5'][i % 7]}-${1000 + (i * 100)}`,
      departure: { city: from, time: depTime },
      arrival: { city: to, time: arrTime },
      duration: `${2 + (i % 3)}h ${15 + (i * 10) % 60}m`,
      price: 1500 + (i * 300) + Math.random() * 500,
      seatsAvailable: 20 + (i * 5),
      stops: i % 3 === 0 ? 1 : 0,
      aircraft: aircraft[i % aircraft.length],
      baggage: 15 + (i % 3) * 5,
      isActive: true
    })
  }

  return flights
}

export const searchFlights = async (req, res) => {
  try {
    const { from, to, date, passengers, page = 1, limit = 20, minPrice, maxPrice } = req.query

    // Fetch active flights from database
    const allFlights = await prisma.flight.findMany({
      where: {
        isActive: true
      },
      orderBy: { price: 'asc' }
    })

    // Filter by route and criteria
    let results = allFlights.filter(f => {
      const fromMatch = !from || (f.from && f.from.toLowerCase() === from.toLowerCase())
      const toMatch = !to || (f.to && f.to.toLowerCase() === to.toLowerCase())
      const matchPassengers = !passengers || f.seatsAvailable >= parseInt(passengers)
      const matchMinPrice = !minPrice || f.price >= parseFloat(minPrice)
      const matchMaxPrice = !maxPrice || f.price <= parseFloat(maxPrice)
      return fromMatch && toMatch && matchPassengers && matchMinPrice && matchMaxPrice
    })

    const pageNum = Math.max(1, parseInt(page) || 1)
    const pageSize = Math.min(20, parseInt(limit) || 20)
    const skip = (pageNum - 1) * pageSize
    const total = results.length
    const paged = results.slice(skip, skip + pageSize)

    res.json({
      data: paged,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    })
  } catch (err) {
    console.error('Search flights error:', err)
    res.status(500).json({ message: 'Failed to search flights', error: err.message })
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
