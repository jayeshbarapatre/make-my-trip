import prisma from '../config/prismaClient.js'

export const getMyTraines = async (req, res) => {
  try {
    const vendorId = req.user.id
    const traines = await prisma.train.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json({ success: true, data: { traines } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createTrain = async (req, res) => {
  try {
    const vendorId = req.user.id
    const { operatorName, trainNumber, type, departure, arrival, durationMinutes, price, seats, amenities, image } = req.body

    if (!operatorName || !trainNumber || !type || !price) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const existing = await prisma.train.findUnique({ where: { trainNumber } })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Train number already exists' })
    }

    const train = await prisma.train.create({
      data: {
        vendorId,
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
        listingStatus: 'DRAFT'
      }
    })

    res.status(201).json({ success: true, data: train })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateTrain = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const train = await prisma.train.findFirst({ where: { id, vendorId } })

    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' })
    }

    const { operatorName, trainNumber, type, departure, arrival, durationMinutes, price, seats, amenities, image } = req.body

    if (trainNumber && trainNumber !== train.trainNumber) {
      const existing = await prisma.train.findUnique({ where: { trainNumber } })
      if (existing) {
        return res.status(400).json({ success: false, message: 'Train number already exists' })
      }
    }

    const updateData = {
      operatorName: operatorName || train.operatorName,
      trainNumber: trainNumber || train.trainNumber,
      type: type || train.type,
      departure: departure || train.departure,
      arrival: arrival || train.arrival,
      price: price ? parseFloat(price) : train.price,
      seats: seats ? parseInt(seats) : train.seats,
      seatsAvailable: seats ? parseInt(seats) : train.seatsAvailable,
      amenities: amenities || train.amenities,
      image: image || train.image
    }

    if (durationMinutes !== undefined) {
      updateData.durationMinutes = parseInt(durationMinutes)
    }

    // If train is already approved, editing it requires re-approval
    if (train.listingStatus === 'APPROVED') {
      updateData.listingStatus = 'PENDING_APPROVAL'
      updateData.submittedAt = new Date()
      updateData.approvedAt = null
      updateData.approvedBy = null
    }

    const updatedTrain = await prisma.train.update({
      where: { id },
      data: updateData
    })

    res.status(200).json({ success: true, data: updatedTrain })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteTrain = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const train = await prisma.train.findFirst({ where: { id, vendorId } })

    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' })
    }

    await prisma.train.delete({ where: { id } })
    res.status(200).json({ success: true, message: 'Train deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const submitTrainForApproval = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const train = await prisma.train.findFirst({ where: { id, vendorId } })

    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' })
    }

    if (train.listingStatus !== 'DRAFT' && train.listingStatus !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Only draft or rejected traines can be submitted'
      })
    }

    const updatedTrain = await prisma.train.update({
      where: { id },
      data: {
        listingStatus: 'PENDING_APPROVAL',
        submittedAt: new Date()
      }
    })

    res.status(200).json({ success: true, data: updatedTrain, message: 'Train submitted for approval' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
