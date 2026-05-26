import prisma from '../config/prismaClient.js'

export const createCab = async (req, res) => {
  try {
    const { operatorName, cabNumber, type, baseFare, perKmRate, perMinuteRate, location, currentCity, cabs, image } = req.body

    if (!operatorName || !cabNumber || !type || !baseFare || !perKmRate || !perMinuteRate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const cab = await prisma.cab.create({
      data: {
        operatorName,
        cabNumber,
        type,
        baseFare: parseFloat(baseFare),
        perKmRate: parseFloat(perKmRate),
        perMinuteRate: parseFloat(perMinuteRate),
        location,
        currentCity,
        cabs: parseInt(cabs) || 20,
        cabsAvailable: parseInt(cabs) || 20,
        image,
        listingStatus: 'APPROVED' // Admins can create pre-approved cabs
      }
    })

    res.status(201).json({ success: true, message: 'Cab created successfully', data: { cab } })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Cab number already exists' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getAllCabs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = {}
    if (search) {
      where.OR = [
        { operatorName: { contains: search, mode: 'insensitive' } },
        { cabNumber: { contains: search, mode: 'insensitive' } },
        { currentCity: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (type) where.type = type
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const total = await prisma.cab.count({ where })
    const cabs = await prisma.cab.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: { cabs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const getCabById = async (req, res) => {
  try {
    const cab = await prisma.cab.findUnique({ where: { id: req.params.id } })
    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }
    res.json({ success: true, data: { cab } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const updateCab = async (req, res) => {
  try {
    const { id } = req.params
    const { operatorName, cabNumber, type, baseFare, perKmRate, perMinuteRate, location, currentCity, cabs, image } = req.body

    const data = {}
    if (operatorName !== undefined) data.operatorName = operatorName
    if (cabNumber !== undefined) data.cabNumber = cabNumber
    if (type !== undefined) data.type = type
    if (baseFare !== undefined) data.baseFare = parseFloat(baseFare)
    if (perKmRate !== undefined) data.perKmRate = parseFloat(perKmRate)
    if (perMinuteRate !== undefined) data.perMinuteRate = parseFloat(perMinuteRate)
    if (location !== undefined) data.location = location
    if (currentCity !== undefined) data.currentCity = currentCity
    if (cabs !== undefined) data.cabs = parseInt(cabs)
    if (image !== undefined) data.image = image

    const cab = await prisma.cab.update({
      where: { id },
      data
    })

    res.json({ success: true, message: 'Cab updated successfully', data: { cab } })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

export const deleteCab = async (req, res) => {
  try {
    await prisma.cab.delete({ where: { id: req.params.id } })
    res.json({ success: true, message: 'Cab deleted successfully' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

export const toggleCabStatus = async (req, res) => {
  try {
    const { id } = req.params
    const cab = await prisma.cab.findUnique({ where: { id } })
    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }
    
    const updatedCab = await prisma.cab.update({
      where: { id },
      data: { isActive: !cab.isActive }
    })
    
    res.json({ success: true, message: `Cab ${updatedCab.isActive ? 'activated' : 'deactivated'}`, data: { cab: updatedCab } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
