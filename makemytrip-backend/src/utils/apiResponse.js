// Standardized API response format for consistency across all endpoints

/**
 * Send a successful API response
 * @param {Object} res - Express response object
 * @param {*} data - Response data payload
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {void}
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data: data || {}
  })
}

/**
 * Send a successful API response with pagination metadata
 * @param {Object} res - Express response object
 * @param {Array} data - Array of result items
 * @param {Object} pagination - Pagination info (page, limit, total, pages)
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {void}
 */
export const sendPaginatedSuccess = (res, data, pagination = {}, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  })
}

/**
 * Send an error API response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} errors - Detailed error info (development only)
 * @returns {void}
 */
export const sendError = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  }

  if (errors && process.env.NODE_ENV !== 'production') {
    response.errors = errors
  }

  res.status(statusCode).json(response)
}
