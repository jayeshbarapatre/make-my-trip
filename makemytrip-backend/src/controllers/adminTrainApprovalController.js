import prisma from '../config/prismaClient.js'

export const getPendingTraines = async (req, res) => {
  try {
    const traines = await prisma.train.findMany({
      where: { listingStatus: 'PENDING_APPROVAL' },
      include: {
        vendor: {
          select: { name: true, email: true, vendorName: true }
        }
      },
      orderBy: { submittedAt: 'asc' }
    })
    res.json({ success: true, data: { traines } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const approveTrain = async (req, res) => {
  try {
    const { id } = req.params

    const train = await prisma.train.findUnique({ where: { id } })
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' })
    }

    if (train.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Train is not pending approval' })
    }

    const updatedTrain = await prisma.train.update({
      where: { id },
      data: {
        listingStatus: 'APPROVED',
        isActive: true,
        rejectionReason: null,
        approvedAt: new Date(),
        approvedBy: req.user.id
      }
    })

    res.json({ success: true, message: 'Train approved successfully', data: { train: updatedTrain } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export const rejectTrain = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const train = await prisma.train.findUnique({ where: { id } })
    if (!train) {
      return res.status(404).json({ success: false, message: 'Train not found' })
    }

    if (train.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Train is not pending approval' })
    }

    const updatedTrain = await prisma.train.update({
      where: { id },
      data: {
        listingStatus: 'REJECTED',
        isActive: false,
        rejectionReason: reason
      }
    })

    res.json({ success: true, message: 'Train rejected successfully', data: { train: updatedTrain } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
