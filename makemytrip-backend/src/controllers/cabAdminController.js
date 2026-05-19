import Cab from '../models/Cab.js'

export const createCab = async (req, res) => {
  try {
    const { operatorName, cabNumber, type, baseFare, perKmRate, perMinuteRate, location, currentCity, cabs, image } = req.body

    if (!operatorName || !cabNumber || !type || !baseFare || !perKmRate || !perMinuteRate) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const cab = await Cab.create({
      operatorName,
      cabNumber,
      type,
      baseFare,
      perKmRate,
      perMinuteRate,
      location,
      currentCity,
      cabs: cabs || 20,
      cabs_available: cabs || 20,
      image
    })

    res.status(201).json({ message: 'Cab created successfully', data: { cab } })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cab number already exists' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const getAllCabs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (search) {
      query.$or = [
        { operatorName: { $regex: search, $options: 'i' } },
        { cabNumber: { $regex: search, $options: 'i' } },
        { currentCity: { $regex: search, $options: 'i' } }
      ]
    }
    if (type) query.type = type
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    const total = await Cab.countDocuments(query)
    const cabs = await Cab.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 })

    res.json({
      data: { cabs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getCabById = async (req, res) => {
  try {
    const cab = await Cab.findById(req.params.id)
    if (!cab) {
      return res.status(404).json({ message: 'Cab not found' })
    }
    res.json({ data: { cab } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateCab = async (req, res) => {
  try {
    const updates = req.body
    const cab = await Cab.findByIdAndUpdate(req.params.id, { ...updates, updatedAt: new Date() }, { new: true })

    if (!cab) {
      return res.status(404).json({ message: 'Cab not found' })
    }

    res.json({ message: 'Cab updated successfully', data: { cab } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteCab = async (req, res) => {
  try {
    const cab = await Cab.findByIdAndDelete(req.params.id)
    if (!cab) {
      return res.status(404).json({ message: 'Cab not found' })
    }
    res.json({ message: 'Cab deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const toggleCabStatus = async (req, res) => {
  try {
    const cab = await Cab.findById(req.params.id)
    if (!cab) {
      return res.status(404).json({ message: 'Cab not found' })
    }
    cab.isActive = !cab.isActive
    await cab.save()
    res.json({ message: `Cab ${cab.isActive ? 'activated' : 'deactivated'}`, data: { cab } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
