import { db } from '../src/config/firebase.js'

const maldivesHotels = [
  // Ultra-Luxury Resorts
  {
    name: 'The Soneva Jani Maldives',
    city: 'Maldives',
    location: 'Noonu Atoll, Maldives',
    description: 'Ultra-luxury overwater villa resort with sliding roof and observatory.',
    price: 2500,
    pricePerNight: 2500,
    rating: 5.0,
    reviews: 2140,
    rooms: 24,
    amenities: ['Water Villas', 'Spa', 'Observatory', 'Water Sports', 'Fine Dining', 'Private Beach', 'Yoga'],
    images: [
      '/images/hotels/hotel-luxury-exterior-800.webp',
      '/images/hotels/hotel-room-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Taj Exotica Resort & Spa Maldives',
    city: 'Maldives',
    location: 'Emboodhu Finolhu Island, Maldives',
    description: 'Luxurious island resort with stunning coral reefs and water activities.',
    price: 1800,
    pricePerNight: 1800,
    rating: 4.9,
    reviews: 2890,
    rooms: 65,
    amenities: ['Beach Villas', 'Spa', 'Diving', 'Water Sports', 'Multiple Restaurants', 'Bar', 'Yoga'],
    images: [
      '/images/hotels/hotel-pool-800.webp',
      '/images/hotels/hotel-lobby-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'The Muraka - Farafu Resort',
    city: 'Maldives',
    location: 'South Male Atoll, Maldives',
    description: 'Exclusive resort with overwater bungalows and pristine lagoon.',
    price: 1600,
    pricePerNight: 1600,
    rating: 4.8,
    reviews: 1950,
    rooms: 50,
    amenities: ['Overwater Bungalows', 'Spa', 'Diving', 'Snorkeling', 'Water Sports', 'Fine Dining'],
    images: [
      '/images/hotels/hotel-restaurant-800.webp',
      '/images/hotels/hotel-suite-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Angsana Laguna Resort',
    city: 'Maldives',
    location: 'South Male Atoll, Maldives',
    description: 'Beachfront luxury resort with lagoon activities and water sports.',
    price: 1400,
    pricePerNight: 1400,
    rating: 4.7,
    reviews: 1680,
    rooms: 80,
    amenities: ['Beach Access', 'Lagoon View', 'Spa', 'Diving Center', 'Water Sports', 'Restaurant'],
    images: [
      '/images/hotels/hotel-room-2-800.webp',
      '/images/hotels/hotel-reception-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Vilamendhoo Island Resort',
    city: 'Maldives',
    location: 'Vaavu Atoll, Maldives',
    description: 'Private island resort with excellent diving and snorkeling spots.',
    price: 1200,
    pricePerNight: 1200,
    rating: 4.6,
    reviews: 1420,
    rooms: 60,
    amenities: ['Private Island', 'Diving', 'Snorkeling', 'Water Sports', 'Restaurant', 'Bar'],
    images: [
      '/images/hotels/hotel-rooftop-800.webp',
      '/images/hotels/hotel-pool-2-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Kuramathi Island Resort',
    city: 'Maldives',
    location: 'Rasdhoo Atoll, Maldives',
    description: 'Large resort with diverse activities and multiple dining options.',
    price: 1000,
    pricePerNight: 1000,
    rating: 4.5,
    reviews: 1280,
    rooms: 150,
    amenities: ['Multiple Restaurants', 'Water Sports', 'Diving', 'Kids Club', 'Spa', 'Beach Bar'],
    images: [
      '/images/hotels/hotel-room-3-800.webp',
      '/images/hotels/hotel-resort-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Coco Bodu Hithi',
    city: 'Maldives',
    location: 'North Male Atoll, Maldives',
    description: 'Intimate luxury resort with personalized service and water villas.',
    price: 1500,
    pricePerNight: 1500,
    rating: 4.8,
    reviews: 1760,
    rooms: 40,
    amenities: ['Water Villas', 'Spa', 'Diving', 'Snorkeling', 'Fine Dining', 'Yoga'],
    images: [
      '/images/hotels/hotel-restaurant-2-800.webp',
      '/images/hotels/hotel-bathroom-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Maafushi Island Resort',
    city: 'Maldives',
    location: 'South Male Atoll, Maldives',
    description: 'Budget-friendly island resort with great snorkeling and diving.',
    price: 600,
    pricePerNight: 600,
    rating: 4.3,
    reviews: 980,
    rooms: 120,
    amenities: ['Beach Access', 'Diving', 'Snorkeling', 'Restaurant', 'Bar', 'WiFi'],
    images: [
      '/images/hotels/hotel-luxury-exterior-800.webp',
      '/images/hotels/hotel-room-800.webp'
    ],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true
  },
  {
    name: 'Paradise Island Resort',
    city: 'Maldives',
    location: 'North Male Atoll, Maldives',
    description: 'Popular resort with water sports and family-friendly amenities.',
    price: 800,
    pricePerNight: 800,
    rating: 4.4,
    reviews: 1150,
    rooms: 200,
    amenities: ['Water Sports', 'Kids Club', 'Multiple Restaurants', 'Spa', 'Beach Bar'],
    images: [
      '/images/hotels/hotel-pool-800.webp',
      '/images/hotels/hotel-lobby-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Summer Island Village',
    city: 'Maldives',
    location: 'South Male Atoll, Maldives',
    description: 'Affordable luxury resort with excellent service and water activities.',
    price: 700,
    pricePerNight: 700,
    rating: 4.5,
    reviews: 1320,
    rooms: 90,
    amenities: ['Beach Villas', 'Diving', 'Water Sports', 'Restaurant', 'Bar', 'Spa'],
    images: [
      '/images/hotels/hotel-restaurant-800.webp',
      '/images/hotels/hotel-suite-800.webp'
    ],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
]

async function seedMaldivesHotels() {
  try {
    console.log('🏝️ Starting Maldives Hotel Seeding...')
    console.log(`📝 Total Maldives hotels to add: ${maldivesHotels.length}`)

    let successCount = 0
    let errorCount = 0

    for (const hotel of maldivesHotels) {
      try {
        const hotelId = `hotel_maldives_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        await db.collection('hotels').doc(hotelId).set({
          ...hotel,
          roomsAvailable: hotel.rooms,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        console.log(`✅ ${hotel.name}`)
        successCount++
      } catch (err) {
        console.error(`❌ Error adding ${hotel.name}: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Successfully added: ${successCount} Maldives hotels`)
    console.log(`❌ Failed: ${errorCount} hotels`)
    console.log(`${'='.repeat(60)}`)
    console.log(`\n🎉 Maldives hotel seeding complete!`)
  } catch (err) {
    console.error('Fatal error during seeding:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

seedMaldivesHotels()
