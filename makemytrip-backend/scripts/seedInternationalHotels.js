import { db } from '../src/config/firebase.js'

const internationalHotels = [
  // DUBAI - 8 hotels
  {
    name: 'Burj Al Arab Jumeirah',
    city: 'Dubai',
    location: 'Jumeirah Beach, Dubai, UAE',
    description: 'Iconic sail-shaped luxury hotel with stunning Arabian Gulf views.',
    price: 1500,
    pricePerNight: 1500,
    rating: 5.0,
    reviews: 4850,
    rooms: 202,
    amenities: ['Spa', 'Private Beach', 'Fine Dining', 'Helipad', 'Personal Concierge'],
    images: ['/images/hotels/hotel-luxury-exterior-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Emirates Palace Dubai',
    city: 'Dubai',
    location: 'Abu Dhabi, Dubai, UAE',
    description: 'Palatial ultra-luxury resort with opulent architecture.',
    price: 1200,
    pricePerNight: 1200,
    rating: 4.9,
    reviews: 3420,
    rooms: 394,
    amenities: ['Spa', 'Beach Club', 'Multiple Restaurants', 'Private Marina', 'Golf Course'],
    images: ['/images/hotels/hotel-room-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Atlantis The Palm',
    city: 'Dubai',
    location: 'Palm Jumeirah, Dubai, UAE',
    description: 'Resort with aquarium, waterpark, and beach access.',
    price: 800,
    pricePerNight: 800,
    rating: 4.7,
    reviews: 5120,
    rooms: 1539,
    amenities: ['Aquarium', 'Waterpark', 'Beach Access', 'Kids Club', 'Multiple Pools'],
    images: ['/images/hotels/hotel-pool-800.webp'],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true
  },
  {
    name: 'One&Only Royal Mirage',
    city: 'Dubai',
    location: 'Al Sufouh, Dubai, UAE',
    description: 'Beachfront oasis with Arabian-inspired luxury.',
    price: 950,
    pricePerNight: 950,
    rating: 4.8,
    reviews: 3680,
    rooms: 500,
    amenities: ['Private Beach', 'Spa', 'Water Sports', 'Fine Dining', 'Beach Bar'],
    images: ['/images/hotels/hotel-lobby-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Jumeirah Beach Hotel',
    city: 'Dubai',
    location: 'Jumeirah Beach, Dubai, UAE',
    description: 'Wave-shaped beachfront hotel with water sports.',
    price: 650,
    pricePerNight: 650,
    rating: 4.6,
    reviews: 4200,
    rooms: 618,
    amenities: ['Beach Access', 'Water Sports', 'Kids Club', 'Multiple Pools', 'Restaurants'],
    images: ['/images/hotels/hotel-restaurant-800.webp'],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true
  },
  {
    name: 'Waldorf Astoria Dubai Palm Jumeirah',
    city: 'Dubai',
    location: 'Palm Jumeirah, Dubai, UAE',
    description: 'Ultra-luxury hotel with stunning sea views.',
    price: 1100,
    pricePerNight: 1100,
    rating: 4.9,
    reviews: 2340,
    rooms: 350,
    amenities: ['Spa', 'Fine Dining', 'Private Beach', 'Pool', 'Yoga'],
    images: ['/images/hotels/hotel-suite-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Madinat Jumeirah',
    city: 'Dubai',
    location: 'Jumeirah, Dubai, UAE',
    description: 'Arabian city-style resort with multiple hotels and attractions.',
    price: 750,
    pricePerNight: 750,
    rating: 4.7,
    reviews: 3890,
    rooms: 1200,
    amenities: ['Beach', 'Waterpark', 'Multiple Restaurants', 'Spa', 'Water Sports'],
    images: ['/images/hotels/hotel-room-2-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'FIVE Palm Jumeirah',
    city: 'Dubai',
    location: 'Palm Jumeirah, Dubai, UAE',
    description: 'Contemporary luxury hotel for young travelers.',
    price: 900,
    pricePerNight: 900,
    rating: 4.6,
    reviews: 2560,
    rooms: 461,
    amenities: ['Beach Club', 'Multiple Pools', 'Restaurants', 'Nightclub', 'Spa'],
    images: ['/images/hotels/hotel-reception-800.webp'],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true
  },

  // BANGKOK - 6 hotels
  {
    name: 'Mandarin Oriental Bangkok',
    city: 'Bangkok',
    location: 'Chao Phraya River, Bangkok, Thailand',
    description: 'Legendary luxury hotel on Chao Phraya River.',
    price: 680,
    pricePerNight: 680,
    rating: 4.9,
    reviews: 3950,
    rooms: 396,
    amenities: ['River View', 'Spa', 'Fine Dining', 'Pool', 'Cooking School'],
    images: ['/images/hotels/hotel-rooftop-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Four Seasons Bangkok',
    city: 'Bangkok',
    location: 'Lumphini, Bangkok, Thailand',
    description: 'Contemporary luxury hotel with lush gardens.',
    price: 620,
    pricePerNight: 620,
    rating: 4.8,
    reviews: 3240,
    rooms: 354,
    amenities: ['River View', 'Pool', 'Spa', 'Multiple Restaurants', 'Gardens'],
    images: ['/images/hotels/hotel-pool-2-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Siam Hotel Bangkok',
    city: 'Bangkok',
    location: 'Khlong Toei, Bangkok, Thailand',
    description: 'Luxury urban resort with modern design.',
    price: 480,
    pricePerNight: 480,
    rating: 4.7,
    reviews: 2850,
    rooms: 289,
    amenities: ['Rooftop Pool', 'Spa', 'Restaurants', 'Gym', 'Business Center'],
    images: ['/images/hotels/hotel-room-3-800.webp'],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true
  },
  {
    name: 'Shangri-La Bangkok',
    city: 'Bangkok',
    location: 'New Road, Bangkok, Thailand',
    description: 'Riverside luxury resort with Asian elegance.',
    price: 550,
    pricePerNight: 550,
    rating: 4.8,
    reviews: 3120,
    rooms: 802,
    amenities: ['River View', 'Multiple Pools', 'Spa', 'Restaurants', 'Business Center'],
    images: ['/images/hotels/hotel-resort-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Dusit Thani Bangkok',
    city: 'Bangkok',
    location: 'Silom, Bangkok, Thailand',
    description: 'Elegant hotel with traditional Thai hospitality.',
    price: 420,
    pricePerNight: 420,
    rating: 4.6,
    reviews: 2670,
    rooms: 540,
    amenities: ['Pool', 'Spa', 'Restaurants', 'Cultural Center', 'Business Facilities'],
    images: ['/images/hotels/hotel-restaurant-2-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'JW Marriott Bangkok',
    city: 'Bangkok',
    location: 'Sukhumvit, Bangkok, Thailand',
    description: 'Modern luxury hotel in shopping district.',
    price: 380,
    pricePerNight: 380,
    rating: 4.5,
    reviews: 2340,
    rooms: 427,
    amenities: ['Pool', 'Spa', 'Multiple Restaurants', 'Business Center', 'Gym'],
    images: ['/images/hotels/hotel-bathroom-800.webp'],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true
  },

  // SINGAPORE - 5 hotels
  {
    name: 'Marina Bay Sands',
    city: 'Singapore',
    location: 'Marina Bay, Singapore',
    description: 'Iconic hotel with rooftop infinity pool.',
    price: 850,
    pricePerNight: 850,
    rating: 4.8,
    reviews: 4560,
    rooms: 2561,
    amenities: ['Rooftop Pool', 'Spa', 'Multiple Restaurants', 'Shopping', 'Gym'],
    images: ['/images/hotels/hotel-luxury-exterior-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Raffles Singapore',
    city: 'Singapore',
    location: 'Beach Road, Singapore',
    description: 'Historic luxury hotel with colonial charm.',
    price: 750,
    pricePerNight: 750,
    rating: 4.9,
    reviews: 3280,
    rooms: 103,
    amenities: ['Heritage', 'Spa', 'Fine Dining', 'Bar', 'Pool'],
    images: ['/images/hotels/hotel-room-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'The St. Regis Singapore',
    city: 'Singapore',
    location: 'Tanglin Road, Singapore',
    description: 'Ultra-luxury hotel with impeccable service.',
    price: 920,
    pricePerNight: 920,
    rating: 4.9,
    reviews: 2890,
    rooms: 293,
    amenities: ['Spa', 'Fine Dining', 'Pool', 'Concierge', 'Fitness Center'],
    images: ['/images/hotels/hotel-pool-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Fullerton Hotel Singapore',
    city: 'Singapore',
    location: 'Marina Bay, Singapore',
    description: 'Heritage hotel with modern luxury amenities.',
    price: 680,
    pricePerNight: 680,
    rating: 4.7,
    reviews: 2340,
    rooms: 400,
    amenities: ['Heritage Building', 'Spa', 'Restaurants', 'Pool', 'Business Center'],
    images: ['/images/hotels/hotel-lobby-800.webp'],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true
  },
  {
    name: 'Pan Pacific Singapore',
    city: 'Singapore',
    location: 'Marina Bay, Singapore',
    description: 'Contemporary hotel with scenic city views.',
    price: 580,
    pricePerNight: 580,
    rating: 4.6,
    reviews: 2150,
    rooms: 790,
    amenities: ['Pool', 'Spa', 'Multiple Restaurants', 'Gym', 'Business Facilities'],
    images: ['/images/hotels/hotel-restaurant-800.webp'],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true
  }
]

async function seedInternationalHotels() {
  try {
    console.log('🌍 Starting International Hotel Seeding...')
    console.log(`📝 Total international hotels to add: ${internationalHotels.length}`)

    let successCount = 0
    let errorCount = 0

    for (const hotel of internationalHotels) {
      try {
        const hotelId = `hotel_intl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        await db.collection('hotels').doc(hotelId).set({
          ...hotel,
          roomsAvailable: hotel.rooms,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        console.log(`✅ ${hotel.name} (${hotel.city})`)
        successCount++
      } catch (err) {
        console.error(`❌ Error adding ${hotel.name}: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Successfully added: ${successCount} international hotels`)
    console.log(`❌ Failed: ${errorCount} hotels`)
    console.log(`${'='.repeat(60)}`)
    console.log(`\n🎉 International hotel seeding complete!`)
  } catch (err) {
    console.error('Fatal error during seeding:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

seedInternationalHotels()
