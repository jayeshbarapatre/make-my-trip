import axios from 'axios'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 300 })

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''
const RAPIDAPI_HOST_FLIGHTS = process.env.RAPIDAPI_HOST_FLIGHTS || 'sky-scrapper.p.rapidapi.com'
const RAPIDAPI_HOST_HOTELS = process.env.RAPIDAPI_HOST_HOTELS || 'booking-com15.p.rapidapi.com'
const RAPIDAPI_HOST_BUSES = process.env.RAPIDAPI_HOST_BUSES || 'blablacar.p.rapidapi.com'
const RAPIDAPI_HOST_CABS = process.env.RAPIDAPI_HOST_CABS || 'uber.p.rapidapi.com'

// ============ SKYSCRAPPER FLIGHTS (RapidAPI) ============
export async function searchFlightsRapidAPI(origin, destination, departDate, passengers = 1) {
  const cacheKey = `flights_rapidapi_${origin}_${destination}_${departDate}_${passengers}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await axios.get('https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlightsComplete', {
      params: {
        originSkyId: origin,
        destinationSkyId: destination,
        originEntityId: origin,
        destinationEntityId: destination,
        cabinClass: 'economy',
        adults: passengers,
        sortBy: 'best',
        currency: 'INR',
        market: 'en-IN',
        countryCode: 'IN'
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com'
      }
    })

    const normalized = (response.data.data?.flights || []).slice(0, 12).map((flight, idx) => ({
      provider: 'rapidapi-flights',
      id: `rapidapi_flight_${idx}`,
      airline: flight.legs?.[0]?.carriers?.[0]?.name || 'Flight',
      departure: flight.legs?.[0]?.departure || '—',
      arrival: flight.legs?.[0]?.arrival || '—',
      duration: flight.legs?.[0]?.durationInMinutes ? `${Math.floor(flight.legs[0].durationInMinutes / 60)}h ${flight.legs[0].durationInMinutes % 60}m` : '—',
      price: flight.price?.raw || flight.price?.formatted || 0,
      currency: 'INR',
      stops: flight.legs?.[0]?.stopCount || 0,
      seats: 5,
      rating: 4.5
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('RapidAPI Flights error:', error.message)
    return []
  }
}

// ============ BOOKING.COM HOTELS (RapidAPI) ============
export async function searchHotelsRapidAPI(destination, checkinDate, checkoutDate, guests = 1) {
  const cacheKey = `hotels_rapidapi_${destination}_${checkinDate}_${checkoutDate}_${guests}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await axios.get('https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels', {
      params: {
        query: destination,
        checkInDate: checkinDate,
        checkOutDate: checkoutDate,
        adults: guests,
        currency_code: 'INR',
        languagecode: 'en-us'
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'booking-com15.p.rapidapi.com'
      }
    })

    const nights = Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24))

    const normalized = (response.data.result || []).slice(0, 12).map((hotel, idx) => ({
      provider: 'rapidapi-hotels',
      id: `rapidapi_hotel_${idx}`,
      name: hotel.name || hotel.property_name || `Hotel ${idx + 1}`,
      location: destination,
      price: (hotel.price_breakdown?.gross_price?.value || hotel.minTotalPrice || 3000) * nights,
      pricePerNight: hotel.price_breakdown?.gross_price?.value || hotel.minTotalPrice || 3000,
      currency: 'INR',
      rating: hotel.review_score || hotel.stars || 4,
      reviewCount: hotel.review_score_count || 0,
      image: hotel.photoMainUrl || `https://images.unsplash.com/photo-${1445631867595 + idx}?auto=format&fit=crop&w=500&h=350&q=80`,
      amenities: hotel.facility_brief_list?.map(f => f.name).slice(0, 5) || ['WiFi', 'AC', 'Restaurant'],
      roomsLeft: Math.floor(Math.random() * 5) + 1,
      checkIn: checkinDate,
      checkOut: checkoutDate,
      nights: nights,
      badges: hotel.stars >= 5 ? ['Luxury', 'Verified'] : ['Popular']
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('RapidAPI Hotels error:', error.message)
    return []
  }
}

// ============ BLABLACAR BUSES (RapidAPI) ============
export async function searchBusesRapidAPI(fromCity, toCity, date) {
  const cacheKey = `buses_rapidapi_${fromCity}_${toCity}_${date}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await axios.get('https://blablacar.p.rapidapi.com/api/v3/trips/search', {
      params: {
        fromCityId: fromCity,
        toCityId: toCity,
        departureDate: date,
        currency: 'INR'
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'blablacar.p.rapidapi.com'
      }
    })

    const normalized = (response.data.trips || []).slice(0, 15).map((bus, idx) => ({
      provider: 'rapidapi-buses',
      id: `rapidapi_bus_${idx}`,
      operator: bus.operator?.name || `Bus ${idx + 1}`,
      departure: bus.departure_time || '—',
      arrival: bus.arrival_time || '—',
      duration: bus.duration_hours ? `${bus.duration_hours}h` : '—',
      price: bus.price?.value || 800 + Math.random() * 2000,
      currency: 'INR',
      seats: bus.available_seats || 10,
      rating: bus.rating || 4.2,
      amenities: ['AC', 'WiFi', 'USB Charging', 'Blanket'].slice(0, 3),
      busType: bus.vehicle_type || 'Seater'
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('RapidAPI Buses error:', error.message)
    return []
  }
}

// ============ UBER RIDES (RapidAPI) ============
export async function searchUberRidesRapidAPI(fromLat, fromLng, toLat, toLng) {
  const cacheKey = `uber_rapidapi_${fromLat}_${fromLng}_${toLat}_${toLng}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await axios.get('https://uber-api-v2.p.rapidapi.com/estimates/price', {
      params: {
        start_latitude: fromLat,
        start_longitude: fromLng,
        end_latitude: toLat,
        end_longitude: toLng,
        currency_code: 'INR'
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'uber-api-v2.p.rapidapi.com'
      }
    })

    const normalized = (response.data.prices || []).map((ride, idx) => ({
      provider: 'rapidapi-uber',
      id: `rapidapi_uber_${idx}`,
      rideType: ride.display_name || 'Uber',
      description: ride.description || '',
      price: ride.estimate?.replace(/[₹,]/g, '') || 150 + Math.random() * 500,
      currency: 'INR',
      duration: ride.duration || '10 mins',
      distance: ride.distance || '5 km',
      rating: 4.8
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('RapidAPI Uber error:', error.message)
    return []
  }
}

// ============ OLA RIDES (RapidAPI) ============
export async function searchOlaRidesRapidAPI(fromLat, fromLng, toLat, toLng) {
  const cacheKey = `ola_rapidapi_${fromLat}_${fromLng}_${toLat}_${toLng}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await axios.get('https://ola-rides.p.rapidapi.com/rides/estimate', {
      params: {
        pickup_latitude: fromLat,
        pickup_longitude: fromLng,
        dropoff_latitude: toLat,
        dropoff_longitude: toLng,
        currency: 'INR'
      },
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'ola-rides.p.rapidapi.com'
      }
    })

    const normalized = (response.data.rides || []).map((ride, idx) => ({
      provider: 'rapidapi-ola',
      id: `rapidapi_ola_${idx}`,
      rideType: ride.ride_type || 'Ola',
      description: `Ola ${ride.ride_type}`,
      price: ride.estimated_fare || 120 + Math.random() * 400,
      currency: 'INR',
      duration: ride.estimated_time || '12 mins',
      distance: ride.estimated_distance || '4.5 km',
      rating: 4.7
    }))

    cache.set(cacheKey, normalized)
    return normalized
  } catch (error) {
    console.error('RapidAPI Ola error:', error.message)
    return []
  }
}
