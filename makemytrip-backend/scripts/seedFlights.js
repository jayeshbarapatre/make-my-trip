import 'dotenv/config'
import prisma from '../src/config/prismaClient.js'

const seedFlights = async () => {
  try {
    console.log('🌱 Seeding flights...')

    await prisma.flight.deleteMany({})
    console.log('🗑️  Cleared existing flights')

    const flights = [
      { airline: 'Air India', flightNumber: 'AI101', departure: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '06:00' }), arrival: JSON.stringify({ city: 'Mumbai', airport: 'BOM', time: '08:30' }), duration: '2h 30m', price: 3999, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 15, isActive: true },
      { airline: 'IndiGo', flightNumber: 'IG102', departure: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '08:15' }), arrival: JSON.stringify({ city: 'Bengaluru', airport: 'BLR', time: '10:45' }), duration: '2h 45m', price: 4500, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'SpiceJet', flightNumber: 'SG103', departure: JSON.stringify({ city: 'Mumbai', airport: 'BOM', time: '07:30' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '09:45' }), duration: '2h 15m', price: 3500, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 15, isActive: true },
      { airline: 'Vistara', flightNumber: 'UK104', departure: JSON.stringify({ city: 'Bengaluru', airport: 'BLR', time: '09:00' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '11:30' }), duration: '2h 30m', price: 5200, seats: 180, stops: 0, aircraft: 'Boeing 787', baggage: 20, isActive: true },
      { airline: 'Air India', flightNumber: 'AI105', departure: JSON.stringify({ city: 'Chennai', airport: 'MAA', time: '10:15' }), arrival: JSON.stringify({ city: 'Mumbai', airport: 'BOM', time: '13:00' }), duration: '2h 45m', price: 4200, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'IndiGo', flightNumber: 'IG106', departure: JSON.stringify({ city: 'Hyderabad', airport: 'HYD', time: '11:00' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '13:15' }), duration: '2h 15m', price: 4100, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'Air India Express', flightNumber: 'IX107', departure: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '14:00' }), arrival: JSON.stringify({ city: 'Goa', airport: 'GOI', time: '16:30' }), duration: '2h 30m', price: 2999, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 10, isActive: true },
      { airline: 'SpiceJet', flightNumber: 'SG108', departure: JSON.stringify({ city: 'Pune', airport: 'PNQ', time: '12:30' }), arrival: JSON.stringify({ city: 'Mumbai', airport: 'BOM', time: '13:45' }), duration: '1h 15m', price: 1999, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'Vistara', flightNumber: 'UK109', departure: JSON.stringify({ city: 'Jaipur', airport: 'JAI', time: '16:00' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '17:15' }), duration: '1h 15m', price: 2499, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'Air India', flightNumber: 'AI110', departure: JSON.stringify({ city: 'Bengaluru', airport: 'BLR', time: '10:00' }), arrival: JSON.stringify({ city: 'Ahmedabad', airport: 'AMD', time: '12:30' }), duration: '2h 30m', price: 4800, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 15, isActive: true },
      { airline: 'IndiGo', flightNumber: 'IG111', departure: JSON.stringify({ city: 'Ahmedabad', airport: 'AMD', time: '08:30' }), arrival: JSON.stringify({ city: 'Bengaluru', airport: 'BLR', time: '11:00' }), duration: '2h 30m', price: 4200, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'SpiceJet', flightNumber: 'SG112', departure: JSON.stringify({ city: 'Kolkata', airport: 'CCU', time: '05:45' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '08:30' }), duration: '2h 45m', price: 3800, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 15, isActive: true },
      { airline: 'Vistara', flightNumber: 'UK113', departure: JSON.stringify({ city: 'Mumbai', airport: 'BOM', time: '18:00' }), arrival: JSON.stringify({ city: 'Bengaluru', airport: 'BLR', time: '20:00' }), duration: '2h', price: 3999, seats: 180, stops: 0, aircraft: 'Boeing 787', baggage: 20, isActive: true },
      { airline: 'Air India Express', flightNumber: 'IX114', departure: JSON.stringify({ city: 'Hyderabad', airport: 'HYD', time: '12:00' }), arrival: JSON.stringify({ city: 'Chennai', airport: 'MAA', time: '13:30' }), duration: '1h 30m', price: 2500, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 10, isActive: true },
      { airline: 'IndiGo', flightNumber: 'IG115', departure: JSON.stringify({ city: 'Pune', airport: 'PNQ', time: '14:00' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '16:00' }), duration: '2h', price: 3200, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'Air India', flightNumber: 'AI116', departure: JSON.stringify({ city: 'Goa', airport: 'GOI', time: '17:00' }), arrival: JSON.stringify({ city: 'Mumbai', airport: 'BOM', time: '18:30' }), duration: '1h 30m', price: 3500, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'SpiceJet', flightNumber: 'SG117', departure: JSON.stringify({ city: 'Bengaluru', airport: 'BLR', time: '07:00' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '09:30' }), duration: '2h 30m', price: 3600, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 15, isActive: true },
      { airline: 'Vistara', flightNumber: 'UK118', departure: JSON.stringify({ city: 'Chennai', airport: 'MAA', time: '19:00' }), arrival: JSON.stringify({ city: 'Bengaluru', airport: 'BLR', time: '20:30' }), duration: '1h 30m', price: 2800, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true },
      { airline: 'Air India Express', flightNumber: 'IX119', departure: JSON.stringify({ city: 'Jaipur', airport: 'JAI', time: '09:00' }), arrival: JSON.stringify({ city: 'Mumbai', airport: 'BOM', time: '11:30' }), duration: '2h 30m', price: 3100, seats: 180, stops: 0, aircraft: 'Boeing 737', baggage: 10, isActive: true },
      { airline: 'IndiGo', flightNumber: 'IG120', departure: JSON.stringify({ city: 'Ahmedabad', airport: 'AMD', time: '15:00' }), arrival: JSON.stringify({ city: 'New Delhi', airport: 'DEL', time: '17:00' }), duration: '2h', price: 3700, seats: 180, stops: 0, aircraft: 'Airbus A320', baggage: 15, isActive: true }
    ]

    for (const flight of flights) {
      await prisma.flight.create({ data: { ...flight, seatsAvailable: 180 } })
    }

    console.log(`✅ Seeded ${flights.length} flights`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed error:', err.message)
    process.exit(1)
  }
}

seedFlights()
