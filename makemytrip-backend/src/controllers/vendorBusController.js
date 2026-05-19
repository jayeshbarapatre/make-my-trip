import Bus from '../models/Bus.js'

export const getMyBuses = async (req, res) => {
  try {
    const vendorId = req.vendor.id
    const buses = await Bus.find({ vendorId }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, data: buses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createBus = async (req, res) => {
  try {
    const { operatorName, busNumber, type, departure, arrival, duration, price, seats, amenities, image } = req.body

    if (!operatorName || !busNumber || !type || !price) {
      return res.status(400).json({ success: false, message: 'Missing required fields' })
    }

    const existing = await Bus.findOne({ busNumber })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bus number already exists' })
    }

    const bus = new Bus({
      vendorId: req.vendor.id,
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
      image,
      listingStatus: 'DRAFT'
    })

    await bus.save()
    res.status(201).json({ success: true, data: bus })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    if (bus.vendorId.toString() !== req.vendor.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    const { operatorName, busNumber, type, departure, arrival, duration, price, seats, amenities, image } = req.body

    if (busNumber && busNumber !== bus.busNumber) {
      const existing = await Bus.findOne({ busNumber })
      if (existing) {
        return res.status(400).json({ success: false, message: 'Bus number already exists' })
      }
    }

    Object.assign(bus, {
      operatorName: operatorName || bus.operatorName,
      busNumber: busNumber || bus.busNumber,
      type: type || bus.type,
      departure: departure || bus.departure,
      arrival: arrival || bus.arrival,
      duration: duration || bus.duration,
      price: price || bus.price,
      seats: seats || bus.seats,
      seatsAvailable: seats || bus.seatsAvailable,
      amenities: amenities || bus.amenities,
      image: image || bus.image
    })

    await bus.save()
    res.status(200).json({ success: true, data: bus })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    if (bus.vendorId.toString() !== req.vendor.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    await Bus.findByIdAndDelete(req.params.id)
    res.status(200).json({ success: true, message: 'Bus deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const submitBusForApproval = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' })
    }

    if (bus.vendorId.toString() !== req.vendor.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    bus.listingStatus = 'PENDING_APPROVAL'
    await bus.save()

    res.status(200).json({ success: true, data: bus, message: 'Bus submitted for approval' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
