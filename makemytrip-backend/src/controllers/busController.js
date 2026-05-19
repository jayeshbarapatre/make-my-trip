import Bus from '../models/Bus.js'

export const searchBuses = async (req, res) => {
  try {
    const { from, to, date, type, minPrice, maxPrice, page = 1, limit = 10, search } = req.query

    let query = { isActive: true, listingStatus: 'APPROVED' }

    if (from) query['departure.city'] = { $regex: from, $options: 'i' }
    if (to) query['arrival.city'] = { $regex: to, $options: 'i' }
    if (type) query.type = type
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }
    if (search) {
      query.$or = [
        { operatorName: { $regex: search, $options: 'i' } },
        { busNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const buses = await Bus.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ price: 1 })

    const total = await Bus.countDocuments(query)

    res.status(200).json({
      success: true,
      data: buses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    if (!bus.isActive || bus.listingStatus !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Bus not available' })
    }

    res.status(200).json({ success: true, data: bus })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
