import prisma from '../config/prismaClient.js'

export const createBus = async (req, res) => {
  try {
    const { operatorName, busNumber, type, departure, arrival, durationMinutes, price, seats, amenities, image } = req.body

    if (!operatorName || !busNumber || !type || !departure || !arrival || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const existing = await prisma.bus.findUnique({ where: { busNumber } })
    if (existing) {
      return res.status(409).json({ message: 'Bus number already exists' })
    }

    const bus = await prisma.bus.create({
      data: {
        operatorName,
        busNumber,
        type,
        departure: departure || {},
        arrival: arrival || {},
        durationMinutes: parseInt(durationMinutes) || 0,
        price: parseFloat(price),
        seats: parseInt(seats) || 45,
        seatsAvailable: parseInt(seats) || 45,
        amenities: amenities || [],
        image: image || null,
        listingStatus: 'APPROVED' // Admins can create approved directly
      }
    })

    res.status(201).json({ message: 'Bus created successfully', data: { bus } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAllBuses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const query = {}
    
    if (search) {
      query.OR = [
        { operatorName: { contains: search, mode: 'insensitive' } },
        { busNumber: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (type) query.type = type
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    const total = await prisma.bus.count({ where: query })
    const buses = await prisma.bus.findMany({
      where: query,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      data: { buses, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getBusById = async (req, res) => {
  try {
    const bus = await prisma.bus.findUnique({ where: { id: req.params.id } })
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }
    res.json({ data: { bus } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateBus = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const busExists = await prisma.bus.findUnique({ where: { id } })
    if (!busExists) {
      return res.status(404).json({ message: 'Bus not found' })
    }

    if (updates.busNumber && updates.busNumber !== busExists.busNumber) {
      const existing = await prisma.bus.findUnique({ where: { busNumber: updates.busNumber } })
      if (existing) {
        return res.status(409).json({ message: 'Bus number already exists' })
      }
    }

    const bus = await prisma.bus.update({
      where: { id },
      data: {
        operatorName: updates.operatorName,
        busNumber: updates.busNumber,
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

    res.json({ message: 'Bus updated successfully', data: { bus } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteBus = async (req, res) => {
  try {
    const bus = await prisma.bus.findUnique({ where: { id: req.params.id } })
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }
    await prisma.bus.delete({ where: { id: req.params.id } })
    res.json({ message: 'Bus deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const toggleBusStatus = async (req, res) => {
  try {
    const bus = await prisma.bus.findUnique({ where: { id: req.params.id } })
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }
    const updatedBus = await prisma.bus.update({
      where: { id: req.params.id },
      data: { isActive: !bus.isActive }
    })
    res.json({ message: `Bus ${updatedBus.isActive ? 'activated' : 'deactivated'}`, data: { bus: updatedBus } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
