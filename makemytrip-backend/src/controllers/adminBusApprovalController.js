import prisma from '../config/prismaClient.js'

export const getPendingBuses = async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      where: { listingStatus: 'PENDING_APPROVAL' },
      include: {
        vendor: {
          select: { name: true, email: true, vendorName: true }
        }
      },
      orderBy: { submittedAt: 'asc' }
    })
    res.json({ success: true, data: { buses } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const approveBus = async (req, res) => {
  try {
    const { id } = req.params

    const bus = await prisma.bus.findUnique({ where: { id } })
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    if (bus.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Bus is not pending approval' })
    }

    const updatedBus = await prisma.bus.update({
      where: { id },
      data: {
        listingStatus: 'APPROVED',
        isActive: true,
        rejectionReason: null,
        approvedAt: new Date(),
        approvedBy: req.user.id
      }
    })

    res.json({ success: true, message: 'Bus approved successfully', data: { bus: updatedBus } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const rejectBus = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const bus = await prisma.bus.findUnique({ where: { id } })
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    if (bus.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Bus is not pending approval' })
    }

    const updatedBus = await prisma.bus.update({
      where: { id },
      data: {
        listingStatus: 'REJECTED',
        isActive: false,
        rejectionReason: reason
      }
    })

    res.json({ success: true, message: 'Bus rejected successfully', data: { bus: updatedBus } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
