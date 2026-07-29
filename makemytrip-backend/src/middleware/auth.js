import jwt from 'jsonwebtoken'

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. This is required for security. Set JWT_SECRET in your .env file.')
}

const JWT_SECRET = process.env.JWT_SECRET

// Attaches req.user/req.userId when a valid token is present, but never rejects.
// Used on endpoints that must work for both authenticated and unauthenticated callers.
export const optionalAuthenticate = (req, _res, next) => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), JWT_SECRET)
      req.user = decoded
      req.userId = decoded.id
    } catch {
      // Invalid token on an optional-auth route: proceed unauthenticated
    }
  }
  next()
}

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' })
  }

  try {
    const token = header.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    req.userId = decoded.id
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token payload' })
    }
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
