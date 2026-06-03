import prisma from '../../config/prismaClient.js'
import cacheService from '../cache/cacheService.js'
import axios from 'axios'

// IATA mapping for common cities
const IATA_MAP = {
  'delhi': 'DEL',
  'new delhi': 'DEL',
  'mumbai': 'BOM',
  'bengaluru': 'BLR',
  'bangalore': 'BLR',
  'chennai': 'MAA',
  'hyderabad': 'HYD',
  'kolkata': 'CCU',
  'goa': 'GOI',
  'pune': 'PNQ',
  'ahmedabad': 'AMD',
  'jaipur': 'JAI',
  'dubai': 'DXB',
  'singapore': 'SIN'
}

const getIataCode = (city) => {
  if (!city) return ''
  const clean = city.toLowerCase().trim()
  return IATA_MAP[clean] || clean.slice(0, 3).toUpperCase()
}

// Normalize flight from DB to standardized format
const normalizeFlightResult = (flight, source = 'db') => ({
  id: flight.id,
  airline: flight.airline,
  flightNumber: flight.flightNumber,
  departure: flight.departure || { city: flight.from, time: flight.departureTime },
  arrival: flight.arrival || { city: flight.to, time: flight.arrivalTime },
  duration: flight.duration,
  price: flight.price,
  seatsAvailable: flight.seatsAvailable,
  seats: flight.seats,
  stops: flight.stops || 0,
  baggage: flight.baggage || 15,
  aircraft: flight.aircraft,
  image: flight.image,
  isActive: flight.isActive,
  isLive: flight.isLive || false,
  source // 'cache' | 'db' | 'api'
})

export const flightSearchService = {
  // Search flights with cache → API → DB strategy
  search: async (params) => {
    const { from, to, date, passengers, minPrice, maxPrice } = params

    // Build cache key
    const cacheKey = `flight:${from}:${to}:${date}`

    // 1. Check cache
    const cachedResults = cacheService.get(cacheKey)
    if (cachedResults) {
      return cachedResults.map(f => normalizeFlightResult(f, 'cache'))
    }

    // 2. Try Live API (Aviationstack)
    const depIata = getIataCode(from)
    const arrIata = getIataCode(to)
    const accessKey = process.env.AVIATIONSTACK_API_KEY || 'd68117a72d03f3defbed916d51a5cdef'

    if (depIata && arrIata) {
      try {
        console.log(`🌐 Fetching live flights from Aviationstack (${depIata} -> ${arrIata})...`)
        const response = await axios.get('http://api.aviationstack.com/v1/flights', {
          params: {
            access_key: accessKey,
            dep_iata: depIata,
            arr_iata: arrIata,
            limit: 15
          },
          timeout: 6000
        })

        if (response.data && response.data.data && response.data.data.length > 0) {
          const apiFlights = response.data.data.map((f, idx) => {
            const depDate = new Date(f.departure.scheduled)
            const arrDate = new Date(f.arrival.scheduled)
            let durationStr = '2h 15m'
            if (!isNaN(depDate) && !isNaN(arrDate)) {
              const diffMs = arrDate - depDate
              const diffMins = Math.max(30, Math.floor(diffMs / 60000))
              durationStr = `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
            }

            const price = 3000 + (idx * 500) + Math.round(Math.random() * 400)

            return {
              id: `aviationstack-${f.flight.iata || f.flight.number || idx}-${idx}`,
              airline: f.airline.name || 'Unknown Airline',
              flightNumber: f.flight.iata || f.flight.icao || `${f.airline.iata || 'FL'}-${f.flight.number}`,
              departure: {
                city: from,
                time: f.departure.scheduled ? new Date(f.departure.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '12:00'
              },
              arrival: {
                city: to,
                time: f.arrival.scheduled ? new Date(f.arrival.scheduled).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '14:30'
              },
              duration: durationStr,
              price: price,
              seatsAvailable: Math.floor(Math.random() * 20) + 5,
              seats: 180,
              stops: f.flight.codeshared ? 1 : 0,
              baggage: 15,
              aircraft: f.aircraft?.iata || 'Boeing 737',
              image: null,
              isActive: true,
              isLive: true,
              source: 'api'
            }
          })

          // Cache results
          cacheService.set(cacheKey, apiFlights, 300)
          return apiFlights
        }
      } catch (e) {
        console.error('Aviationstack API fetch failed, falling back to DB:', e.message)
      }
    }

    // 3. Fallback: Query database
    const flights = await prisma.flight.findMany({
      where: {
        isActive: true,
        ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
        ...(maxPrice && { price: { lte: parseFloat(maxPrice) } })
      },
      orderBy: { price: 'asc' }
    })

    // Filter by departure/arrival cities and seat availability
    let available = flights.filter(f => {
      const depCity = f.departure?.city || f.from || ''
      const arrCity = f.arrival?.city || f.to || ''
      const matchesFrom = !from || depCity.toLowerCase().includes(from.toLowerCase())
      const matchesTo = !to || arrCity.toLowerCase().includes(to.toLowerCase())
      const hasSeat = !passengers || f.seatsAvailable >= parseInt(passengers)
      return matchesFrom && matchesTo && hasSeat
    })

    // Cache results for 5 minutes
    cacheService.set(cacheKey, available, 300)

    // Return normalized results
    return available.map(f => normalizeFlightResult(f, 'db'))
  },

  // Get flight details by ID
  getFlightById: async (id) => {
    // If it's an Aviationstack ID, we can parse it from mock/cache or retrieve it
    if (id.startsWith('aviationstack-')) {
      return {
        id,
        airline: 'Live Flight',
        flightNumber: id.split('-')[1] || 'LF-101',
        departure: { city: 'Delhi', time: '12:00' },
        arrival: { city: 'Mumbai', time: '14:30' },
        duration: '2h 30m',
        price: 4500,
        seatsAvailable: 10,
        seats: 180,
        stops: 0,
        baggage: 15,
        aircraft: 'Boeing 737',
        isActive: true,
        isLive: true,
        source: 'api'
      }
    }
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
