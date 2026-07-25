import prisma from '../../config/prismaClient.js'
import cacheService from '../cache/cacheService.js'
import { searchTrainsAPI } from '../../config/allApiClients.js'
import { comprehensiveTrainDatabase } from '../../data/trainDatabase.js'
import { trainStations } from '../../data/trainStations.js'

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
  distance: train.distance,
  price: train.price,
  seatsAvailable: train.seatsAvailable || train.seats,
  seats: train.seats || train.seatsAvailable,
  amenities: train.amenities || [],
  image: train.image,
  isActive: train.isActive !== false,
  source // 'cache' | 'db' | 'api' | 'comprehensive'
})

// Helper function to match station codes/names
const matchStation = (input, station) => {
  if (!input || !station) return false
  const input_lower = input.toLowerCase()
  return (
    station.code.toLowerCase() === input_lower ||
    station.name.toLowerCase().includes(input_lower) ||
    station.city.toLowerCase().includes(input_lower) ||
    input_lower.includes(station.code.toLowerCase())
  )
}

// Helper to find station code by name or code
const findStationCode = (nameOrCode) => {
  if (!nameOrCode) return null
  const station = trainStations.find(s => matchStation(nameOrCode, s))
  return station ? station.code : nameOrCode // Return code or original if not found
}

export const trainSearchService = {
  // Search trains with API → Comprehensive Database strategy
  search: async (params) => {
    const { from, to, date, type, minPrice, maxPrice, search: searchTerm, db = prisma } = params

    console.log(`[TRAINS] Search: ${from} → ${to} on ${date}, type: ${type}`)

    // Build cache key
    const cacheKey = `train:${from}:${to}:${date}:${type || 'all'}`

    // 1. Check cache first
    const cachedResults = cacheService.get(cacheKey)
    if (cachedResults && cachedResults.length > 0) {
      console.log(`[TRAINS] ✅ Using ${cachedResults.length} cached results`)
      return cachedResults.map(t => normalizeTrainResult(t, 'cache'))
    }

    let results = []

    // 2. Try Real Train API if enabled
    if (from && to && date && process.env.TRAIN_API_ENABLED === 'true') {
      try {
        console.log(`[TRAINS] Attempting RapidAPI IRCTC search...`)
        const apiResults = await searchTrainsAPI(from, to, date)
        if (apiResults && apiResults.length > 0) {
          results = apiResults
          console.log(`[TRAINS] ✅ Found ${results.length} trains from IRCTC API`)
        }
      } catch (error) {
        console.log(`[TRAINS] API unavailable, using comprehensive database`)
      }
    }

    // 3. Fallback to comprehensive local database (GUARANTEED DATA)
    if (results.length === 0) {
      console.log('[TRAINS] Using comprehensive train database...')

      // Normalize station codes
      const fromCode = findStationCode(from)
      const toCode = findStationCode(to)

      console.log(`[TRAINS] Searching for: ${fromCode} → ${toCode}`)

      // Filter trains from comprehensive database
      let allTrains = comprehensiveTrainDatabase
        .filter(t => t.isActive)
        .filter(train => {
          // Route matching
          const fromMatch = train.from === fromCode || !fromCode
          const toMatch = train.to === toCode || !toCode

          // Train type filter
          const typeMatch = !type || train.type?.toLowerCase().includes(type.toLowerCase())

          return fromMatch && toMatch && typeMatch
        })

      console.log(`[TRAINS] Found ${allTrains.length} trains after filtering`)

      // Apply price filter
      if (minPrice || maxPrice) {
        allTrains = allTrains.filter(t => {
          const price = t.price || 0
          if (minPrice && price < parseFloat(minPrice)) return false
          if (maxPrice && price > parseFloat(maxPrice)) return false
          return true
        })
      }

      // Sort by price (default)
      allTrains.sort((a, b) => (a.price || 0) - (b.price || 0))

      results = allTrains.slice(0, 50) // Return top 50 results

      console.log(`[TRAINS] ✅ Returning ${results.length} trains from comprehensive database`)
    }

    // Cache results
    if (results.length > 0) {
      cacheService.set(cacheKey, results, 300)
    }

    // Return normalized results
    return results.map(t => normalizeTrainResult(t, results[0]?.provider ? 'api' : 'comprehensive'))
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
