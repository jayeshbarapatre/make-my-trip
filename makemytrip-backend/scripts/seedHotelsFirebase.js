import { db } from '../src/config/firebase.js'

const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Udaipur', 'Jaipur', 'Goa', 'Kochi', 'Hyderabad', 'Pune', 'Agra', 'Chennai', 'Kolkata', 'Lucknow', 'Dubai', 'Bangkok', 'Maldives', 'Singapore']

const hotelPrefixes = ['Taj', 'ITC', 'Oberoi', 'Leela', 'Hilton', 'JW Marriott', 'Four Seasons', 'Hyatt', 'Radisson', 'The', 'Royal', 'Palace', 'Heritage', 'Luxury', 'Grand']

const amenityPool = [
  'Pool', 'Spa', 'Restaurant', 'Bar', 'Gym', 'WiFi', 'AC', 'TV', 'Parking',
  'Room Service', 'Concierge', 'Front Desk', 'Business Center', 'Conference Room',
  'Kids Club', 'Water Sports', 'Yoga', 'Meditation', 'Sauna', 'Steam Room',
  'Beach Access', 'Lake View', 'Mountain View', 'City View', 'Garden',
  'Fine Dining', 'Cafe', 'Lounge', 'Terrace', 'Balcony'
]

function getRandomAmenities() {
  const amenities = []
  const count = Math.floor(Math.random() * 8) + 3
  for (let i = 0; i < count; i++) {
    const amenity = amenityPool[Math.floor(Math.random() * amenityPool.length)]
    if (!amenities.includes(amenity)) amenities.push(amenity)
  }
  return amenities
}

function generateHotels() {
  const hotels = []
  const images = [
    '/images/hotels/hotel-luxury-exterior-800.webp',
    '/images/hotels/hotel-room-800.webp',
    '/images/hotels/hotel-pool-800.webp',
    '/images/hotels/hotel-lobby-800.webp',
    '/images/hotels/hotel-restaurant-800.webp',
  ]

  for (let i = 0; i < 100; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)]
    const prefix = hotelPrefixes[Math.floor(Math.random() * hotelPrefixes.length)]
    const suffix = ['Hotel', 'Resort', 'Palace', 'Inn', 'Suites', 'Residences'][Math.floor(Math.random() * 6)]

    hotels.push({
      name: `${prefix} ${city} ${suffix} ${i + 1}`,
      city,
      location: `${city}, India`,
      description: `Luxurious ${suffix.toLowerCase()} in ${city} with world-class amenities and exceptional service.`,
      price: Math.floor(Math.random() * (10000 - 1000)) + 1000,
      pricePerNight: Math.floor(Math.random() * (5000 - 200)) + 200,
      rating: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1),
      reviews: Math.floor(Math.random() * 5000),
      rooms: Math.floor(Math.random() * (500 - 30)) + 30,
      amenities: getRandomAmenities(),
      images: images,
      checkin: '14:00',
      checkout: '12:00',
      isActive: true
    })
  }

  return hotels
}

async function seedHotelsFirebase() {
  try {
    const hotels = generateHotels()
    console.log('🏨 Starting Firebase Hotel Seeding...')
    console.log(`📝 Total hotels to add: ${hotels.length}`)

    let successCount = 0
    let errorCount = 0

    for (const hotel of hotels) {
      try {
        const hotelId = `hotel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        await db.collection('hotels').doc(hotelId).set({
          ...hotel,
          roomsAvailable: hotel.rooms,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        if ((successCount + 1) % 10 === 0) {
          console.log(`✅ ${successCount + 1}/${hotels.length} hotels added...`)
        }
        successCount++
      } catch (err) {
        console.error(`❌ Error adding hotel: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Successfully added: ${successCount} hotels`)
    console.log(`❌ Failed: ${errorCount} hotels`)
    console.log(`${'='.repeat(60)}`)
    console.log(`\n🎉 Firebase hotel seeding complete!`)
  } catch (err) {
    console.error('Fatal error during seeding:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

seedHotelsFirebase()
