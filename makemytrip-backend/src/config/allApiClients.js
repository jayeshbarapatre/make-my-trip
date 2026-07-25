import axios from 'axios'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 300 })

// ============ AMADEUS FLIGHTS ============
const amadeusClient = axios.create({
  baseURL: 'https://api.amadeus.com/v2',
  headers: {
    'Authorization': `Bearer ${process.env.AMADEUS_TOKEN || ''}`,
  }
})

export async function searchFlightsAmadeus(from, to, date, passengers) {
  const cacheKey = `flights_amadeus_${from}_${to}_${date}_${passengers}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await amadeusClient.get('/shopping/flight-offers', {
      params: {
        originLocationCode: from,
        destinationLocationCode: to,
        departureDate: date,
        adults: passengers,
        nonStop: false,
        maxPrice: 999999
      }
    })

    const normalized = (response.data.data || []).map(flight => ({
      provider: 'amadeus',
      id: `amadeus_${flight.id}`,
      airline: flight.validatingAirlineCodes?.[0] || 'Amadeus Air',
      departure: flight.itineraries[0]?.segments[0]?.departure?.at,
      arrival: flight.itineraries[0]?.segments[0]?.arrival?.at,
      duration: flight.itineraries[0]?.duration,
      price: flight.price?.total,
      currency: flight.price?.currency || 'INR',
      stops: flight.itineraries[0]?.segments?.length - 1 || 0,
      seats: 5,
      rating: 4.5
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('Amadeus API error:', error.message)
    return []
  }
}

// ============ SKYSCANNER FLIGHTS ============
const skyscannerClient = axios.create({
  baseURL: 'https://skyscanner.p.rapidapi.com/flights',
  headers: {
    'X-RapidAPI-Key': process.env.SKYSCANNER_API_KEY || '',
    'X-RapidAPI-Host': 'skyscanner.p.rapidapi.com'
  }
})

export async function searchFlightsSkyscanner(from, to, date, passengers) {
  const cacheKey = `flights_skyscanner_${from}_${to}_${date}_${passengers}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await skyscannerClient.get('/search-everywhere', {
      params: {
        originSkyId: from,
        destinationSkyId: to,
        originEntityId: from,
        destinationEntityId: to,
        date: date,
        adults: passengers,
        currency: 'INR'
      }
    })

    const normalized = (response.data.data || []).map(flight => ({
      provider: 'skyscanner',
      id: `skyscanner_${flight.id}`,
      airline: flight.legs?.[0]?.carriers?.[0]?.name || 'Skyscanner Airline',
      departure: flight.legs?.[0]?.departure,
      arrival: flight.legs?.[0]?.arrival,
      duration: flight.legs?.[0]?.durationInMinutes,
      price: flight.price?.raw || flight.price,
      currency: 'INR',
      stops: flight.legs?.[0]?.stopCount || 0,
      seats: 8,
      rating: 4.3
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('Skyscanner API error:', error.message)
    return []
  }
}

// ============ BOOKING.COM HOTELS ============
const bookingClient = axios.create({
  baseURL: 'https://api.booking.com/v1',
  headers: {
    'X-Booking-API-Key': process.env.BOOKING_API_KEY || ''
  }
})

export async function searchHotelsBooking(destination, checkinDate, checkoutDate, guests) {
  const cacheKey = `hotels_booking_${destination}_${checkinDate}_${checkoutDate}_${guests}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await bookingClient.get('/properties/search', {
      params: {
        ss: destination,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        nrOfAdults: guests,
        order_by: 'popularity'
      }
    })

    const normalized = (response.data.result || []).slice(0, 12).map(hotel => ({
      provider: 'booking',
      id: `booking_${hotel.id}`,
      name: hotel.name,
      location: hotel.address || destination,
      price: hotel.priceBreakdown?.grossPrice?.value || hotel.minTotalPrice || 0,
      currency: hotel.priceBreakdown?.grossPrice?.currency || 'INR',
      rating: hotel.reviewScore || 0,
      reviewCount: hotel.reviewScoreCount || 0,
      image: hotel.photoMainUrl,
      amenities: hotel.facilityBriefList?.map(f => f.name).slice(0, 5) || [],
      roomsLeft: Math.floor(Math.random() * 5) + 1,
      checkIn: checkinDate,
      checkOut: checkoutDate,
      nights: Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24))
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('Booking.com API error:', error.message)
    return []
  }
}

// ============ AGODA HOTELS ============
const agodaClient = axios.create({
  baseURL: 'https://www.agoda.com/api',
  headers: {
    'X-Agoda-Key': process.env.AGODA_API_KEY || ''
  }
})

export async function searchHotelsAgoda(destination, checkinDate, checkoutDate, guests) {
  const cacheKey = `hotels_agoda_${destination}_${checkinDate}_${checkoutDate}_${guests}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await agodaClient.get('/properties', {
      params: {
        destination: destination,
        checkInDate: checkinDate,
        checkOutDate: checkoutDate,
        noOfAdult: guests,
        language: 'en-us'
      }
    })

    const normalized = (response.data.properties || []).slice(0, 12).map(hotel => ({
      provider: 'agoda',
      id: `agoda_${hotel.propertyId}`,
      name: hotel.name,
      location: hotel.address || destination,
      price: hotel.avgPrice || hotel.minRoomPrice || 0,
      currency: 'INR',
      rating: hotel.starRating || 4,
      reviewCount: hotel.numberOfReviews || 0,
      image: hotel.photoUrl,
      amenities: hotel.amenities?.slice(0, 5) || [],
      roomsLeft: Math.floor(Math.random() * 5) + 1,
      checkIn: checkinDate,
      checkOut: checkoutDate,
      nights: Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24))
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('Agoda API error:', error.message)
    return []
  }
}

// ============ EXPEDIA HOTELS ============
const expediaClient = axios.create({
  baseURL: 'https://api.ean.com/v3',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${process.env.EXPEDIA_API_KEY}:${process.env.EXPEDIA_API_SECRET}`).toString('base64')}`
  }
})

export async function searchHotelsExpedia(destination, checkinDate, checkoutDate, guests) {
  const cacheKey = `hotels_expedia_${destination}_${checkinDate}_${checkoutDate}_${guests}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await expediaClient.get('/properties/search', {
      params: {
        destination: destination,
        checkin: checkinDate,
        checkout: checkoutDate,
        adults: guests,
        limit: 12
      }
    })

    const normalized = (response.data.properties || []).map(hotel => ({
      provider: 'expedia',
      id: `expedia_${hotel.id}`,
      name: hotel.name,
      location: hotel.address?.city || destination,
      price: hotel.ratesSummary?.averageRate || 0,
      currency: 'INR',
      rating: hotel.reviewScore?.score || 0,
      reviewCount: hotel.reviewScore?.reviewCount || 0,
      image: hotel.image?.url,
      amenities: hotel.amenities?.slice(0, 5) || [],
      roomsLeft: Math.floor(Math.random() * 5) + 1,
      checkIn: checkinDate,
      checkOut: checkoutDate,
      nights: Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24))
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('Expedia API error:', error.message)
    return []
  }
}

// ============ GOIBIBO BUSES ============
const goibiboClient = axios.create({
  baseURL: 'https://www.goibibo.com/api',
  headers: {
    'X-GOIBIBO-API-KEY': process.env.GOIBIBO_API_KEY || '',
    'Content-Type': 'application/json'
  }
})

export async function searchBusesGoibibo(from, to, date) {
  const cacheKey = `buses_goibibo_${from}_${to}_${date}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await goibiboClient.post('/bus/search', {
      fromCityId: from,
      toCityId: to,
      date: date,
      paxCount: 1
    })

    const normalized = (response.data.buses || []).slice(0, 15).map(bus => ({
      provider: 'goibibo',
      id: `goibibo_${bus.id}`,
      operator: bus.operatorName || 'GoIbibo Bus',
      departure: bus.departureTime,
      arrival: bus.arrivalTime,
      duration: bus.duration,
      price: bus.fare || 0,
      currency: 'INR',
      seats: bus.availableSeats || 10,
      rating: bus.rating || 4.2,
      amenities: bus.amenities || ['AC', 'WiFi', 'Blanket']
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('GoIbibo API error:', error.message)
    return []
  }
}

// ============ 12GO BUSES ============
const twelvGoClient = axios.create({
  baseURL: 'https://www.12go.asia/api',
  headers: {
    'X-API-Key': process.env.TWELVEGO_API_KEY || ''
  }
})

export async function searchBusesTwelveGo(from, to, date) {
  const cacheKey = `buses_12go_${from}_${to}_${date}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await twelvGoClient.get('/coach/search', {
      params: {
        from: from,
        to: to,
        date: date
      }
    })

    const normalized = (response.data.coaches || []).slice(0, 15).map(bus => ({
      provider: '12go',
      id: `12go_${bus.id}`,
      operator: bus.operatorName || '12Go Coach',
      departure: bus.departureTime,
      arrival: bus.arrivalTime,
      duration: bus.duration,
      price: bus.price || 0,
      currency: 'INR',
      seats: bus.availableSeats || 10,
      rating: bus.rating || 4.0,
      amenities: bus.amenities || ['AC', 'Sleeper']
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('12Go API error:', error.message)
    return []
  }
}

// ============ UBER RIDES ============
const uberClient = axios.create({
  baseURL: 'https://api.uber.com/v1.2',
  headers: {
    'Authorization': `Bearer ${process.env.UBER_ACCESS_TOKEN || ''}`,
    'Accept-Language': 'en_US'
  }
})

export async function searchUberRides(fromLat, fromLng, toLat, toLng) {
  const cacheKey = `uber_${fromLat}_${fromLng}_${toLat}_${toLng}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await uberClient.get('/estimates/price', {
      params: {
        start_latitude: fromLat,
        start_longitude: fromLng,
        end_latitude: toLat,
        end_longitude: toLng
      }
    })

    const normalized = (response.data.prices || []).map(ride => ({
      provider: 'uber',
      id: `uber_${ride.product_id}`,
      rideType: ride.display_name || 'Uber',
      description: ride.description || '',
      price: ride.estimate?.replace('₹', '').replace(',', '') || 0,
      currency: 'INR',
      duration: ride.duration,
      distance: ride.distance,
      rating: 4.8
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('Uber API error:', error.message)
    return []
  }
}

// ============ OLA RIDES ============
const olaClient = axios.create({
  baseURL: 'https://api.olaelectric.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OLA_API_KEY || ''}`,
    'X-Client-Id': process.env.OLA_CLIENT_ID || ''
  }
})

export async function searchOlaRides(fromLat, fromLng, toLat, toLng) {
  const cacheKey = `ola_${fromLat}_${fromLng}_${toLat}_${toLng}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await olaClient.post('/rides/estimates', {
      pickup_latitude: fromLat,
      pickup_longitude: fromLng,
      dropoff_latitude: toLat,
      dropoff_longitude: toLng
    })

    const normalized = (response.data.estimates || []).map(ride => ({
      provider: 'ola',
      id: `ola_${ride.rideType}`,
      rideType: ride.rideType || 'Ola',
      description: `Ola ${ride.rideType}`,
      price: ride.estimatedFare || 0,
      currency: 'INR',
      duration: ride.estimatedTime,
      distance: ride.estimatedDistance,
      rating: 4.7
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('Ola API error:', error.message)
    return []
  }
}

// ============ RAPIDAPI INDIAN RAILWAYS TRAINS ============
const trainApiClient = axios.create({
  baseURL: `https://${process.env.RAPIDAPI_HOST_TRAINS || 'indian-railways-api.p.rapidapi.com'}`,
  timeout: 10000
})

export async function searchTrainsAPI(from, to, date) {
  if (process.env.TRAIN_API_ENABLED !== 'true') {
    console.log('[TRAIN API] Disabled - using mock data')
    return []
  }

  const cacheKey = `trains_api_${from}_${to}_${date}`
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log('[TRAIN API] Using cached results')
    return cached
  }

  try {
    console.log(`[TRAIN API] Searching trains: ${from} → ${to} on ${date}`)

    const response = await trainApiClient.get('/search', {
      params: {
        source: from,
        destination: to,
        date: date
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST_TRAINS
      }
    })

    const trains = response.data?.data || response.data?.trains || response.data || []

    if (!Array.isArray(trains)) {
      console.log('[TRAIN API] Response is not an array:', typeof trains)
      return []
    }

    const normalized = trains.map((train, idx) => ({
      provider: 'indian-railways-api',
      id: `ira_${train.trainNumber || idx}`,
      trainNumber: train.trainNumber || train.number || `TR${idx}`,
      trainName: train.trainName || train.name || 'Express',
      operatorName: 'Indian Railways',
      from: train.source || train.from || from,
      to: train.destination || train.to || to,
      departure: train.departureTime || train.departure,
      arrival: train.arrivalTime || train.arrival,
      duration: train.duration || train.totalTime || '0h',
      durationMinutes: train.durationInMinutes || parseDurationToMinutes(train.duration || '0h'),
      type: train.trainType || train.type || 'Express',
      price: parseInt(train.price || train.fare || '500') || 500,
      currency: 'INR',
      seats: train.availableSeats || train.seatsAvailable || 50,
      seatsAvailable: train.availableSeats || train.seatsAvailable || 50,
      class: train.class || 'General',
      classType: train.classType || 'General',
      amenities: Array.isArray(train.amenities) ? train.amenities : ['AC', 'Charging Point'],
      rating: train.rating || 4.3,
      reviews: train.reviews || 1500,
      isActive: true
    }))

    console.log(`[TRAIN API] ✅ Found ${normalized.length} trains from API`)
    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('[TRAIN API] ❌ Error:', error.message)
    return []
  }
}

// Helper function to calculate duration (HH:MM format)
function calculateDuration(departure, arrival) {
  if (!departure || !arrival) return '0h 0m'
  try {
    const [dHour, dMin] = departure.split(':').map(Number)
    const [aHour, aMin] = arrival.split(':').map(Number)
    let hours = aHour - dHour
    let mins = aMin - dMin
    if (mins < 0) {
      hours--
      mins += 60
    }
    if (hours < 0) hours += 24
    return `${hours}h ${mins}m`
  } catch {
    return '0h 0m'
  }
}

// Helper function to parse duration string to minutes
function parseDurationToMinutes(duration) {
  if (!duration) return 0
  try {
    const match = duration.match(/(\d+)h\s*(\d+)?m?/)
    if (match) {
      const hours = parseInt(match[1]) || 0
      const mins = parseInt(match[2]) || 0
      return hours * 60 + mins
    }
  } catch (e) {
    console.log('Duration parse error:', e.message)
  }
  return 0
}
