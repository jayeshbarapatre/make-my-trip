import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../config/prismaClient.js'

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '8h' })

export const vendorRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const vendor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: '0000000000',
        is_vendor: true,
        vendorType: 'hotel'
      },
      select: { id: true, name: true, email: true, is_vendor: true, vendorType: true }
    })

    const token = signToken(vendor.id)
    res.status(201).json({
      message: 'Vendor created successfully',
      data: { vendor, token }
    })
  } catch (err) {
    console.error('Vendor register error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.is_vendor) {
      return res.status(401).json({ message: 'Invalid credentials or not a vendor' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user.id)
    res.json({
      message: 'Login successful',
      data: {
        vendor: { id: user.id, name: user.name, email: user.email, is_vendor: user.is_vendor, vendorType: user.vendorType },
        token
      }
    })
  } catch (err) {
    console.error('Vendor login error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const getVendorProfile = async (req, res) => {
  try {
    const vendor = await prisma.user.findUnique({
      where: { id: req.vendorId },
      select: { id: true, name: true, email: true, phone: true, is_vendor: true, vendorType: true, vendorName: true, vendorStatus: true }
    })
    if (!vendor || !vendor.is_vendor) {
      return res.status(404).json({ message: 'Vendor not found' })
    }
    res.json({ data: { vendor } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const vendorLogout = (req, res) => {
  res.json({ message: 'Logged out successfully' })
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' })
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one number' })
    }

    const vendor = await prisma.user.findUnique({ where: { id: req.vendorId } })
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' })
    }

    const isValid = await bcrypt.compare(currentPassword, vendor.password)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid current password' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.vendorId },
      data: { password: hashed }
    })

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
