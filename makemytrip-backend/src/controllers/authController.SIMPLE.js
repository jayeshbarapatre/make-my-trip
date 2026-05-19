import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '../config/prismaClient.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

const signToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
}

// ════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════
export const register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      })
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      })
    }

    // Check if email ALREADY EXISTS
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login or use a different email.'
      })
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'User',
        phone: phone || '0000000000',
        is_admin: false
      }
    })

    // Generate JWT token
    const token = signToken(newUser.id)

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone
        },
        token
      }
    })

    console.log(`✅ User registered: ${email}`)
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({
      success: false,
      message: 'Failed to register user. Please try again.'
    })
  }
}

// ════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      })
    }

    // Step 1: Check if email EXISTS in database
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      })
    }

    // Step 2: Check if password MATCHES
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      })
    }

    // Step 3: Login successful - generate token
    const token = signToken(user.id)

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone
        },
        token
      }
    })

    console.log(`✅ User logged in: ${email}`)
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    })
  }
}

// ════════════════════════════════════════════════════
// GET PROFILE (requires token)
// ════════════════════════════════════════════════════
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      })
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone
        }
      }
    })
  } catch (err) {
    console.error('Get profile error:', err.message)
    res.status(500).json({
      success: false,
      message: 'Failed to get profile.'
    })
  }
}

// ════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════
export const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully.'
  })
}
