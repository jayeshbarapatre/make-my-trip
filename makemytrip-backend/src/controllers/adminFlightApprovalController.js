import prisma from '../config/prismaClient.js'

export const getPendingFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({
      where: { listingStatus: 'PENDING_APPROVAL' },
      include: {
        vendor: {
          select: { id: true, name: true, email: true, phone: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      data: { flights }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const approveFlight = async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.user.id

    const flight = await prisma.flight.findUnique({
      where: { id }
    })

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' })
    }

    if (flight.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'Only pending flights can be approved'
      })
    }

    const updatedFlight = await prisma.flight.update({
      where: { id },
      data: {
        listingStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null
      }
    })

    res.status(200).json({
      success: true,
      message: 'Flight approved successfully',
      data: { flight: updatedFlight }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const rejectFlight = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rejection reason'
      })
    }

    const flight = await prisma.flight.findUnique({
      where: { id }
    })

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' })
    }

    if (flight.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'Only pending flights can be rejected'
      })
    }

    const updatedFlight = await prisma.flight.update({
      where: { id },
      data: {
        listingStatus: 'REJECTED',
        rejectionReason: reason
      }
    })

    res.status(200).json({
      success: true,
      message: 'Flight rejected successfully',
      data: { flight: updatedFlight }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
