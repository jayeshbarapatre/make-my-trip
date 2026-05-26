import 'dotenv/config'
import prisma from '../src/config/prismaClient.js'

const seedTrains = async () => {
  console.log('🚆 Starting train seed...')

  try {
    await prisma.train.deleteMany({})
    console.log('✓ Cleared existing trains')

    const trains = [
      // ── Delhi ↔ Mumbai ──
      {
        operatorName: 'Rajdhani Express',
        trainNumber: '12951',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NDLS', time: '16:55', date: '2026-06-01' },
        arrival:   { city: 'Mumbai', station: 'BCT', time: '08:35', date: '2026-06-02' },
        durationMinutes: 940,
        price: 2450,
        seats: 600,
        seatsAvailable: 420,
        amenities: ['Meals Included', 'Pantry Car', 'Blanket', 'Charging Point', 'WiFi'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },
      {
        operatorName: 'August Kranti Rajdhani',
        trainNumber: '12953',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NZM', time: '17:40', date: '2026-06-01' },
        arrival:   { city: 'Mumbai', station: 'BCT', time: '10:55', date: '2026-06-02' },
        durationMinutes: 1035,
        price: 2150,
        seats: 500,
        seatsAvailable: 310,
        amenities: ['Meals Included', 'Pantry Car', 'Blanket', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Delhi ↔ Kolkata ──
      {
        operatorName: 'Howrah Rajdhani',
        trainNumber: '12301',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NDLS', time: '16:50', date: '2026-06-01' },
        arrival:   { city: 'Kolkata', station: 'HWH', time: '09:55', date: '2026-06-02' },
        durationMinutes: 1025,
        price: 2380,
        seats: 550,
        seatsAvailable: 200,
        amenities: ['Meals Included', 'Pantry Car', 'Blanket', 'Charging Point', 'WiFi'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },
      {
        operatorName: 'Duronto Express',
        trainNumber: '12273',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NDLS', time: '21:30', date: '2026-06-01' },
        arrival:   { city: 'Kolkata', station: 'HWH', time: '14:10', date: '2026-06-02' },
        durationMinutes: 1000,
        price: 1890,
        seats: 480,
        seatsAvailable: 350,
        amenities: ['Meals Included', 'Pantry Car', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Delhi ↔ Chennai ──
      {
        operatorName: 'Tamil Nadu Express',
        trainNumber: '12621',
        type: 'Sleeper',
        departure: { city: 'New Delhi', station: 'NDLS', time: '22:30', date: '2026-06-01' },
        arrival:   { city: 'Chennai', station: 'MAS', time: '07:10', date: '2026-06-03' },
        durationMinutes: 1960,
        price: 780,
        seats: 800,
        seatsAvailable: 550,
        amenities: ['Pantry Car', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },
      {
        operatorName: 'GT Express',
        trainNumber: '12615',
        type: 'Sleeper',
        departure: { city: 'New Delhi', station: 'NDLS', time: '18:40', date: '2026-06-01' },
        arrival:   { city: 'Chennai', station: 'MAS', time: '04:15', date: '2026-06-03' },
        durationMinutes: 2015,
        price: 720,
        seats: 750,
        seatsAvailable: 600,
        amenities: ['Pantry Car'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Mumbai ↔ Bengaluru ──
      {
        operatorName: 'Udyan Express',
        trainNumber: '11301',
        type: 'AC',
        departure: { city: 'Mumbai', station: 'CSMT', time: '08:05', date: '2026-06-01' },
        arrival:   { city: 'Bengaluru', station: 'SBC', time: '08:00', date: '2026-06-02' },
        durationMinutes: 1435,
        price: 1650,
        seats: 400,
        seatsAvailable: 280,
        amenities: ['Pantry Car', 'Charging Point', 'Blanket'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Delhi ↔ Bengaluru ──
      {
        operatorName: 'Karnataka Express',
        trainNumber: '12627',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NDLS', time: '21:15', date: '2026-06-01' },
        arrival:   { city: 'Bengaluru', station: 'SBC', time: '06:20', date: '2026-06-03' },
        durationMinutes: 1985,
        price: 2100,
        seats: 500,
        seatsAvailable: 380,
        amenities: ['Meals Included', 'Pantry Car', 'Blanket', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Mumbai ↔ Ahmedabad ──
      {
        operatorName: 'Shatabdi Express',
        trainNumber: '12009',
        type: 'AC',
        departure: { city: 'Mumbai', station: 'BCT', time: '06:25', date: '2026-06-01' },
        arrival:   { city: 'Ahmedabad', station: 'ADI', time: '12:55', date: '2026-06-01' },
        durationMinutes: 390,
        price: 1180,
        seats: 350,
        seatsAvailable: 150,
        amenities: ['Meals Included', 'Charging Point', 'WiFi'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },
      {
        operatorName: 'Karnavati Express',
        trainNumber: '12933',
        type: 'Sleeper',
        departure: { city: 'Mumbai', station: 'BCT', time: '23:30', date: '2026-06-01' },
        arrival:   { city: 'Ahmedabad', station: 'ADI', time: '06:45', date: '2026-06-02' },
        durationMinutes: 435,
        price: 420,
        seats: 600,
        seatsAvailable: 480,
        amenities: ['Pantry Car'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Delhi ↔ Jaipur ──
      {
        operatorName: 'Ajmer Shatabdi',
        trainNumber: '12015',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NDLS', time: '06:05', date: '2026-06-01' },
        arrival:   { city: 'Jaipur', station: 'JP', time: '10:40', date: '2026-06-01' },
        durationMinutes: 275,
        price: 890,
        seats: 300,
        seatsAvailable: 120,
        amenities: ['Meals Included', 'Charging Point', 'WiFi'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Kolkata ↔ Chennai ──
      {
        operatorName: 'Coromandel Express',
        trainNumber: '12841',
        type: 'Sleeper',
        departure: { city: 'Kolkata', station: 'HWH', time: '14:50', date: '2026-06-01' },
        arrival:   { city: 'Chennai', station: 'MAS', time: '17:25', date: '2026-06-02' },
        durationMinutes: 1595,
        price: 680,
        seats: 700,
        seatsAvailable: 500,
        amenities: ['Pantry Car', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Delhi ↔ Lucknow ──
      {
        operatorName: 'Lucknow Shatabdi',
        trainNumber: '12003',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NDLS', time: '06:10', date: '2026-06-01' },
        arrival:   { city: 'Lucknow', station: 'LKO', time: '12:40', date: '2026-06-01' },
        durationMinutes: 390,
        price: 1050,
        seats: 350,
        seatsAvailable: 200,
        amenities: ['Meals Included', 'Charging Point', 'WiFi'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Hyderabad ↔ Bengaluru ──
      {
        operatorName: 'Kacheguda Express',
        trainNumber: '12785',
        type: 'Sleeper',
        departure: { city: 'Hyderabad', station: 'KCG', time: '18:45', date: '2026-06-01' },
        arrival:   { city: 'Bengaluru', station: 'SBC', time: '06:30', date: '2026-06-02' },
        durationMinutes: 705,
        price: 520,
        seats: 500,
        seatsAvailable: 400,
        amenities: ['Pantry Car'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Mumbai ↔ Goa ──
      {
        operatorName: 'Tejas Express',
        trainNumber: '22119',
        type: 'AC',
        departure: { city: 'Mumbai', station: 'CSMT', time: '05:50', date: '2026-06-01' },
        arrival:   { city: 'Goa', station: 'KRMI', time: '13:50', date: '2026-06-01' },
        durationMinutes: 480,
        price: 1320,
        seats: 300,
        seatsAvailable: 90,
        amenities: ['Meals Included', 'WiFi', 'Entertainment', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Delhi ↔ Varanasi ──
      {
        operatorName: 'Vande Bharat Express',
        trainNumber: '22436',
        type: 'AC',
        departure: { city: 'New Delhi', station: 'NDLS', time: '06:00', date: '2026-06-01' },
        arrival:   { city: 'Varanasi', station: 'BSB', time: '14:00', date: '2026-06-01' },
        durationMinutes: 480,
        price: 1550,
        seats: 400,
        seatsAvailable: 160,
        amenities: ['Meals Included', 'WiFi', 'Charging Point', 'Reclining Seats'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Chennai ↔ Bengaluru ──
      {
        operatorName: 'Shatabdi Express',
        trainNumber: '12007',
        type: 'AC',
        departure: { city: 'Chennai', station: 'MAS', time: '06:00', date: '2026-06-01' },
        arrival:   { city: 'Bengaluru', station: 'SBC', time: '10:50', date: '2026-06-01' },
        durationMinutes: 290,
        price: 780,
        seats: 350,
        seatsAvailable: 220,
        amenities: ['Meals Included', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      },

      // ── Pune ↔ Mumbai ──
      {
        operatorName: 'Deccan Queen',
        trainNumber: '12123',
        type: 'AC',
        departure: { city: 'Pune', station: 'PUNE', time: '07:15', date: '2026-06-01' },
        arrival:   { city: 'Mumbai', station: 'CSMT', time: '10:30', date: '2026-06-01' },
        durationMinutes: 195,
        price: 350,
        seats: 450,
        seatsAvailable: 300,
        amenities: ['Pantry Car', 'Charging Point'],
        isActive: true,
        listingStatus: 'APPROVED',
        approvedAt: new Date()
      }
    ]

    const created = await prisma.train.createMany({
      data: trains,
      skipDuplicates: true
    })

    console.log(`✓ Created ${created.count} trains`)
    console.log('')
    console.log('🚆 Trains seeded:')
    trains.forEach(t => {
      console.log(`   ${t.trainNumber} | ${t.operatorName} | ${t.departure.city} → ${t.arrival.city} | ₹${t.price}`)
    })
    console.log('')
    console.log('✅ Train seed completed successfully!')

  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedTrains()
