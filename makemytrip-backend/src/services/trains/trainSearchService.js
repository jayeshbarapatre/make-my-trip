import prisma from '../../config/prismaClient.js'
import cacheService from '../cache/cacheService.js'
import { searchTrainsCleartrip } from '../../config/allApiClients.js'

// Normalize train from DB to standardized format
const normalizeTrainResult = (train, source = 'db') => ({
  id: train.id || train.trainNumber,
  trainNumber: train.trainNumber,
  trainName: train.trainName || train.operatorName,
  operatorName: train.operatorName || 'Indian Railways',
  type: train.type,
  departure: train.departure,
  arrival: train.arrival,
  durationMinutes: train.durationMinutes,
  duration: train.duration,
  price: train.price,
  seatsAvailable: train.seatsAvailable || train.seats,
  seats: train.seats || train.seatsAvailable,
  amenities: train.amenities || [],
  image: train.image,
  isActive: train.isActive !== false,
  source // 'cache' | 'db' | 'api' | 'irctc'
})

export const trainSearchService = {
  // Search trains with Cleartrip API → Cache → DB strategy
  search: async (params) => {
    const { from, to, date, type, minPrice, maxPrice, search: searchTerm, db = prisma } = params

    // Build cache key (date-based for daily updates)
    const cacheKey = `train:${from}:${to}:${date}`

    // 1. Check cache first
    const cachedResults = cacheService.get(cacheKey)
    if (cachedResults) {
      return cachedResults.map(t => normalizeTrainResult(t, 'cache'))
    }

    let results = []

    // 2. Try Cleartrip API if credentials available
    if (process.env.CLEARTRIP_API_KEY && from && to && date) {
      try {
        console.log(`[TRAINS] Attempting Cleartrip API search: ${from} → ${to} on ${date}`)
        const cleartripResults = await searchTrainsCleartrip(from, to, date)
        if (cleartripResults && cleartripResults.length > 0) {
          results = cleartripResults
          console.log(`[TRAINS] Found ${results.length} trains from Cleartrip API`)
        }
      } catch (error) {
        console.log(`[TRAINS] Cleartrip API failed, falling back to mock data: ${error.message}`)
      }
    }

    // 3. Fallback to database/mock data if Cleartrip failed or unavailable
    if (results.length === 0) {
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
      results = trains.filter(t => {
        const fromMatch = !from ||
          (t.departure && t.departure.city && t.departure.city.toLowerCase().includes(from.toLowerCase()))
        const toMatch = !to ||
          (t.arrival && t.arrival.city && t.arrival.city.toLowerCase().includes(to.toLowerCase()))
        return fromMatch && toMatch
      })

      if (results.length > 0) {
        console.log(`[TRAINS] Using ${results.length} trains from mock database`)
      }
    }

    // Apply price filters if Cleartrip results used
    if (results.length > 0 && (minPrice || maxPrice)) {
      results = results.filter(t => {
        const price = t.price || t.baseFare || 0
        if (minPrice && price < parseFloat(minPrice)) return false
        if (maxPrice && price > parseFloat(maxPrice)) return false
        return true
      })
    }

    // Cache results for 5 minutes
    cacheService.set(cacheKey, results, 300)

    // Return normalized results
    return results.map(t => normalizeTrainResult(t, results[0]?.provider === 'cleartrip' ? 'cleartrip' : 'db'))
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
