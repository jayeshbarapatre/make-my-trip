import prisma from '../config/prismaClient.js'

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFlights,
      totalHotels,
      totalBookings,
      activeFlights,
      activeHotels,
      flightBookings,
      hotelBookings,
      busBookings,
      cabBookings,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.flight.count(),
      prisma.hotel.count(),
      prisma.booking.count(),
      prisma.flight.count({ where: { isActive: true } }),
      prisma.hotel.count({ where: { isActive: true } }),
      prisma.booking.count({ where: { type: 'flight' } }),
      prisma.booking.count({ where: { type: 'hotel' } }),
      prisma.booking.count({ where: { type: 'bus' } }),
      prisma.booking.count({ where: { type: 'cab' } }),
      prisma.booking.aggregate({ _sum: { totalAmount: true } })
    ])

    res.json({
      data: {
        summary: {
          totalUsers,
          totalBookings,
          totalFlights,
          totalHotels,
          totalRevenue: totalRevenue._sum.totalAmount || 0
        },
        active: {
          activeFlights,
          inactiveFlights: totalFlights - activeFlights,
          activeHotels,
          inactiveHotels: totalHotels - activeHotels
        },
        bookingsBreakdown: {
          flight: flightBookings,
          hotel: hotelBookings,
          bus: busBookings,
          cab: cabBookings
        }
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getRevenueData = async (req, res) => {
  try {
    const last12Months = []
    const revenueMap = {}

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      last12Months.push(monthName)
      revenueMap[monthKey] = 0
    }

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 11)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    const aggregatedRevenue = await prisma.booking.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' }
      },
      _sum: { totalAmount: true },
      _count: true
    })

    const bookingsByMonth = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'cancelled' }
      },
      select: { createdAt: true, totalAmount: true }
    })

    bookingsByMonth.forEach(booking => {
      const monthKey = `${booking.createdAt.getFullYear()}-${String(booking.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (revenueMap.hasOwnProperty(monthKey)) {
        revenueMap[monthKey] += booking.totalAmount || 0
      }
    })

    const revenues = Object.values(revenueMap)

    res.json({
      data: {
        labels: last12Months,
        revenues,
        total: aggregatedRevenue._sum.totalAmount || 0,
        count: aggregatedRevenue._count
      }
    })
  } catch (err) {
    console.error('Revenue data error:', err)
    res.status(500).json({ message: 'Failed to fetch revenue data' })
  }
}

export const getRecentBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })

    res.json({
      data: {
        bookings: bookings.map(b => ({
          id: b.id,
          userName: b.user?.name || 'Unknown',
          email: b.user?.email || 'N/A',
          type: b.type,
          amount: b.totalAmount,
          status: b.status,
          date: b.createdAt
        }))
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAvailabilityStats = async (req, res) => {
  try {
    const flights = await prisma.flight.aggregate({
      _sum: { seatsAvailable: true, seats: true }
    })

    res.json({
      data: {
        flights: {
          available: flights._sum?.seatsAvailable || 0,
          total: flights._sum?.seats || 0
        }
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
