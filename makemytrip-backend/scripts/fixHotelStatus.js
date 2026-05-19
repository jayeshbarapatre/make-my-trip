import prisma from '../src/config/prismaClient.js'

async function fixHotelStatus() {
  try {
    console.log('🔧 Fixing hotel status...')

    // Update all hotels to have isActive: true if they don't already
    const result = await prisma.hotel.updateMany({
      where: {
        isActive: {
          not: true
        }
      },
      data: {
        isActive: true
      }
    })

    console.log(`✅ Updated ${result.count} hotels to isActive: true`)

    // Verify the fix
    const activeHotels = await prisma.hotel.findMany({
      where: { isActive: true }
    })

    console.log(`📊 Total active hotels: ${activeHotels.length}`)
    activeHotels.forEach(h => {
      console.log(`   - ${h.name} (${h.city})`)
    })

    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

fixHotelStatus()
