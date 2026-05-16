import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../config/prismaClient.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production'

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' })

export const adminRegister = async (req, res) => {
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
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: '0000000000',
        is_admin: true
      },
      select: { id: true, name: true, email: true, is_admin: true }
    })

    const token = signToken(admin.id)
    res.status(201).json({
      message: 'Admin created successfully',
      data: { admin, token }
    })
  } catch (err) {
    console.error('Admin register error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.is_admin) {
      return res.status(401).json({ message: 'Invalid credentials or not an admin' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user.id)
    res.json({
      message: 'Login successful',
      data: {
        admin: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
        token
      }
    })
  } catch (err) {
    console.error('Admin login error:', err)
    res.status(500).json({ message: err.message })
  }
}

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.adminId },
      select: { id: true, name: true, email: true, phone: true, is_admin: true }
    })
    if (!admin || !admin.is_admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    res.json({ data: { admin } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const adminLogout = (req, res) => {
  res.json({ message: 'Logged out successfully' })
}
