import prisma from '../config/prismaClient.js'

export const searchCabs = async (req, res) => {
  try {
    const { from, to, date, type, minPrice, maxPrice, page = 1, limit = 10, search } = req.query

    let where = { isActive: true }
    if (type) where.type = type

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { serviceName: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ]
    }

    const db = req.mockPrisma || prisma
    let allCabs = await db.cab.findMany({
      where,
      orderBy: { price: 'asc' }
    })

    // Filter by location (from/to) in memory
    if (from) {
      allCabs = allCabs.filter(c => {
        const dep = c.from || ''
        return dep.toLowerCase().includes(from.toLowerCase())
      })
    }
    if (to) {
      allCabs = allCabs.filter(c => {
        const arr = c.to || ''
        return arr.toLowerCase().includes(to.toLowerCase())
      })
    }

    const skip = (Number(page) - 1) * Number(limit)
    const paginatedCabs = allCabs.slice(skip, skip + Number(limit))

    res.status(200).json({
      success: true,
      data: paginatedCabs,
      pagination: {
        total: allCabs.length,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(allCabs.length / Number(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getCabById = async (req, res) => {
  try {
    const db = req.mockPrisma || prisma
    const cab = await db.cab.findUnique({ where: { id: req.params.id } })

    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }

    if (!cab.isActive) {
      return res.status(403).json({ success: false, message: 'Cab not available' })
    }

    res.status(200).json({ success: true, data: cab })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
