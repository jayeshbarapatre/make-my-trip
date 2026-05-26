import prisma from '../../config/prismaClient.js'
import cacheService from '../cache/cacheService.js'

// Normalize flight from DB to standardized format
const normalizeFlightResult = (flight, source = 'db') => ({
  id: flight.id,
  airline: flight.airline,
  flightNumber: flight.flightNumber,
  from: flight.from,
  to: flight.to,
  departureTime: flight.departureTime,
  arrivalTime: flight.arrivalTime,
  duration: flight.duration,
  price: flight.price,
  seatsAvailable: flight.seatsAvailable,
  seats: flight.seats,
  stops: flight.stops || 0,
  baggage: flight.baggage || 15,
  aircraft: flight.aircraft,
  image: flight.image,
  isActive: flight.isActive,
  source // 'cache' | 'db' | 'api'
})

export const flightSearchService = {
  // Search flights with cache → DB → (future) API strategy
  search: async (params) => {
    const { from, to, date, passengers, minPrice, maxPrice } = params

    // Build cache key
    const cacheKey = `flight:${from}:${to}:${date}`

    // 1. Check cache
    const cachedResults = cacheService.get(cacheKey)
    if (cachedResults) {
      return cachedResults.map(f => normalizeFlightResult(f, 'cache'))
    }

    // 2. Query database
    const flights = await prisma.flight.findMany({
      where: {
        isActive: true,
        ...(from && { from: { contains: from, mode: 'insensitive' } }),
        ...(to && { to: { contains: to, mode: 'insensitive' } }),
        ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { price: { lte: parseFloat(maxPrice) } })
      },
      orderBy: { price: 'asc' }
    })

    // Filter by seat availability
    const available = flights.filter(f =>
      !passengers || f.seatsAvailable >= parseInt(passengers)
    )

    // Cache results for 5 minutes
    cacheService.set(cacheKey, available, 300)

    // Return normalized results
    return available.map(f => normalizeFlightResult(f, 'db'))
  },

  // Get flight details by ID
  getFlightById: async (id) => {
    const flight = await prisma.flight.findUnique({ where: { id } })
    if (!flight) return null
    return normalizeFlightResult(flight, 'db')
  },

  // Invalidate cache for a route (called after booking)
  invalidateRoute: (from, to, date) => {
    const cacheKey = `flight:${from}:${to}:${date}`
    cacheService.del(cacheKey)
  }
}

export default flightSearchService
