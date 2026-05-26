import cacheService from '../services/cache/cacheService.js'
import prisma from '../config/prismaClient.js'

export const getApiHealth = async (req, res) => {
  try {
    const cacheStats = cacheService.stats()

    // Get recent bookings (last 20, last 24 hours)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const bookingLogs = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: today
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        bookingId: true,
        type: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    })

    // Count searches and bookings
    const bookingsConfirmed = await prisma.booking.count({
      where: {
        status: 'confirmed',
        createdAt: { gte: today }
      }
    })

    const bookingsFailed = await prisma.booking.count({
      where: {
        status: { not: 'confirmed' },
        createdAt: { gte: today }
      }
    })

    // Get flight/train search counts from cache
    const flightSearchCount = cacheService.getKeysByPrefix('flight:').length
    const trainSearchCount = cacheService.getKeysByPrefix('train:').length

    res.json({
      success: true,
      cacheStats: {
        ...cacheStats,
        flightSearchCount,
        trainSearchCount,
        bookingsConfirmed,
        bookingsFailed
      },
      bookingLogs: bookingLogs.map(b => ({
        bookingId: b.bookingId,
        type: b.type,
        status: b.status,
        totalAmount: b.totalAmount,
        createdAt: b.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching API health:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

export const flushCache = async (req, res) => {
  try {
    cacheService.clear()
    res.json({
      success: true,
      message: 'Cache flushed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error flushing cache:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
