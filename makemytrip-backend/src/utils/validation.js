export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email) && email.length <= 255
}

export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false
  return password.length >= 8 && /\d/.test(password)
}

export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false
  return name.length >= 2 && name.length <= 100
}

export const validateDateFormat = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const date = new Date(dateStr + 'T00:00:00')
  return !isNaN(date.getTime())
}

export const validateDateRange = (checkIn, checkOut) => {
  if (!validateDateFormat(checkIn) || !validateDateFormat(checkOut)) {
    return { valid: false, error: 'Invalid date format (use YYYY-MM-DD)' }
  }

  const inDate = new Date(checkIn + 'T00:00:00')
  const outDate = new Date(checkOut + 'T00:00:00')

  if (outDate <= inDate) {
    return { valid: false, error: 'Checkout must be after checkin' }
  }

  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24))
  if (nights < 1 || nights > 90) {
    return { valid: false, error: 'Stay must be 1-90 nights' }
  }

  return { valid: true, nights }
}

export const validateGuestCount = (count, max = 50) => {
  const num = parseInt(count, 10)
  if (isNaN(num) || num < 1 || num > max) {
    return { valid: false, error: `Guests must be between 1 and ${max}` }
  }
  return { valid: true, count: num }
}

export const validateRoomCount = (count, max = 10) => {
  const num = parseInt(count, 10)
  if (isNaN(num) || num < 1 || num > max) {
    return { valid: false, error: `Rooms must be between 1 and ${max}` }
  }
  return { valid: true, count: num }
}

export const validatePrice = (price) => {
  const num = parseFloat(price)
  if (isNaN(num) || num <= 0 || num > 1000000) {
    return { valid: false, error: 'Price must be a positive number up to 1,000,000' }
  }
  return { valid: true, price: num }
}

export const validateSeats = (seats) => {
  const num = parseInt(seats, 10)
  if (isNaN(num) || num < 0 || num > 500) {
    return { valid: false, error: 'Seats must be between 0 and 500' }
  }
  return { valid: true, seats: num }
}

export const validateCity = (city) => {
  if (!city || typeof city !== 'string') return false
  return city.length >= 2 && city.length <= 100
}

export const validatePageNumber = (page) => {
  const num = parseInt(page, 10)
  return !isNaN(num) && num >= 1 ? num : 1
}

export const validatePageSize = (limit, maxLimit = 100) => {
  const num = parseInt(limit, 10)
  if (isNaN(num) || num < 1) return 20
  return Math.min(num, maxLimit)
}

export const validateFlightData = (data) => {
  const errors = {}

  if (!data.from || !validateCity(data.from)) errors.from = 'Invalid departure city'
  if (!data.to || !validateCity(data.to)) errors.to = 'Invalid arrival city'
  if (!validateDateFormat(data.departureTime)) errors.departureTime = 'Invalid departure time'
  if (data.arrivalTime && !validateDateFormat(data.arrivalTime)) errors.arrivalTime = 'Invalid arrival time'
  if (!data.airlineName || data.airlineName.length < 2) errors.airlineName = 'Invalid airline name'
  if (!validatePrice(data.price).valid) errors.price = validatePrice(data.price).error
  if (!validateSeats(data.seats).valid) errors.seats = validateSeats(data.seats).error
  if (data.durationMinutes && (isNaN(data.durationMinutes) || data.durationMinutes < 0)) {
    errors.durationMinutes = 'Duration must be a positive number'
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors }
}

export const validateHotelData = (data) => {
  const errors = {}

  if (!data.name || data.name.length < 2) errors.name = 'Hotel name required (min 2 chars)'
  if (!data.city || !validateCity(data.city)) errors.city = 'Invalid city'
  if (!validatePrice(data.price).valid) errors.price = validatePrice(data.price).error
  if (!validateSeats(data.roomsAvailable).valid) errors.roomsAvailable = validateSeats(data.roomsAvailable).error
  if (data.rating && (isNaN(data.rating) || data.rating < 0 || data.rating > 5)) {
    errors.rating = 'Rating must be between 0 and 5'
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors }
}
