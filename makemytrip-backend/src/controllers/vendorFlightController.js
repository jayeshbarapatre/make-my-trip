import prisma from '../config/prismaClient.js'

export const getMyFlights = async (req, res) => {
  try {
    const vendorId = req.user.id
    const flights = await prisma.flight.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      data: { flights }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getMyFlightById = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const flight = await prisma.flight.findFirst({
      where: { id, vendorId }
    })

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' })
    }

    res.status(200).json({
      success: true,
      data: { flight }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createFlight = async (req, res) => {
  try {
    const vendorId = req.user.id
    const {
      airline,
      flightNumber,
      from,
      to,
      departureTime,
      arrivalTime,
      durationMinutes,
      price,
      seatsAvailable
    } = req.body

    if (!airline || !flightNumber || !from || !to || !departureTime || !arrivalTime || !durationMinutes || !price || !seatsAvailable) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' })
    }

    // Check if flight number already exists
    const existing = await prisma.flight.findUnique({
      where: { flightNumber }
    })

    if (existing) {
      return res.status(400).json({ success: false, message: 'Flight number already exists' })
    }

    const newFlight = await prisma.flight.create({
      data: {
        vendorId,
        airline,
        flightNumber,
        from,
        to,
        departureTime,
        arrivalTime,
        durationMinutes: parseInt(durationMinutes),
        price: parseFloat(price),
        seatsAvailable: parseInt(seatsAvailable),
        listingStatus: 'DRAFT'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Flight created successfully',
      data: { flight: newFlight }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateFlight = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id
    const {
      airline,
      flightNumber,
      from,
      to,
      departureTime,
      arrivalTime,
      durationMinutes,
      price,
      seatsAvailable
    } = req.body

    const flight = await prisma.flight.findFirst({
      where: { id, vendorId }
    })

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' })
    }

    const updateData = {}
    if (airline) updateData.airline = airline
    if (flightNumber) updateData.flightNumber = flightNumber
    if (from) updateData.from = from
    if (to) updateData.to = to
    if (departureTime) updateData.departureTime = departureTime
    if (arrivalTime) updateData.arrivalTime = arrivalTime
    if (durationMinutes) updateData.durationMinutes = parseInt(durationMinutes)
    if (price) updateData.price = parseFloat(price)
    if (seatsAvailable !== undefined) updateData.seatsAvailable = parseInt(seatsAvailable)

    // If flight is already approved, editing it requires re-approval
    if (flight.listingStatus === 'APPROVED') {
      updateData.listingStatus = 'PENDING_APPROVAL'
      updateData.submittedAt = new Date()
      updateData.approvedAt = null
      updateData.approvedBy = null
    }

    const updatedFlight = await prisma.flight.update({
      where: { id },
      data: updateData
    })

    res.status(200).json({
      success: true,
      message: flight.listingStatus === 'APPROVED'
        ? 'Flight updated and submitted for re-approval'
        : 'Flight updated successfully',
      data: { flight: updatedFlight }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteFlight = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const flight = await prisma.flight.findFirst({
      where: { id, vendorId }
    })

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' })
    }

    await prisma.flight.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Flight deleted successfully'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const submitForApproval = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const flight = await prisma.flight.findFirst({
      where: { id, vendorId }
    })

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' })
    }

    if (flight.listingStatus !== 'DRAFT' && flight.listingStatus !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Only draft or rejected flights can be submitted'
      })
    }

    const updatedFlight = await prisma.flight.update({
      where: { id },
      data: {
        listingStatus: 'PENDING_APPROVAL',
        submittedAt: new Date()
      }
    })

    res.status(200).json({
      success: true,
      message: 'Flight submitted for approval',
      data: { flight: updatedFlight }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const toggleFlightStatus = async (req, res) => {
  try {
    const { id } = req.params
    const vendorId = req.user.id

    const flight = await prisma.flight.findFirst({
      where: { id, vendorId }
    })

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' })
    }

    const updatedFlight = await prisma.flight.update({
      where: { id },
      data: { isActive: !flight.isActive }
    })

    res.status(200).json({
      success: true,
      message: 'Flight status toggled',
      data: { flight: updatedFlight }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
