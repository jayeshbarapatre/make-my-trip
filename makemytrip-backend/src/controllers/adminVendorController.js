import bcrypt from 'bcryptjs'
import prisma from '../config/prismaClient.js'

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await prisma.user.findMany({
      where: { is_vendor: true },
      include: {
        _count: { select: { hotels: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ data: { vendors } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getVendorHotels = async (req, res) => {
  try {
    const vendor = await prisma.user.findUnique({
      where: { id: req.params.id }
    })

    if (!vendor || !vendor.is_vendor) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    const hotels = await prisma.hotel.findMany({
      where: { vendorId: req.params.id },
      include: { roomCategories: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ data: { hotels } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createVendor = async (req, res) => {
  try {
    const { name, email, password, phone, vendorType = 'hotel' } = req.body

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password, and phone are required' })
    }

    if (!['hotel', 'flight', 'multi'].includes(vendorType)) {
      return res.status(400).json({ message: 'Invalid vendor type. Must be hotel, flight, or multi' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const vendor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone,
        is_vendor: true,
        vendorType,
        vendorStatus: 'ACTIVE'
      },
      select: { id: true, name: true, email: true, phone: true, is_vendor: true, vendorType: true, vendorStatus: true, createdAt: true }
    })

    res.status(201).json({
      message: 'Vendor created successfully',
      data: { vendor }
    })
  } catch (err) {
    console.error('Create vendor error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const deleteVendor = async (req, res) => {
  try {
    const vendor = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { hotels: true } } }
    })

    if (!vendor || !vendor.is_vendor) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    if (vendor._count.hotels > 0) {
      return res.status(400).json({ message: 'Cannot delete vendor with active hotels' })
    }

    await prisma.user.delete({ where: { id: req.params.id } })

    res.json({ message: 'Vendor deleted successfully' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const toggleVendorStatus = async (req, res) => {
  try {
    const vendor = await prisma.user.findUnique({
      where: { id: req.params.id }
    })

    if (!vendor || !vendor.is_vendor) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    const newStatus = vendor.vendorStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { vendorStatus: newStatus },
      select: { id: true, name: true, email: true, vendorStatus: true }
    })

    res.json({
      message: `Vendor ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} successfully`,
      data: { vendor: updated }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
