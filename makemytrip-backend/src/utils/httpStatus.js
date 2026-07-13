// HTTP Status Code utilities and constants

export const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
}

export const HTTP_STATUS_MESSAGES = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable'
}

export const getStatusMessage = (statusCode) => {
  return HTTP_STATUS_MESSAGES[statusCode] || 'Unknown Status'
}

export const isSuccessStatus = (statusCode) => {
  return statusCode >= 200 && statusCode < 300
}

export const isClientError = (statusCode) => {
  return statusCode >= 400 && statusCode < 500
}

export const isServerError = (statusCode) => {
  return statusCode >= 500 && statusCode < 600
}

export const isRedirect = (statusCode) => {
  return statusCode >= 300 && statusCode < 400
}
