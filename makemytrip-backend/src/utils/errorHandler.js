// Centralized error handling to prevent sensitive information leakage

const isDevelopment = process.env.NODE_ENV !== 'production'

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

export const sendError = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    message,
  }

  // Only include error details in development mode
  if (isDevelopment && details) {
    response.details = details
  }

  res.status(statusCode).json(response)
}

export const handleControllerError = (res, error, defaultMessage = 'An error occurred') => {
  // Log full error server-side (including stack trace)
  console.error('Error:', error)

  // Don't expose database errors, validation errors, or stack traces to clients
  if (error.code === 'P2002') {
    return sendError(res, 409, 'This record already exists')
  }

  if (error.code === 'P2025') {
    return sendError(res, 404, 'Record not found')
  }

  if (error instanceof AppError) {
    return sendError(res, error.statusCode, error.message)
  }

  // Default: don't leak error details to client
  const message = isDevelopment ? error.message : defaultMessage
  sendError(res, 500, message)
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
