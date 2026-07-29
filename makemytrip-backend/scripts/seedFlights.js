import 'dotenv/config'
import prisma from '../src/config/prismaClient.js'

const seedFlights = async () => {
  console.log('🌱 Starting flight seed...')

  try {
    await prisma.flight.deleteMany({})
    console.log('✓ Cleared existing flights')

    const dummyFlights = [
      {
        airline: 'IndiGo',
        flightNumber: '6E-101',
        departure: { city: 'New Delhi', airport: 'DEL', time: '06:00', date: '2026-06-01' },
        arrival: { city: 'Bengaluru', airport: 'BLR', time: '08:30', date: '2026-06-01' },
        duration: '2h 30m',
        price: 5400,
        seats: 180,
        seatsAvailable: 150,
        baggage: 15,
        stops: 0,
        aircraft: 'Airbus A320',
        image: '/images/flights/flight-airplane-800.webp',
        isActive: true
      },
      {
        airline: 'Air India',
        flightNumber: 'AI-302',
        departure: { city: 'Mumbai', airport: 'BOM', time: '09:15', date: '2026-06-01' },
        arrival: { city: 'Chennai', airport: 'MAA', time: '11:10', date: '2026-06-01' },
        duration: '1h 55m',
        price: 4200,
        seats: 150,
        seatsAvailable: 120,
        baggage: 20,
        stops: 0,
        aircraft: 'Boeing 737',
        image: '/images/flights/flight-runway-800.webp',
        isActive: true
      },
      {
        airline: 'Vistara',
        flightNumber: 'UK-811',
        departure: { city: 'Bengaluru', airport: 'BLR', time: '14:00', date: '2026-06-01' },
        arrival: { city: 'New Delhi', airport: 'DEL', time: '16:45', date: '2026-06-01' },
        duration: '2h 45m',
        price: 6100,
        seats: 160,
        seatsAvailable: 90,
        baggage: 15,
        stops: 0,
        aircraft: 'Airbus A321',
        image: '/images/flights/flight-jetbridge-800.webp',
        isActive: true
      },
      {
        airline: 'SpiceJet',
        flightNumber: 'SG-505',
        departure: { city: 'Kolkata', airport: 'CCU', time: '07:30', date: '2026-06-01' },
        arrival: { city: 'Hyderabad', airport: 'HYD', time: '09:40', date: '2026-06-01' },
        duration: '2h 10m',
        price: 3800,
        seats: 180,
        seatsAvailable: 170,
        baggage: 15,
        stops: 0,
        aircraft: 'Boeing 737',
        image: '/images/flights/flight-cabin-800.webp',
        isActive: true
      },
      {
        airline: 'Akasa Air',
        flightNumber: 'QP-1201',
        departure: { city: 'Ahmedabad', airport: 'AMD', time: '18:00', date: '2026-06-01' },
        arrival: { city: 'Mumbai', airport: 'BOM', time: '19:15', date: '2026-06-01' },
        duration: '1h 15m',
        price: 2900,
        seats: 189,
        seatsAvailable: 180,
        baggage: 15,
        stops: 0,
        aircraft: 'Boeing 737 Max',
        image: '/images/flights/flight-terminal-800.webp',
        isActive: true
      },
      {
        airline: 'Air India Express',
        flightNumber: 'IX-202',
        departure: { city: 'Kochi', airport: 'COK', time: '10:30', date: '2026-06-01' },
        arrival: { city: 'New Delhi', airport: 'DEL', time: '13:50', date: '2026-06-01' },
        duration: '3h 20m',
        price: 7200,
        seats: 186,
        seatsAvailable: 50,
        baggage: 20,
        stops: 0,
        aircraft: 'Boeing 737',
        image: '/images/flights/flight-boarding-gate-800.webp',
        isActive: true
      },
      {
        airline: 'IndiGo',
        flightNumber: '6E-309',
        departure: { city: 'Pune', airport: 'PNQ', time: '20:10', date: '2026-06-01' },
        arrival: { city: 'Bengaluru', airport: 'BLR', time: '21:30', date: '2026-06-01' },
        duration: '1h 20m',
        price: 3100,
        seats: 180,
        seatsAvailable: 20,
        baggage: 15,
        stops: 0,
        aircraft: 'Airbus A320',
        image: '/images/flights/flight-passenger-800.webp',
        isActive: true
      },
      {
        airline: 'Vistara',
        flightNumber: 'UK-902',
        departure: { city: 'New Delhi', airport: 'DEL', time: '11:00', date: '2026-06-01' },
        arrival: { city: 'Goa', airport: 'GOI', time: '13:30', date: '2026-06-01' },
        duration: '2h 30m',
        price: 8500,
        seats: 160,
        seatsAvailable: 10,
        baggage: 15,
        stops: 0,
        aircraft: 'Airbus A320neo',
        image: '/images/flights/flight-terminal-window-800.webp',
        isActive: true
      },
      {
        airline: 'Air India',
        flightNumber: 'AI-111',
        departure: { city: 'Hyderabad', airport: 'HYD', time: '05:45', date: '2026-06-01' },
        arrival: { city: 'Mumbai', airport: 'BOM', time: '07:15', date: '2026-06-01' },
        duration: '1h 30m',
        price: 3600,
        seats: 150,
        seatsAvailable: 130,
        baggage: 20,
        stops: 0,
        aircraft: 'Airbus A319',
        image: '/images/flights/flight-cabin-aisle-800.webp',
        isActive: true
      },
      {
        airline: 'SpiceJet',
        flightNumber: 'SG-222',
        departure: { city: 'Chennai', airport: 'MAA', time: '15:20', date: '2026-06-01' },
        arrival: { city: 'Kolkata', airport: 'CCU', time: '17:40', date: '2026-06-01' },
        duration: '2h 20m',
        price: 4800,
        seats: 180,
        seatsAvailable: 160,
        baggage: 15,
        stops: 0,
        aircraft: 'Boeing 737',
        image: '/images/flights/flight-airplane-800.webp',
        isActive: true
      },
      {
        airline: 'Air India',
        flightNumber: 'AI-405',
        departure: { city: 'New Delhi', airport: 'DEL', time: '15:30', date: '2026-06-02' },
        arrival: { city: 'Mumbai', airport: 'BOM', time: '17:45', date: '2026-06-02' },
        duration: '2h 15m',
        price: 5800,
        seats: 170,
        seatsAvailable: 100,
        baggage: 20,
        stops: 0,
        aircraft: 'Airbus A321',
        image: '/images/flights/flight-runway-800.webp',
        isActive: true
      },
      {
        airline: 'Vistara',
        flightNumber: 'UK-923',
        departure: { city: 'Bengaluru', airport: 'BLR', time: '11:00', date: '2026-06-02' },
        arrival: { city: 'Chennai', airport: 'MAA', time: '12:15', date: '2026-06-02' },
        duration: '1h 15m',
        price: 2400,
        seats: 140,
        seatsAvailable: 80,
        baggage: 15,
        stops: 0,
        aircraft: 'Airbus A320',
        image: '/images/flights/flight-jetbridge-800.webp',
        isActive: true
      },
      {
        airline: 'SpiceJet',
        flightNumber: 'SG-608',
        departure: { city: 'Mumbai', airport: 'BOM', time: '13:20', date: '2026-06-02' },
        arrival: { city: 'Hyderabad', airport: 'HYD', time: '15:00', date: '2026-06-02' },
        duration: '1h 40m',
        price: 3200,
        seats: 180,
        seatsAvailable: 140,
        baggage: 15,
        stops: 0,
        aircraft: 'Boeing 737',
        image: '/images/flights/flight-cabin-800.webp',
        isActive: true
      },
      {
        airline: 'IndiGo',
        flightNumber: '6E-710',
        departure: { city: 'Hyderabad', airport: 'HYD', time: '08:15', date: '2026-06-02' },
        arrival: { city: 'Kolkata', airport: 'CCU', time: '10:45', date: '2026-06-02' },
        duration: '2h 30m',
        price: 4900,
        seats: 180,
        seatsAvailable: 110,
        baggage: 15,
        stops: 0,
        aircraft: 'Airbus A320',
        image: '/images/flights/flight-terminal-800.webp',
        isActive: true
      },
      {
        airline: 'Akasa Air',
        flightNumber: 'QP-1350',
        departure: { city: 'Chennai', airport: 'MAA', time: '19:30', date: '2026-06-02' },
        arrival: { city: 'New Delhi', airport: 'DEL', time: '22:00', date: '2026-06-02' },
        duration: '2h 30m',
        price: 6500,
        seats: 189,
        seatsAvailable: 70,
        baggage: 15,
        stops: 0,
        aircraft: 'Boeing 737 Max',
        image: '/images/flights/flight-boarding-gate-800.webp',
        isActive: true
      },
      {
        airline: 'Air India Express',
        flightNumber: 'IX-315',
        departure: { city: 'Goa', airport: 'GOI', time: '09:45', date: '2026-06-02' },
        arrival: { city: 'Mumbai', airport: 'BOM', time: '11:00', date: '2026-06-02' },
        duration: '1h 15m',
        price: 2100,
        seats: 186,
        seatsAvailable: 160,
        baggage: 20,
        stops: 0,
        aircraft: 'Boeing 737',
        image: '/images/flights/flight-passenger-800.webp',
        isActive: true
      },
      {
        airline: 'Vistara',
        flightNumber: 'UK-1024',
        departure: { city: 'Jaipur', airport: 'JAI', time: '16:00', date: '2026-06-02' },
        arrival: { city: 'New Delhi', airport: 'DEL', time: '17:15', date: '2026-06-02' },
        duration: '1h 15m',
        price: 1800,
        seats: 160,
        seatsAvailable: 130,
        baggage: 15,
        stops: 0,
        aircraft: 'Airbus A320',
        image: '/images/flights/flight-terminal-window-800.webp',
        isActive: true
      },
      {
        airline: 'SpiceJet',
        flightNumber: 'SG-712',
        departure: { city: 'Pune', airport: 'PNQ', time: '12:30', date: '2026-06-03' },
        arrival: { city: 'Mumbai', airport: 'BOM', time: '13:20', date: '2026-06-03' },
        duration: '50m',
        price: 1500,
        seats: 180,
        seatsAvailable: 155,
        baggage: 15,
        stops: 0,
        aircraft: 'Boeing 737',
        image: '/images/flights/flight-cabin-aisle-800.webp',
        isActive: true
      }
    ]

    const created = await prisma.flight.createMany({
      data: dummyFlights,
      skipDuplicates: true
    })

    console.log(`✓ Created ${created.count} flights`)
    console.log('✅ Flight seed completed successfully')

  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedFlights()
