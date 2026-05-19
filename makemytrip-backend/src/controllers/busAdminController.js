import Bus from '../models/Bus.js'

export const createBus = async (req, res) => {
  try {
    const { operatorName, busNumber, type, departure, arrival, duration, price, seats, amenities, image } = req.body

    if (!operatorName || !busNumber || !type || !departure || !arrival || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const bus = await Bus.create({
      operatorName,
      busNumber,
      type,
      departure,
      arrival,
      duration,
      price,
      seats: seats || 45,
      seatsAvailable: seats || 45,
      amenities: amenities || [],
      image
    })

    res.status(201).json({ message: 'Bus created successfully', data: { bus } })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Bus number already exists' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const getAllBuses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (search) {
      query.$or = [
        { operatorName: { $regex: search, $options: 'i' } },
        { busNumber: { $regex: search, $options: 'i' } },
        { 'departure.city': { $regex: search, $options: 'i' } },
        { 'arrival.city': { $regex: search, $options: 'i' } }
      ]
    }
    if (type) query.type = type
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    const total = await Bus.countDocuments(query)
    const buses = await Bus.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 })

    res.json({
      data: { buses, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }
    res.json({ data: { bus } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateBus = async (req, res) => {
  try {
    const updates = req.body
    const bus = await Bus.findByIdAndUpdate(req.params.id, { ...updates, updatedAt: new Date() }, { new: true })

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }

    res.json({ message: 'Bus updated successfully', data: { bus } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }
    res.json({ message: 'Bus deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const toggleBusStatus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' })
    }
    bus.isActive = !bus.isActive
    await bus.save()
    res.json({ message: `Bus ${bus.isActive ? 'activated' : 'deactivated'}`, data: { bus } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
