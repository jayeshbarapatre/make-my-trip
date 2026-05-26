import prisma from '../config/prismaClient.js'

export const getMyBuses = async (req, res) => {
  try {
    const vendorId = req.user.id
    const buses = await prisma.bus.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json({ success: true, data: { buses } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createBus = async (req, res) => {
  try {
    const vendorId = req.user.id
    const { operatorName, busNumber, type, departure, arrival, durationMinutes, price, seats, amenities, image } = req.body

    if (!operatorName || !busNumber || !type || !price) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const existing = await prisma.bus.findUnique({ where: { busNumber } })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bus number already exists' })
    }

    const bus = await prisma.bus.create({
      data: {
        vendorId,
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
        listingStatus: 'DRAFT'
      }
    })

    res.status(201).json({ success: true, data: bus })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateBus = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const bus = await prisma.bus.findFirst({ where: { id, vendorId } })

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    const { operatorName, busNumber, type, departure, arrival, durationMinutes, price, seats, amenities, image } = req.body

    if (busNumber && busNumber !== bus.busNumber) {
      const existing = await prisma.bus.findUnique({ where: { busNumber } })
      if (existing) {
        return res.status(400).json({ success: false, message: 'Bus number already exists' })
      }
    }

    const updateData = {
      operatorName: operatorName || bus.operatorName,
      busNumber: busNumber || bus.busNumber,
      type: type || bus.type,
      departure: departure || bus.departure,
      arrival: arrival || bus.arrival,
      price: price ? parseFloat(price) : bus.price,
      seats: seats ? parseInt(seats) : bus.seats,
      seatsAvailable: seats ? parseInt(seats) : bus.seatsAvailable,
      amenities: amenities || bus.amenities,
      image: image || bus.image
    }

    if (durationMinutes !== undefined) {
      updateData.durationMinutes = parseInt(durationMinutes)
    }

    // If bus is already approved, editing it requires re-approval
    if (bus.listingStatus === 'APPROVED') {
      updateData.listingStatus = 'PENDING_APPROVAL'
      updateData.submittedAt = new Date()
      updateData.approvedAt = null
      updateData.approvedBy = null
    }

    const updatedBus = await prisma.bus.update({
      where: { id },
      data: updateData
    })

    res.status(200).json({ success: true, data: updatedBus })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteBus = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const bus = await prisma.bus.findFirst({ where: { id, vendorId } })

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    await prisma.bus.delete({ where: { id } })
    res.status(200).json({ success: true, message: 'Bus deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const submitBusForApproval = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const bus = await prisma.bus.findFirst({ where: { id, vendorId } })

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    if (bus.listingStatus !== 'DRAFT' && bus.listingStatus !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Only draft or rejected buses can be submitted'
      })
    }

    const updatedBus = await prisma.bus.update({
      where: { id },
      data: {
        listingStatus: 'PENDING_APPROVAL',
        submittedAt: new Date()
      }
    })

    res.status(200).json({ success: true, data: updatedBus, message: 'Bus submitted for approval' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
