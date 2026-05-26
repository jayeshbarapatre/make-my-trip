import prisma from '../config/prismaClient.js'

export const getMyHotels = async (req, res) => {
  try {
    const hotels = await prisma.hotel.findMany({
      where: { vendorId: req.vendorId },
      include: { roomCategories: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ data: { hotels } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createHotel = async (req, res) => {
  try {
    const { name, city, location, description, image, images, rating, reviews, price, pricePerNight, rooms, amenities, roomTypes, checkin, checkout } = req.body

    if (!name || !city || !price || !pricePerNight) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const hotel = await prisma.hotel.create({
      data: {
        name,
        city,
        location,
        description,
        image,
        images: images || [],
        rating: rating || 4,
        reviews: reviews || 0,
        price,
        pricePerNight,
        rooms: rooms || 50,
        roomsAvailable: rooms || 50,
        amenities: amenities || [],
        roomTypes: roomTypes || [],
        checkin,
        checkout,
        vendorId: req.vendorId,
        listingStatus: 'DRAFT',
        isActive: false
      }
    })

    res.status(201).json({ message: 'Hotel created successfully', data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getMyHotelById = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id },
      include: { roomCategories: true }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    res.json({ data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateHotel = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    const { id, createdAt, updatedAt, _id, vendorId, listingStatus, isActive, ...updates } = req.body

    if (updates.rooms !== undefined) {
      updates.roomsAvailable = updates.rooms
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: updates
    })

    res.json({ message: 'Hotel updated successfully', data: { hotel: updatedHotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteHotel = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    if (!['DRAFT', 'REJECTED'].includes(hotel.listingStatus)) {
      return res.status(400).json({ message: 'Can only delete hotels in DRAFT or REJECTED status' })
    }

    await prisma.hotel.delete({ where: { id: req.params.id } })
    res.json({ message: 'Hotel deleted successfully' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Hotel not found' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const submitForApproval = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    if (hotel.listingStatus !== 'DRAFT' && hotel.listingStatus !== 'REJECTED') {
      return res.status(400).json({ message: 'Only DRAFT or REJECTED hotels can be submitted for approval' })
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: {
        listingStatus: 'PENDING_APPROVAL',
        submittedAt: new Date()
      }
    })

    res.json({ message: 'Hotel submitted for approval', data: { hotel: updatedHotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const toggleHotelStatus = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    if (hotel.vendorId !== req.vendorId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this hotel' })
    }

    const updatedHotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: { isActive: !hotel.isActive }
    })

    res.json({ message: `Hotel ${updatedHotel.isActive ? 'activated' : 'deactivated'}`, data: { hotel: updatedHotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
