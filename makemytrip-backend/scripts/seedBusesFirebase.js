import { db } from '../src/config/firebase.js'

const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Udaipur', 'Jaipur', 'Goa', 'Kochi', 'Hyderabad', 'Pune', 'Agra', 'Chennai', 'Kolkata', 'Lucknow', 'Indore', 'Ahmedabad']

const busCompanies = [
  'Rajasthan', 'Blue Dart', 'Shyam', 'SRS', 'VRL', 'Konkan', 'Goa Express', 'SeaHorse',
  'Coastal', 'Kerala', 'City', 'Tamil Nadu', 'South Indian', 'Northern', 'Eastern',
  'Golden', 'Express', 'Travels', 'Tours', 'Trans', 'Royal', 'Premium', 'Comfort'
]

const busTypes = ['AC Volvo', 'AC Sleeper', 'AC Non-Sleeper', 'Premium AC Sleeper', 'Luxury Coach', 'Semi-Sleeper']

function generateBuses() {
  const buses = []

  for (let i = 0; i < 100; i++) {
    const fromIdx = Math.floor(Math.random() * cities.length)
    let toIdx = Math.floor(Math.random() * cities.length)
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * cities.length)

    const from = cities[fromIdx]
    const to = cities[toIdx]
    const company = busCompanies[Math.floor(Math.random() * busCompanies.length)]
    const busType = busTypes[Math.floor(Math.random() * busTypes.length)]
    const duration = Math.floor(Math.random() * (720 - 120)) + 120 // 2-12 hours

    const baseHour = Math.floor(Math.random() * 24)
    const departureTime = `${String(baseHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`

    const departHours = baseHour + Math.floor(duration / 60)
    const arrivalHour = departHours % 24
    const arrivalTime = `${String(arrivalHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`

    buses.push({
      busName: `${company} Express ${i + 1}`,
      from,
      to,
      departureTime,
      arrivalTime,
      durationMinutes: duration,
      price: Math.floor(Math.random() * (2000 - 300)) + 300,
      seatsAvailable: Math.floor(Math.random() * (50 - 30)) + 30,
      busType,
      totalSeats: 50,
      isActive: true
    })
  }

  return buses
}

async function seedBusesFirebase() {
  try {
    const buses = generateBuses()
    console.log('🚌 Starting Firebase Bus Seeding...')
    console.log(`📝 Total buses to add: ${buses.length}`)

    let successCount = 0
    let errorCount = 0

    for (const bus of buses) {
      try {
        const busId = `bus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        await db.collection('buses').doc(busId).set({
          ...bus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        if ((successCount + 1) % 10 === 0) {
          console.log(`✅ ${successCount + 1}/${buses.length} buses added...`)
        }
        successCount++
      } catch (err) {
        console.error(`❌ Error adding bus: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Successfully added: ${successCount} buses`)
    console.log(`❌ Failed: ${errorCount} buses`)
    console.log(`${'='.repeat(60)}`)
    console.log(`\n🎉 Firebase bus seeding complete!`)
  } catch (err) {
    console.error('Fatal error during seeding:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

seedBusesFirebase()
