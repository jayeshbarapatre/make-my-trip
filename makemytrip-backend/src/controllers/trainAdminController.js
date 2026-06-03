import prisma from '../config/prismaClient.js'

export const createTrain = async (req, res) => {
  try {
    const { operatorName, trainNumber, type, departure, arrival, durationMinutes, price, seats, amenities, image } = req.body

    if (!operatorName || !trainNumber || !type || !departure || !arrival || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const existing = await prisma.train.findUnique({ where: { trainNumber } })
    if (existing) {
      return res.status(409).json({ message: 'Train number already exists' })
    }

    const train = await prisma.train.create({
      data: {
        operatorName,
        trainNumber,
        type,
        departure: departure || {},
        arrival: arrival || {},
        durationMinutes: parseInt(durationMinutes) || 0,
        price: parseFloat(price),
        seats: parseInt(seats) || 45,
        seatsAvailable: parseInt(seats) || 45,
        amenities: amenities || [],
        image: image || null,
        isActive: true
      }
    })

    res.status(201).json({ message: 'Train created successfully', data: { train } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAllTraines = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const query = {}

    if (search) {
      query.OR = [
        { operatorName: { contains: search, mode: 'insensitive' } },
        { trainNumber: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (type) query.type = type
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    const total = await prisma.train.count({ where: query })
    const traines = await prisma.train.findMany({
      where: query,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      data: { traines, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getTrainById = async (req, res) => {
  try {
    const train = await prisma.train.findUnique({ where: { id: req.params.id } })
    if (!train) {
      return res.status(404).json({ message: 'Train not found' })
    }
    res.json({ data: { train } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateTrain = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const trainExists = await prisma.train.findUnique({ where: { id } })
    if (!trainExists) {
      return res.status(404).json({ message: 'Train not found' })
    }

    if (updates.trainNumber && updates.trainNumber !== trainExists.trainNumber) {
      const existing = await prisma.train.findUnique({ where: { trainNumber: updates.trainNumber } })
      if (existing) {
        return res.status(409).json({ message: 'Train number already exists' })
      }
    }

    const train = await prisma.train.update({
      where: { id },
      data: {
        operatorName: updates.operatorName,
        trainNumber: updates.trainNumber,
        type: updates.type,
        departure: updates.departure,
        arrival: updates.arrival,
        durationMinutes: updates.durationMinutes ? parseInt(updates.durationMinutes) : undefined,
        price: updates.price ? parseFloat(updates.price) : undefined,
        seats: updates.seats ? parseInt(updates.seats) : undefined,
        seatsAvailable: updates.seatsAvailable ? parseInt(updates.seatsAvailable) : undefined,
        amenities: updates.amenities,
        image: updates.image,
        listingStatus: updates.listingStatus,
        rejectionReason: updates.rejectionReason,
        isActive: updates.isActive
      }
    })

    res.json({ message: 'Train updated successfully', data: { train } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteTrain = async (req, res) => {
  try {
    const train = await prisma.train.findUnique({ where: { id: req.params.id } })
    if (!train) {
      return res.status(404).json({ message: 'Train not found' })
    }
    await prisma.train.delete({ where: { id: req.params.id } })
    res.json({ message: 'Train deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const toggleTrainStatus = async (req, res) => {
  try {
    const train = await prisma.train.findUnique({ where: { id: req.params.id } })
    if (!train) {
      return res.status(404).json({ message: 'Train not found' })
    }
    const updatedTrain = await prisma.train.update({
      where: { id: req.params.id },
      data: { isActive: !train.isActive }
    })
    res.json({ message: `Train ${updatedTrain.isActive ? 'activated' : 'deactivated'}`, data: { train: updatedTrain } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
