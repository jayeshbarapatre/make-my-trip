import express from 'express'
import unifiedSearchService from '../services/unifiedSearchService.js'
import { searchLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// These routes proxy to metered third-party APIs on the platform's own key, so
// an unthrottled caller spends real money. Public and unauthenticated, which
// makes this the most abusable surface in the service.
router.use(searchLimiter)

// Search Flights
router.get('/flights', async (req, res) => {
  try {
    const { from, to, date, passengers = 1 } = req.query

    if (!from || !to || !date) {
      return res.status(400).json({
        error: 'Missing required parameters: from, to, date',
        received: { from, to, date }
      })
    }

    const flights = await unifiedSearchService.searchFlights(from, to, date, passengers)

    res.json({
      success: true,
      data: flights,
      count: flights.length,
      filters: {
        from,
        to,
        date,
        passengers
      }
    })
  } catch (error) {
    console.error('Flight search error:', error)
    res.status(500).json({
      error: 'Flight search failed',
      message: error.message
    })
  }
})

// Search Hotels
router.get('/hotels', async (req, res) => {
  try {
    const { destination, checkinDate, checkoutDate, guests = 1 } = req.query

    if (!destination || !checkinDate || !checkoutDate) {
      return res.status(400).json({
        error: 'Missing required parameters: destination, checkinDate, checkoutDate',
        received: { destination, checkinDate, checkoutDate }
      })
    }

    const hotels = await unifiedSearchService.searchHotels(destination, checkinDate, checkoutDate, guests)

    res.json({
      success: true,
      data: hotels,
      count: hotels.length,
      filters: {
        destination,
        checkinDate,
        checkoutDate,
        guests
      }
    })
  } catch (error) {
    console.error('Hotel search error:', error)
    res.status(500).json({
      error: 'Hotel search failed',
      message: error.message
    })
  }
})

// Search Buses
router.get('/buses', async (req, res) => {
  try {
    const { from, to, date } = req.query

    if (!from || !to || !date) {
      return res.status(400).json({
        error: 'Missing required parameters: from, to, date',
        received: { from, to, date }
      })
    }

    const buses = await unifiedSearchService.searchBuses(from, to, date)

    res.json({
      success: true,
      data: buses,
      count: buses.length,
      filters: { from, to, date }
    })
  } catch (error) {
    console.error('Bus search error:', error)
    res.status(500).json({
      error: 'Bus search failed',
      message: error.message
    })
  }
})

// Search Cabs
router.get('/cabs', async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({
        error: 'Missing required parameters: fromLat, fromLng, toLat, toLng',
        received: { fromLat, fromLng, toLat, toLng }
      })
    }

    const cabs = await unifiedSearchService.searchCabs(fromLat, fromLng, toLat, toLng)

    res.json({
      success: true,
      data: cabs,
      count: cabs.length,
      filters: { fromLat, fromLng, toLat, toLng }
    })
  } catch (error) {
    console.error('Cab search error:', error)
    res.status(500).json({
      error: 'Cab search failed',
      message: error.message
    })
  }
})

// Get all providers' status
router.get('/providers', (req, res) => {
  res.json({
    flights: {
      primary: ['Amadeus', 'Skyscanner'],
      fallback: 'Mock Data'
    },
    hotels: {
      primary: ['Booking.com', 'Agoda', 'Expedia'],
      fallback: 'Mock Data'
    },
    buses: {
      primary: ['GoIbibo', '12Go'],
      fallback: 'Mock Data'
    },
    cabs: {
      primary: ['Uber', 'Ola'],
      fallback: 'Mock Data'
    },
    cacheExpiry: '5 minutes'
  })
})

export default router
