import Hotel from '../models/Hotel.js'

export const createHotel = async (req, res) => {
  try {
    const { name, city, location, description, image, images, rating, reviews, price, pricePerNight, rooms, amenities, checkin, checkout } = req.body

    if (!name || !city || !price || !pricePerNight) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const hotel = await Hotel.create({
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
      checkout
    })

    res.status(201).json({ message: 'Hotel created successfully', data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAllHotels = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city, status } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }
    if (city) query.city = city
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    const total = await Hotel.countDocuments(query)
    const hotels = await Hotel.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 })

    res.json({
      data: { hotels, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
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
    const updates = req.body
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, { ...updates, updatedAt: new Date() }, { new: true })

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    res.json({ message: 'Hotel updated successfully', data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id)
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }
    res.json({ message: 'Hotel deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const toggleHotelStatus = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' })
    }
    hotel.isActive = !hotel.isActive
    await hotel.save()
    res.json({ message: `Hotel ${hotel.isActive ? 'activated' : 'deactivated'}`, data: { hotel } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
