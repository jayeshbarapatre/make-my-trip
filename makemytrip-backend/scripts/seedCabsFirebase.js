import { db } from '../src/config/firebase.js'

const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Udaipur', 'Jaipur', 'Goa', 'Kochi', 'Hyderabad', 'Pune', 'Agra', 'Chennai', 'Kolkata']

const locations = ['Airport', 'City Center', 'Hotel', 'Railway Station', 'Bus Stand', 'Beach', 'Market', 'Park']

const cabTypes = ['Economy', 'Premium', 'Luxury', 'SUV', 'Mini', 'XL']

const driverNames = [
  'Rajesh Kumar', 'Amit Singh', 'Vikas Patel', 'Suresh Verma', 'Ramesh Gupta',
  'Arjun Nair', 'Harish Reddy', 'Mohammed Ali', 'Anil Sharma', 'Pradeep Kumar',
  'Vikram Singh', 'Rajesh Nair', 'Lokesh Rao', 'Santhosh Kumar', 'Manoj Singh',
  'Nithish Reddy', 'Peter Pereira', 'John Fernandes', 'Antonio D\'Souza', 'Ravi Singh',
  'Naveen Kumar', 'Ashok Sharma', 'Deepak Verma', 'Sandeep Patel', 'Rajendra Singh'
]

function generateCabs() {
  const cabs = []

  for (let i = 0; i < 100; i++) {
    const cityIdx = Math.floor(Math.random() * cities.length)
    const city = cities[cityIdx]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const cabType = cabTypes[Math.floor(Math.random() * cabTypes.length)]
    const driver = driverNames[Math.floor(Math.random() * driverNames.length)]

    const priceMap = {
      'Economy': Math.floor(Math.random() * (100 - 30)) + 30,
      'Premium': Math.floor(Math.random() * (250 - 100)) + 100,
      'Luxury': Math.floor(Math.random() * (500 - 250)) + 250,
      'SUV': Math.floor(Math.random() * (350 - 150)) + 150,
      'Mini': Math.floor(Math.random() * (80 - 40)) + 40,
      'XL': Math.floor(Math.random() * (200 - 100)) + 100
    }

    const capacityMap = {
      'Economy': 4,
      'Premium': 4,
      'Luxury': 4,
      'SUV': 6,
      'Mini': 3,
      'XL': 8
    }

    cabs.push({
      from: city,
      to: location,
      type: cabType,
      price: priceMap[cabType],
      capacity: capacityMap[cabType],
      available: Math.random() > 0.2, // 80% available
      estimatedTime: `${Math.floor(Math.random() * 20) + 5}-${Math.floor(Math.random() * 10) + 15} mins`,
      driver: `${driver} ${i}`,
      rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      vehicleNumber: `DL-${Math.floor(Math.random() * 9000) + 1000}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
      isActive: true
    })
  }

  return cabs
}

async function seedCabsFirebase() {
  try {
    const cabs = generateCabs()
    console.log('🚖 Starting Firebase Cab Seeding...')
    console.log(`📝 Total cabs to add: ${cabs.length}`)

    let successCount = 0
    let errorCount = 0

    for (const cab of cabs) {
      try {
        const cabId = `cab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        await db.collection('cabs').doc(cabId).set({
          ...cab,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })

        if ((successCount + 1) % 10 === 0) {
          console.log(`✅ ${successCount + 1}/${cabs.length} cabs added...`)
        }
        successCount++
      } catch (err) {
        console.error(`❌ Error adding cab: ${err.message}`)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ Successfully added: ${successCount} cabs`)
    console.log(`❌ Failed: ${errorCount} cabs`)
    console.log(`${'='.repeat(60)}`)
    console.log(`\n🎉 Firebase cab seeding complete!`)
  } catch (err) {
    console.error('Fatal error during seeding:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

seedCabsFirebase()
