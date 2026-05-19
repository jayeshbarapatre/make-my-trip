import prisma from '../config/prismaClient.js'

export const getPendingHotels = async (req, res) => {
  try {
    const pendingHotels = await prisma.hotel.findMany({
      where: { listingStatus: 'PENDING_APPROVAL' },
      include: {
        vendor: {
          select: { id: true, name: true, email: true }
        },
        roomCategories: true
      },
      orderBy: { submittedAt: 'asc' }
    })

    res.json({ data: { hotels: pendingHotels } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const approveHotel = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id },
      include: { vendor: { select: { id: true, name: true, email: true } } }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Only PENDING_APPROVAL hotels can be approved' })
    }

    const approvedHotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: {
        listingStatus: 'APPROVED',
        isActive: true,
        approvedAt: new Date(),
        approvedBy: req.adminId
      },
      include: { vendor: { select: { id: true, name: true, email: true } } }
    })

    res.json({
      message: 'Hotel approved successfully',
      data: { hotel: approvedHotel }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const rejectHotel = async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' })
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id },
      include: { vendor: { select: { id: true, name: true, email: true } } }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.listingStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ message: 'Only PENDING_APPROVAL hotels can be rejected' })
    }

    const rejectedHotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: {
        listingStatus: 'REJECTED',
        rejectionReason: reason,
        isActive: false
      },
      include: { vendor: { select: { id: true, name: true, email: true } } }
    })

    res.json({
      message: 'Hotel rejected successfully',
      data: { hotel: rejectedHotel }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
