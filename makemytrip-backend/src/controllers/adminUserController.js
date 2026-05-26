import prisma from '../config/prismaClient.js'

export const getAllUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = search
      ? {
          is_admin: false,
          is_vendor: false,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
          ]
        }
      : { is_admin: false, is_vendor: false }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { bookings: true } }
        }
      }),
      prisma.user.count({ where })
    ])

    res.json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (err) {
    console.error('Get all users error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await prisma.user.delete({ where: { id } })
    res.json({ success: true, message: 'User deleted successfully' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            bookingId: true,
            type: true,
            fromCity: true,
            toCity: true,
            departureDate: true,
            totalAmount: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ success: true, data: user })
  } catch (err) {
    console.error('Get user details error:', err)
    res.status(500).json({ message: err.message })
  }
}
