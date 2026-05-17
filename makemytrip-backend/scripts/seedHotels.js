import prisma from '../src/config/prismaClient.js'

const hotelImages = {
  amara: [
    "https://img.magnific.com/free-photo/type-entertainment-complex-popular-resort-with-pools-water-parks-turkey-with-more-than-5-million-visitors-year-amara-dolce-vita-luxury-hotel-resort-tekirova-kemer_146671-18728.jpg?w=1480",
    "https://img.magnific.com/free-photo/swimming-pool-beach-luxury-hotel-type-entertainment-complex-amara-dolce-vita-luxury-hotel-resort-tekirova-kemer-turkey_146671-18726.jpg?w=1480",
  ],
  bedroom: [
    "https://img.magnific.com/free-photo/luxury-bedroom-suite-resort-high-rise-hotel-with-working-table_105762-1783.jpg?w=1480",
    "https://img.magnific.com/free-photo/luxury-bedroom-hotel_1150-10836.jpg?w=1480",
    "https://img.magnific.com/free-photo/modern-studio-apartment-design-with-bedroom-living-space_1262-12375.jpg?w=1480",
  ],
  lobby: [
    "https://img.magnific.com/free-photo/luxury-hotel-reception-hall-lounge-restaurant-with-high-ceiling_105762-1771.jpg?w=1480",
    "https://img.magnific.com/free-photo/modern-luxury-hotel-office-reception-lounge-with-meeting-room_105762-1772.jpg?w=1480",
  ],
  pool: [
    "https://img.magnific.com/free-photo/swimming-pool_74190-1977.jpg?w=1480",
    "https://img.magnific.com/free-photo/umbrella-chair-around-swimming-pool_1203-2419.jpg?w=1480",
  ],
}

const hotels = [
  // Dubai Hotels
  {
    name: 'Burj Al Arab Jumeirah',
    city: 'Dubai',
    location: 'Jumeirah Beach, Dubai',
    description: 'Iconic sail-shaped luxury hotel with stunning Arabian Gulf views and world-class amenities.',
    price: 1500,
    pricePerNight: 1500,
    rating: 5.0,
    reviews: 4850,
    rooms: 202,
    amenities: ['Spa', 'Private Beach', 'Fine Dining', 'Helipad', 'Personal Concierge', 'Jacuzzi'],
    images: [...hotelImages.amara, ...hotelImages.lobby, ...hotelImages.pool],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true,
  },
  {
    name: 'Emirates Palace',
    city: 'Dubai',
    location: 'Abu Dhabi, Dubai',
    description: 'Palatial ultra-luxury resort with opulent architecture and exceptional service.',
    price: 1200,
    pricePerNight: 1200,
    rating: 4.9,
    reviews: 3420,
    rooms: 394,
    amenities: ['Spa', 'Beach Club', 'Multiple Restaurants', 'Private Marina', 'Golf Course', 'Kids Club'],
    images: [...hotelImages.lobby, ...hotelImages.bedroom, ...hotelImages.pool],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true,
  },
  {
    name: 'Atlantis The Palm',
    city: 'Dubai',
    location: 'Palm Jumeirah, Dubai',
    description: 'Unique resort with aquarium, waterpark, and beach access on Palm Island.',
    price: 800,
    pricePerNight: 800,
    rating: 4.7,
    reviews: 5120,
    rooms: 1539,
    amenities: ['Aquarium', 'Waterpark', 'Beach Access', 'Kids Club', 'Multiple Pools', 'Entertainment'],
    images: [...hotelImages.pool, ...hotelImages.bedroom, ...hotelImages.amara],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true,
  },
  {
    name: 'One&Only Royal Mirage',
    city: 'Dubai',
    location: 'Al Sufouh, Dubai',
    description: 'Beachfront oasis with Arabian-inspired luxury and direct beach access.',
    price: 950,
    pricePerNight: 950,
    rating: 4.8,
    reviews: 3680,
    rooms: 500,
    amenities: ['Private Beach', 'Spa', 'Water Sports', 'Fine Dining', 'Beach Bar', 'Yacht'],
    images: [...hotelImages.bedroom, ...hotelImages.pool, ...hotelImages.lobby],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true,
  },
  {
    name: 'Jumeirah Beach Hotel',
    city: 'Dubai',
    location: 'Jumeirah Beach, Dubai',
    description: 'Wave-shaped beachfront hotel with water sports and family-friendly facilities.',
    price: 650,
    pricePerNight: 650,
    rating: 4.6,
    reviews: 4200,
    rooms: 618,
    amenities: ['Beach Access', 'Water Sports', 'Kids Club', 'Multiple Pools', 'Restaurants', 'Spa'],
    images: [...hotelImages.pool, ...hotelImages.amara, ...hotelImages.bedroom],
    checkin: '15:00',
    checkout: '11:00',
    isActive: true,
  },

  // Mumbai Hotels
  {
    name: 'Taj Mahal Palace',
    city: 'Mumbai',
    location: 'Colaba, Mumbai',
    description: 'Iconic heritage hotel overlooking Gateway of India with classic luxury.',
    price: 400,
    pricePerNight: 400,
    rating: 4.9,
    reviews: 4120,
    rooms: 565,
    amenities: ['Heritage Building', 'Rooftop Bar', 'Fine Dining', 'Spa', 'Business Center', 'Concierge'],
    images: [...hotelImages.lobby, ...hotelImages.bedroom, ...hotelImages.pool],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true,
  },
  {
    name: 'The Oberoi Mumbai',
    city: 'Mumbai',
    location: 'Nariman Point, Mumbai',
    description: 'Waterfront luxury hotel with panoramic Arabian Sea views.',
    price: 380,
    pricePerNight: 380,
    rating: 4.8,
    reviews: 3560,
    rooms: 287,
    amenities: ['Sea View', 'Swimming Pool', 'Spa', 'Fine Dining', 'Gym', 'Business Facilities'],
    images: [...hotelImages.bedroom, ...hotelImages.pool, ...hotelImages.lobby],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true,
  },

  // Delhi Hotels
  {
    name: 'The Oberoi New Delhi',
    city: 'Delhi',
    location: 'New Delhi',
    description: 'Luxurious hotel with lush gardens and premium dining experiences.',
    price: 320,
    pricePerNight: 320,
    rating: 4.8,
    reviews: 2341,
    rooms: 280,
    amenities: ['Gardens', 'Fine Dining', 'Spa', 'Pool', 'Fitness Center', 'Concierge'],
    images: [...hotelImages.pool, ...hotelImages.bedroom, ...hotelImages.lobby],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true,
  },

  // Bangalore Hotels
  {
    name: 'ITC Windsor',
    city: 'Bangalore',
    location: 'Bangalore',
    description: 'Luxury business hotel with contemporary design and premium amenities.',
    price: 280,
    pricePerNight: 280,
    rating: 4.7,
    reviews: 1893,
    rooms: 300,
    amenities: ['Business Center', 'Spa', 'Multiple Restaurants', 'Pool', 'Fitness Center', 'Wifi'],
    images: [...hotelImages.bedroom, ...hotelImages.lobby, ...hotelImages.pool],
    checkin: '14:00',
    checkout: '12:00',
    isActive: true,
  },
]

async function seedHotels() {
  try {
    console.log('Clearing existing hotels...')
    await prisma.hotel.deleteMany({})

    console.log('Seeding hotels...')
    for (const hotel of hotels) {
      await prisma.hotel.create({
        data: {
          ...hotel,
          roomsAvailable: hotel.rooms,
        },
      })
    }

    console.log(`✓ Successfully seeded ${hotels.length} hotels`)
  } catch (err) {
    console.error('Error seeding hotels:', err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedHotels()
