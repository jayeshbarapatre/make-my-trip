import * as rapidApiClients from '../config/rapidApiClients.js'

// Local hotel photographs used for unified-search result thumbnails.
const SEARCH_HOTEL_IMAGES = [
  '/images/hotels/hotel-luxury-exterior-800.webp',
  '/images/hotels/hotel-room-800.webp',
  '/images/hotels/hotel-pool-800.webp',
  '/images/hotels/hotel-lobby-800.webp',
  '/images/hotels/hotel-restaurant-800.webp',
  '/images/hotels/hotel-suite-800.webp',
  '/images/hotels/hotel-room-2-800.webp',
  '/images/hotels/hotel-reception-800.webp',
  '/images/hotels/hotel-rooftop-800.webp',
  '/images/hotels/hotel-pool-2-800.webp',
  '/images/hotels/hotel-room-3-800.webp',
  '/images/hotels/hotel-resort-800.webp',
  '/images/hotels/hotel-restaurant-2-800.webp',
  '/images/hotels/hotel-bathroom-800.webp',
]


class UnifiedSearchService {
  async searchFlights(from, to, date, passengers) {
    try {
      const flights = await rapidApiClients.searchFlightsRapidAPI(from, to, date, passengers)

      if (flights.length === 0) {
        return this.generateMockFlights(from, to, date, passengers)
      }

      return flights.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    } catch (error) {
      console.error('Flight search error:', error)
      return this.generateMockFlights(from, to, date, passengers)
    }
  }

  async searchHotels(destination, checkinDate, checkoutDate, guests) {
    try {
      const hotels = await rapidApiClients.searchHotelsRapidAPI(destination, checkinDate, checkoutDate, guests)

      if (hotels.length === 0) {
        return this.generateMockHotels(destination, checkinDate, checkoutDate, guests)
      }

      return hotels.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    } catch (error) {
      console.error('Hotel search error:', error)
      return this.generateMockHotels(destination, checkinDate, checkoutDate, guests)
    }
  }

  async searchBuses(from, to, date) {
    try {
      const buses = await rapidApiClients.searchBusesRapidAPI(from, to, date)

      if (buses.length === 0) {
        return this.generateMockBuses(from, to, date)
      }

      return buses.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    } catch (error) {
      console.error('Bus search error:', error)
      return this.generateMockBuses(from, to, date)
    }
  }

  async searchCabs(fromLat, fromLng, toLat, toLng) {
    try {
      const [uber, ola] = await Promise.allSettled([
        rapidApiClients.searchUberRidesRapidAPI(fromLat, fromLng, toLat, toLng),
        rapidApiClients.searchOlaRidesRapidAPI(fromLat, fromLng, toLat, toLng)
      ])

      const results = []

      if (uber.status === 'fulfilled' && uber.value?.length > 0) {
        results.push(...uber.value)
      }

      if (ola.status === 'fulfilled' && ola.value?.length > 0) {
        results.push(...ola.value)
      }

      if (results.length === 0) {
        return this.generateMockCabs()
      }

      return results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    } catch (error) {
      console.error('Cab search error:', error)
      return this.generateMockCabs()
    }
  }

  // ============ MOCK DATA FALLBACKS ============

  generateMockFlights(from, to, date, passengers) {
    const airlines = [
      { name: 'Indigo', code: '6E', logo: '✈️' },
      { name: 'Air India', code: 'AI', logo: '✈️' },
      { name: 'SpiceJet', code: 'SG', logo: '✈️' },
      { name: 'GoAir', code: 'G8', logo: '✈️' }
    ]

    return Array.from({ length: 8 }, (_, i) => {
      const airline = airlines[i % airlines.length]
      const basePrice = 2500 + Math.random() * 8000
      const depTime = `${6 + i}:${Math.random() > 0.5 ? '30' : '00'}`
      const duration = 2 + Math.random() * 4

      return {
        provider: 'mock',
        id: `mock_flight_${i}`,
        airline: airline.name,
        airlineCode: airline.code,
        departure: depTime,
        arrival: `${(6 + i + Math.ceil(duration)) % 24}:${Math.random() > 0.5 ? '30' : '00'}`,
        duration: `${Math.floor(duration)}h ${Math.floor((duration % 1) * 60)}m`,
        price: Math.round(basePrice),
        currency: 'INR',
        stops: Math.random() > 0.5 ? 0 : 1,
        seats: Math.floor(Math.random() * 20) + 5,
        rating: 4 + Math.random() * 1,
        route: `${from} → ${to}`
      }
    })
  }

  generateMockHotels(destination, checkinDate, checkoutDate, guests) {
    const hotelNames = [
      { name: 'Royal Palace Hotel', star: 5, desc: 'Luxury 5-star' },
      { name: 'Grand Heritage Inn', star: 4, desc: '4-star Heritage' },
      { name: 'Comfort Plaza', star: 3, desc: '3-star Budget' },
      { name: 'Sunset Villas', star: 5, desc: 'Luxury Villas' },
      { name: 'Business Hotel Central', star: 3, desc: '3-star Business' },
      { name: 'Paradise Resort', star: 4, desc: '4-star Resort' },
      { name: 'Modern Stay', star: 3, desc: '3-star Modern' },
      { name: 'Maharaja Palace', star: 5, desc: 'Luxury Palace' }
    ]

    const nights = Math.ceil((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24))

    return hotelNames.map((hotel, i) => ({
      provider: 'mock',
      id: `mock_hotel_${i}`,
      name: hotel.name,
      location: destination,
      description: hotel.desc,
      price: (1500 + Math.random() * 8000) * nights,
      pricePerNight: Math.round(1500 + Math.random() * 8000),
      currency: 'INR',
      rating: hotel.star,
      reviewCount: Math.floor(Math.random() * 500) + 50,
      image: SEARCH_HOTEL_IMAGES[i % SEARCH_HOTEL_IMAGES.length],
      amenities: ['WiFi', 'Pool', 'AC', 'Restaurant', 'Parking'].slice(0, Math.random() > 0.5 ? 5 : 3),
      roomsLeft: Math.floor(Math.random() * 5) + 1,
      checkIn: checkinDate,
      checkOut: checkoutDate,
      nights: nights,
      badges: hotel.star === 5 ? ['Luxury', 'Verified'] : ['Popular']
    }))
  }

  generateMockBuses(from, to, date) {
    const operators = [
      'Redbus Express',
      'SRS Travels',
      'Shrinath Travels',
      'Gaurav Tourism',
      'Sharma Travels',
      'King Coach'
    ]

    return Array.from({ length: 10 }, (_, i) => {
      const depHour = 6 + Math.floor(Math.random() * 18)
      const depMin = Math.random() > 0.5 ? '00' : '30'
      const duration = 2 + Math.random() * 16

      return {
        provider: 'mock',
        id: `mock_bus_${i}`,
        operator: operators[i % operators.length],
        departure: `${String(depHour).padStart(2, '0')}:${depMin}`,
        arrival: `${String((depHour + Math.ceil(duration)) % 24).padStart(2, '0')}:${depMin}`,
        duration: `${Math.floor(duration)}h ${Math.floor((duration % 1) * 60)}m`,
        price: Math.round(400 + Math.random() * 3000),
        currency: 'INR',
        seats: Math.floor(Math.random() * 20) + 5,
        rating: 3.5 + Math.random() * 1.5,
        amenities: ['AC', 'WiFi', 'Charging', 'Blanket', 'Pillow'].slice(0, Math.floor(Math.random() * 5) + 1),
        busType: ['Sleeper', 'Seater', 'Semi-Sleeper'][Math.floor(Math.random() * 3)],
        route: `${from} → ${to}`
      }
    })
  }

  generateMockCabs() {
    const cabTypes = [
      { name: 'Uber GO', desc: 'Budget Ride', multiplier: 1 },
      { name: 'Uber Prime', desc: 'Premium Car', multiplier: 1.5 },
      { name: 'Ola Prime', desc: 'Premium Ride', multiplier: 1.4 },
      { name: 'Ola Classic', desc: 'Standard Ride', multiplier: 0.9 },
      { name: 'Uber XL', desc: 'For 6 Passengers', multiplier: 2 }
    ]

    return cabTypes.map((cab, i) => ({
      provider: 'mock',
      id: `mock_cab_${i}`,
      rideType: cab.name,
      description: cab.desc,
      price: Math.round(150 * cab.multiplier + Math.random() * 200),
      currency: 'INR',
      duration: `${Math.floor(5 + Math.random() * 25)} mins`,
      distance: `${(5 + Math.random() * 25).toFixed(1)} km`,
      rating: 4.5 + Math.random() * 0.5,
      seats: cab.multiplier > 1.8 ? 6 : 4
    }))
  }
}

export default new UnifiedSearchService()
