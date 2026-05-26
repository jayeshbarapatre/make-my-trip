import prisma from '../config/prismaClient.js'

export const getMyCabs = async (req, res) => {
  try {
    const cabs = await prisma.cab.findMany({
      where: { vendorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: { cabs } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const createCab = async (req, res) => {
  try {
    const { operatorName, cabNumber, type, baseFare, perKmRate, perMinuteRate, location, currentCity, cabs, image } = req.body

    const existingCab = await prisma.cab.findUnique({ where: { cabNumber } })
    if (existingCab) {
      return res.status(400).json({ success: false, message: 'Cab number already exists' })
    }

    const cab = await prisma.cab.create({
      data: {
        vendorId: req.user.id,
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
        listingStatus: 'DRAFT',
        isActive: false
      }
    })
    res.status(201).json({ success: true, message: 'Cab created successfully', data: { cab } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const updateCab = async (req, res) => {
  try {
    const { id } = req.params
    const cab = await prisma.cab.findUnique({ where: { id } })

    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }

    if (cab.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

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

    // If a rejected cab is edited, move back to draft
    if (cab.listingStatus === 'REJECTED') {
      data.listingStatus = 'DRAFT'
      data.rejectionReason = null
    }

    const updatedCab = await prisma.cab.update({
      where: { id },
      data
    })

    res.json({ success: true, message: 'Cab updated successfully', data: { cab: updatedCab } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const deleteCab = async (req, res) => {
  try {
    const { id } = req.params
    const cab = await prisma.cab.findUnique({ where: { id } })

    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }

    if (cab.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    await prisma.cab.delete({ where: { id } })
    res.json({ success: true, message: 'Cab deleted successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const submitCabForApproval = async (req, res) => {
  try {
    const { id } = req.params
    const cab = await prisma.cab.findUnique({ where: { id } })

    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }

    if (cab.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    if (cab.listingStatus === 'APPROVED' || cab.listingStatus === 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: `Cab is already ${cab.listingStatus.toLowerCase()}` })
    }

    const updatedCab = await prisma.cab.update({
      where: { id },
      data: {
        listingStatus: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        rejectionReason: null
      }
    })

    res.json({ success: true, message: 'Cab submitted for approval', data: { cab: updatedCab } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
