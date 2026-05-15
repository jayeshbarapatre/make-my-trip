import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'change_this_secret_in_production')
    req.user = decoded
    req.userId = decoded.id || decoded._id
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}
