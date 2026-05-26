import prisma from '../config/prismaClient.js'

export const getPendingCabs = async (req, res) => {
  try {
    const cabs = await prisma.cab.findMany({
      where: { listingStatus: 'PENDING_APPROVAL' },
      include: {
        vendor: {
          select: { name: true, email: true, vendorName: true }
        }
      },
      orderBy: { submittedAt: 'asc' }
    })
    res.json({ success: true, data: { cabs } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const approveCab = async (req, res) => {
  try {
    const { id } = req.params

    const cab = await prisma.cab.findUnique({ where: { id } })
    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }

    if (cab.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Cab is not pending approval' })
    }

    const updatedCab = await prisma.cab.update({
      where: { id },
      data: {
        listingStatus: 'APPROVED',
        isActive: true,
        rejectionReason: null,
        approvedAt: new Date(),
        approvedBy: req.user.id
      }
    })

    res.json({ success: true, message: 'Cab approved successfully', data: { cab: updatedCab } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const rejectCab = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const cab = await prisma.cab.findUnique({ where: { id } })
    if (!cab) {
      return res.status(404).json({ success: false, message: 'Cab not found' })
    }

    if (cab.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Cab is not pending approval' })
    }

    const updatedCab = await prisma.cab.update({
      where: { id },
      data: {
        listingStatus: 'REJECTED',
        isActive: false,
        rejectionReason: reason
      }
    })

    res.json({ success: true, message: 'Cab rejected successfully', data: { cab: updatedCab } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
