import prisma from '../../config/prismaClient.js'
import cacheService from '../cache/cacheService.js'

// Normalize train from DB to standardized format
const normalizeTrainResult = (train, source = 'db') => ({
  id: train.id,
  trainNumber: train.trainNumber,
  operatorName: train.operatorName,
  type: train.type,
  departure: train.departure,
  arrival: train.arrival,
  durationMinutes: train.durationMinutes,
  price: train.price,
  seatsAvailable: train.seatsAvailable,
  seats: train.seats,
  amenities: train.amenities || [],
  image: train.image,
  isActive: train.isActive,
  source // 'cache' | 'db' | 'api'
})

export const trainSearchService = {
  // Search trains with cache → DB strategy
  search: async (params) => {
    const { from, to, date, type, minPrice, maxPrice, search: searchTerm, db = prisma } = params

    // Build cache key (date-based for daily updates)
    const cacheKey = `train:${from}:${to}:${date}`

    // 1. Check cache
    const cachedResults = cacheService.get(cacheKey)
    if (cachedResults) {
      return cachedResults.map(t => normalizeTrainResult(t, 'cache'))
    }

    // 2. Query database
    const baseWhere = {
      isActive: true,
      ...(type && { type })
    }

    if (minPrice || maxPrice) {
      baseWhere.price = {}
      if (minPrice) baseWhere.price.gte = parseFloat(minPrice)
      if (maxPrice) baseWhere.price.lte = parseFloat(maxPrice)
    }

    if (searchTerm) {
      baseWhere.OR = [
        { operatorName: { contains: searchTerm, mode: 'insensitive' } },
        { trainNumber: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    const trains = await db.train.findMany({
      where: baseWhere,
      orderBy: { price: 'asc' }
    })

    // Filter by route (JSON fields) and seat availability in memory
    let results = trains.filter(t => {
      const fromMatch = !from ||
        (t.departure && t.departure.city && t.departure.city.toLowerCase().includes(from.toLowerCase()))
      const toMatch = !to ||
        (t.arrival && t.arrival.city && t.arrival.city.toLowerCase().includes(to.toLowerCase()))
      return fromMatch && toMatch
    })

    // Cache results for 5 minutes
    cacheService.set(cacheKey, results, 300)

    // Return normalized results
    return results.map(t => normalizeTrainResult(t, 'db'))
  },

  // Get train details by ID
  getTrainById: async (id) => {
    const train = await prisma.train.findUnique({ where: { id } })
    if (!train) return null
    return normalizeTrainResult(train, 'db')
  },

  // Invalidate cache for a route (called after booking)
  invalidateRoute: (from, to, date) => {
    const cacheKey = `train:${from}:${to}:${date}`
    cacheService.del(cacheKey)
  }
}

export default trainSearchService
