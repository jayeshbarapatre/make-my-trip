import prisma from '../config/prismaClient.js'

const sanitizeQuery = (q) => q ? q.trim().toLowerCase() : ''

export const getAirlines = async (req, res) => {
  try {
    const { q } = req.query
    const searchQuery = sanitizeQuery(q)

    const flights = await prisma.flight.findMany({
      select: { airline: true },
      where: { isActive: true },
      distinct: ['airline']
    })

    const airlines = flights
      .map(f => f.airline)
      .filter(airline => airline && airline.toLowerCase().includes(searchQuery))
      .sort()

    res.json({ data: airlines })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAirports = async (req, res) => {
  try {
    const { q } = req.query
    const searchQuery = sanitizeQuery(q)

    const flights = await prisma.flight.findMany({
      where: { isActive: true }
    })

    const airports = new Set()
    flights.forEach(flight => {
      if (flight.departure?.airport) airports.add(flight.departure.airport)
      if (flight.arrival?.airport) airports.add(flight.arrival.airport)
    })

    const filtered = Array.from(airports)
      .filter(airport => airport.toLowerCase().includes(searchQuery))
      .sort()

    res.json({ data: filtered })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getCities = async (req, res) => {
  try {
    const { q } = req.query
    const searchQuery = sanitizeQuery(q)

    const flights = await prisma.flight.findMany({
      where: { isActive: true }
    })

    const cities = new Set()
    flights.forEach(flight => {
      if (flight.departure?.city) cities.add(flight.departure.city)
      if (flight.arrival?.city) cities.add(flight.arrival.city)
    })

    const filtered = Array.from(cities)
      .filter(city => city.toLowerCase().includes(searchQuery))
      .sort()

    res.json({ data: filtered })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAircrafts = async (req, res) => {
  try {
    const { q } = req.query
    const searchQuery = sanitizeQuery(q)

    const flights = await prisma.flight.findMany({
      select: { aircraft: true },
      where: { isActive: true, aircraft: { not: null } },
      distinct: ['aircraft']
    })

    const aircrafts = flights
      .map(f => f.aircraft)
      .filter(aircraft => aircraft && aircraft.toLowerCase().includes(searchQuery))
      .sort()

    res.json({ data: aircrafts })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
