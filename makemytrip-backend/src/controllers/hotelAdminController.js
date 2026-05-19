import prisma from '../config/prismaClient.js'

export const listAllHotels = async (req, res) => {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { rating: 'desc' }
    })
    res.json({ data: hotels })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createHotel = async (req, res) => {
  try {
    const { name, city, location, description, image, images, rating, reviews, price, pricePerNight, rooms, amenities, checkin, checkout } = req.body

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
        checkin,
        checkout,
        isActive: true
      }
    })

    res.status(201).json({ message: 'Hotel created successfully', data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAllHotels = async (req, res) => {
  try {
    const hotels = await prisma.hotel.findMany({
      orderBy: { rating: 'desc' }
    })
    res.json({ data: hotels })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getHotelById = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } })
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }
    res.json({ data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateHotel = async (req, res) => {
  try {
    const { id, createdAt, updatedAt, _id, ...updates } = req.body
    const hotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: updates
    })

    res.json({ message: 'Hotel updated successfully', data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteHotel = async (req, res) => {
  try {
    await prisma.hotel.delete({ where: { id: req.params.id } })
    res.json({ message: 'Hotel deleted successfully' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Hotel not found' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const toggleHotelStatus = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: req.params.id } })
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
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

export const updateHotelImages = async (req, res) => {
  try {
    const { imageUrls } = req.body

    if (!Array.isArray(imageUrls)) {
      return res.status(400).json({ message: 'imageUrls must be an array' })
    }

    const hotel = await prisma.hotel.update({
      where: { id: req.params.id },
      data: { images: imageUrls }
    })

    res.json({ message: 'Hotel images updated successfully', data: { hotel } })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Hotel not found' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const getHotelImages = async (req, res) => {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, images: true, image: true }
    })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    const images = hotel.images && Array.isArray(hotel.images) ? hotel.images : (hotel.image ? [hotel.image] : [])

    res.json({ data: { hotelId: hotel.id, hotelName: hotel.name, images } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
