import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production'

export const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token provided' })

    const decoded = jwt.verify(token, JWT_SECRET)
    req.adminId = decoded.id
    req.adminRole = decoded.role
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const adminOnly = (req, res, next) => {
  if (req.adminRole !== 'superadmin' && req.adminRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' })
  }
  next()
}
