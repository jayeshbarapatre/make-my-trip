import prisma from '../../config/prismaClient.js'
import cacheService from '../cache/cacheService.js'
import { searchTrainsAPI } from '../../config/allApiClients.js'

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
  // Search trains with Real API → Cache → Mock Data strategy
  search: async (params) => {
    const { from, to, date, type, minPrice, maxPrice, search: searchTerm, db = prisma } = params

    // Build cache key (date-based for daily updates)
    const cacheKey = `train:${from}:${to}:${date}`

    // 1. Check cache first
    const cachedResults = cacheService.get(cacheKey)
    if (cachedResults) {
      console.log('[TRAINS] Using cached results')
      return cachedResults.map(t => normalizeTrainResult(t, 'cache'))
    }

    let results = []

    // 2. Try Real Train API if enabled
    if (from && to && date) {
      try {
        console.log(`[TRAINS] Attempting Train API search: ${from} → ${to} on ${date}`)
        const apiResults = await searchTrainsAPI(from, to, date)
        if (apiResults && apiResults.length > 0) {
          results = apiResults
          console.log(`[TRAINS] ✅ Found ${results.length} trains from REAL API`)
        } else {
          console.log('[TRAINS] API returned 0 results, trying mock data...')
        }
      } catch (error) {
        console.log(`[TRAINS] ⚠️ API failed: ${error.message} - falling back to mock data`)
      }
    }

    // 3. Fallback to database/mock data if API failed or unavailable
    if (results.length === 0) {
      console.log('[TRAINS] No API results, using mock data fallback...')
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

      console.log(`[TRAINS] Found ${trains.length} trains in database`)

      // Filter by route - FLEXIBLE MATCHING for city names
      results = trains.filter(t => {
        if (!from && !to) return true

        const departureCities = [
          t.departure?.city || '',
          t.from || '',
          t.departureCity || ''
        ].filter(c => c)

        const arrivalCities = [
          t.arrival?.city || '',
          t.to || '',
          t.arrivalCity || ''
        ].filter(c => c)

        const fromMatch = !from || departureCities.some(city =>
          city.toLowerCase().includes(from.toLowerCase()) || from.toLowerCase().includes(city.toLowerCase())
        )

        const toMatch = !to || arrivalCities.some(city =>
          city.toLowerCase().includes(to.toLowerCase()) || to.toLowerCase().includes(city.toLowerCase())
        )

        return fromMatch && toMatch
      })

      console.log(`[TRAINS] After route filter: ${results.length} trains`)

      if (results.length === 0) {
        console.log('[TRAINS] ⚠️ No matching trains found - FORCING MOCK DATA RETURN')
        // If still no results, return ALL trains as fallback (better UX than empty)
        results = trains.slice(0, 20)
      }
    }

    // Apply price filters
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

    // Determine source and log
    const source = results[0]?.provider ? 'api' : 'db'
    console.log(`[TRAINS] Returning ${results.length} results from ${source}`)

    // Return normalized results
    return results.map(t => normalizeTrainResult(t, source))
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
