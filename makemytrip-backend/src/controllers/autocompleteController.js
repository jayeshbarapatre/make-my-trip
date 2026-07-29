import { db } from '../config/firebase.js'
import { cacheService } from '../services/cache/cacheService.js'

// Autocomplete fires on every keystroke. Reading the whole flights collection
// each time would dominate the Firestore read budget, so the derived facet
// lists are built once and cached; the per-request work is a filter over a
// small in-memory array.
const FACET_TTL_SECONDS = 300
const CACHE_KEY = 'autocomplete:facets'

const sanitizeQuery = (q) => (q ? String(q).trim().toLowerCase() : '')

const buildFacets = async () => {
  const snapshot = await db.collection('flights').get()

  const cities = new Set()
  const airports = new Set()
  const airlines = new Set()
  const aircrafts = new Set()
  const flightNumbers = new Set()

  snapshot.forEach((doc) => {
    const f = doc.data()
    if (f.isActive === false) return

    if (f.source) cities.add(f.source)
    if (f.destination) cities.add(f.destination)
    if (f.sourceAirport) airports.add(f.sourceAirport)
    if (f.destinationAirport) airports.add(f.destinationAirport)
    if (f.airline) airlines.add(f.airline)
    if (f.aircraft) aircrafts.add(f.aircraft)
    if (f.flightNumber) flightNumbers.add(f.flightNumber)
  })

  const sorted = (set) => Array.from(set).sort()

  return {
    cities: sorted(cities),
    airports: sorted(airports),
    airlines: sorted(airlines),
    aircrafts: sorted(aircrafts),
    flightNumbers: sorted(flightNumbers)
  }
}

const getFacets = async () => {
  const cached = cacheService.get(CACHE_KEY)
  if (cached) return cached

  const facets = await buildFacets()
  cacheService.set(CACHE_KEY, facets, FACET_TTL_SECONDS)
  return facets
}

const respondWithFacet = (facet) => async (req, res) => {
  try {
    const searchQuery = sanitizeQuery(req.query.q)
    const facets = await getFacets()
    const values = facets[facet] || []

    const filtered = searchQuery
      ? values.filter((v) => v.toLowerCase().includes(searchQuery))
      : values

    res.json({ data: filtered.slice(0, 50) })
  } catch (err) {
    console.error(`Autocomplete (${facet}) failed:`, err.message)
    res.status(500).json({ message: 'Failed to load suggestions' })
  }
}

export const getAirlines = respondWithFacet('airlines')
export const getAirports = respondWithFacet('airports')
export const getCities = respondWithFacet('cities')
export const getAircrafts = respondWithFacet('aircrafts')
export const getFlightNumbers = respondWithFacet('flightNumbers')
