import prisma from '../config/prismaClient.js'

export const getRoomsByHotel = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.hotelId }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    const rooms = await prisma.roomCategory.findMany({
      where: { hotelId: req.params.hotelId },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ data: { rooms } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createRoom = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.hotelId }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    const { categoryName, description, capacity, totalRooms, basePrice, amenities, images } = req.body

    if (!categoryName || totalRooms === undefined || basePrice === undefined) {
      return res.status(400).json({ message: 'Missing required fields: categoryName, totalRooms, basePrice' })
    }

    const room = await prisma.roomCategory.create({
      data: {
        hotelId: req.params.hotelId,
        categoryName,
        description,
        capacity: capacity || 2,
        totalRooms,
        availableRooms: totalRooms,
        basePrice,
        amenities: amenities || [],
        images: images || [],
        isActive: true
      }
    })

    res.status(201).json({ message: 'Room category created successfully', data: { room } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateRoom = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.hotelId }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    const room = await prisma.roomCategory.findUnique({
      where: { id: req.params.roomId }
    })

    if (!room || room.hotelId !== req.params.hotelId) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const { id, hotelId, createdAt, updatedAt, _id, ...updates } = req.body

    const updatedRoom = await prisma.roomCategory.update({
      where: { id: req.params.roomId },
      data: updates
    })

    res.json({ message: 'Room updated successfully', data: { room: updatedRoom } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteRoom = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.hotelId }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    const room = await prisma.roomCategory.findUnique({
      where: { id: req.params.roomId }
    })

    if (!room || room.hotelId !== req.params.hotelId) {
      return res.status(404).json({ message: 'Room not found' })
    }

    await prisma.roomCategory.delete({
      where: { id: req.params.roomId }
    })

    res.json({ message: 'Room deleted successfully' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Room not found' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const toggleRoomStatus = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.hotelId }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    const room = await prisma.roomCategory.findUnique({
      where: { id: req.params.roomId }
    })

    if (!room || room.hotelId !== req.params.hotelId) {
      return res.status(404).json({ message: 'Room not found' })
    }

    const updatedRoom = await prisma.roomCategory.update({
      where: { id: req.params.roomId },
      data: { isActive: !room.isActive }
    })

    res.json({ message: `Room ${updatedRoom.isActive ? 'activated' : 'deactivated'}`, data: { room: updatedRoom } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
