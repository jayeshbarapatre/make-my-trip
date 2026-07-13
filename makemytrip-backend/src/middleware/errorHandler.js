// Global error handling middleware - must be last middleware in chain

import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err)

  // Prisma specific errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'This record already exists'
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found'
    })
  }

  if (err.code === 'P2028') {
    return res.status(500).json({
      success: false,
      message: 'Query timeout - please try again'
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      ...(process.env.NODE_ENV !== 'production' && { errors: err.errors })
    })
  }

  // Default error response - don't leak details in production
  const statusCode = err.statusCode || 500
  const message = process.env.NODE_ENV !== 'production'
    ? err.message
    : 'An error occurred processing your request'

  res.status(statusCode).json({
    success: false,
    message
  })
}

// 404 handler - must be before error handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
}
