import prisma from '../config/prismaClient.js'

export const searchTraines = async (req, res) => {
  try {
    const { from, to, date, type, minPrice, maxPrice, page = 1, limit = 10, search } = req.query

    let where = { isActive: true, listingStatus: 'APPROVED' }

    if (from) {
      where.departure = { path: ['city'], string_contains: from }
    }
    if (to) {
      where.arrival = { path: ['city'], string_contains: to }
    }
    if (type) where.type = type
    
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.OR = [
        { operatorName: { contains: search, mode: 'insensitive' } },
        { trainNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    // In Prisma, filtering JSON fields strongly in PostgreSQL requires raw queries or specific json operations.
    // Since from and to are JSON fields ({ city, time }), we use stringification or raw.
    // For simplicity, we can fetch all approved and do an in-memory filter if complex, but let's try the basic where if possible.
    // Actually Prisma supports JSON filtering in Postgres!
    // But since it's simpler, let's just fetch them and filter if needed, or use the basic Prisma where.
    // To be safe with JSON in Prisma:
    // departure: { equals: ... } is strict. We will fetch and filter if from/to are passed, or use a raw query.
    // Given the small scale, let's just use Prisma where without deep JSON matching, and filter in memory for JSON parts.

    // A better approach for JSON search in Prisma:
    // We will do a basic query and filter the JSON fields in JS.
    let baseWhere = { isActive: true, listingStatus: 'APPROVED' }
    if (type) baseWhere.type = type
    if (minPrice || maxPrice) {
      baseWhere.price = {}
      if (minPrice) baseWhere.price.gte = parseFloat(minPrice)
      if (maxPrice) baseWhere.price.lte = parseFloat(maxPrice)
    }
    if (search) {
      baseWhere.OR = [
        { operatorName: { contains: search, mode: 'insensitive' } },
        { trainNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    let allTraines = await prisma.train.findMany({
      where: baseWhere,
      orderBy: { price: 'asc' }
    })

    if (from) {
      allTraines = allTraines.filter(b => b.departure?.city?.toLowerCase().includes(from.toLowerCase()))
    }
    if (to) {
      allTraines = allTraines.filter(b => b.arrival?.city?.toLowerCase().includes(to.toLowerCase()))
    }

    const skip = (Number(page) - 1) * Number(limit)
    const paginatedTraines = allTraines.slice(skip, skip + Number(limit))

    res.status(200).json({
      success: true,
      data: paginatedTraines,
      pagination: {
        total: allTraines.length,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(allTraines.length / Number(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getTrainById = async (req, res) => {
  try {
    const train = await prisma.train.findUnique({ where: { id: req.params.id } })

    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' })
    }

    if (!train.isActive || train.listingStatus !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Train not available' })
    }

    res.status(200).json({ success: true, data: train })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
