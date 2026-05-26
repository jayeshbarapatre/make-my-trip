import prisma from '../config/prismaClient.js'
import trainSearchService from '../services/trains/trainSearchService.js'

export const searchTraines = async (req, res) => {
  try {
    const { from, to, date, type, minPrice, maxPrice, page = 1, limit = 10, search } = req.query

    // Use service layer (cache → DB)
    const allTraines = await trainSearchService.search({
      from,
      to,
      date,
      type,
      minPrice,
      maxPrice,
      search
    })

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

    if (!train.isActive) {
      return res.status(403).json({ success: false, message: 'Train not available' })
    }

    res.status(200).json({ success: true, data: train })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
