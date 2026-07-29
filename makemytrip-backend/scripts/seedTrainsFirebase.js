import { db } from '../src/config/firebase.js'

const cities = ['New Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai', 'Pune', 'Jaipur', 'Agra', 'Udaipur', 'Kochi', 'Goa', 'Lucknow', 'Patna', 'Indore']

const trainNames = [
  'Rajdhani Express', 'Shatabdi Express', 'Karnataka Express', 'Bangalore Mail',
  'Poorva Express', 'Udyan Express', 'Karwar Express', 'Konkan Kanya', 'Mandovi Express',
  'East Coast Express', 'Pink City Express', 'Taj Express', 'Howrah Mail', 'Kerala Express',
  'Mumbai Express', 'Delhi Express', 'Golden Chariot', 'Deccan Express', 'Charminar Express',
  'West Coast Express', 'South Indian Express', 'Northern Express', 'Eastern Express'
]

function generateTrains() {
  const trains = []

  for (let i = 0; i < 100; i++) {
    const fromIdx = Math.floor(Math.random() * cities.length)
    let toIdx = Math.floor(Math.random() * cities.length)
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * cities.length)

    const from = cities[fromIdx]
    const to = cities[toIdx]
    const trainName = trainNames[Math.floor(Math.random() * trainNames.length)]
    const duration = Math.floor(Math.random() * (1440 - 120)) + 120 // 2-24 hours
    const baseHour = Math.floor(Math.random() * 24)
    const departureTime = `${String(baseHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`

    const departHours = baseHour + Math.floor(duration / 60)
    const arrivalHour = departHours % 24
    const arrivalTime = `${String(arrivalHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`

    trains.push({
      trainName: `${trainName} ${i + 1}`,
      from,
      to,
      departureTime,
      arrivalTime,
      durationMinutes: duration,
      price: Math.floor(Math.random() * (5000 - 500)) + 500,
      seatsAvailable: Math.floor(Math.random() * (200 - 50)) + 50,
      trainNumber: `${12000 + i}`,
      trainClass: ['AC', 'Sleeper', 'Non-AC'][Math.floor(Math.random() * 3)],
      isActive: true
    })
  }

  return trains
}

async function seedTrainsFirebase() {
  try {
    const trains = generateTrains()
    console.log('🚂 Starting Firebase Train Seeding...')
    console.log(`📝 Total trains to add: ${trains.length}`)

    let successCount = 0
    let errorCount = 0

    for (const train of trains) {
      try {
        const trainId = `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        await db.collection('trains').doc(trainId).set({
          ...train,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        if ((successCount + 1) % 10 === 0) {
          console.log(`✅ ${successCount + 1}/${trains.length} trains added...`)
        }
        successCount++
      } catch (err) {
        console.error(`❌ Error adding train: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Successfully added: ${successCount} trains`)
    console.log(`❌ Failed: ${errorCount} trains`)
    console.log(`${'='.repeat(60)}`)
    console.log(`\n🎉 Firebase train seeding complete!`)
  } catch (err) {
    console.error('Fatal error during seeding:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

seedTrainsFirebase()
