import jwt from 'jsonwebtoken'
import prisma from '../config/prismaClient.js'

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

export const authenticateAdmin = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' })
    }

    const token = header.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || !user.is_admin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' })
    }

    req.adminId = decoded.id
    req.user = user
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token has expired' })
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid or tampered token' })
    }
    return res.status(401).json({ message: 'Authentication failed' })
  }
}

export const adminOnly = (req, res, next) => {
  if (!req.adminId) {
    return res.status(403).json({ message: 'Forbidden: Admin authentication required' })
  }
  next()
}
