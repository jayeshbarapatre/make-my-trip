// Date utility functions for consistent date handling

export const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  const date = new Date(dateStr + 'T00:00:00')
  return !isNaN(date.getTime())
}

export const parseDate = (dateStr) => {
  if (!isValidDate(dateStr)) return null
  const [year, month, day] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

export const calculateNights = (checkInStr, checkOutStr) => {
  const checkIn = parseDate(checkInStr)
  const checkOut = parseDate(checkOutStr)

  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return null
  }

  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
}

export const isCheckoutAfterCheckin = (checkInStr, checkOutStr) => {
  const checkIn = parseDate(checkInStr)
  const checkOut = parseDate(checkOutStr)
  return checkOut > checkIn
}

export const getDateString = () => {
  return new Date().toISOString().split('T')[0]
}

export const formatDateDisplay = (dateStr) => {
  if (!isValidDate(dateStr)) return 'Invalid date'
  const date = parseDate(dateStr)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  })
}

export const isDateInPast = (dateStr) => {
  const date = parseDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export const getMinimumCheckoutDate = (checkInStr) => {
  const checkIn = parseDate(checkInStr)
  const nextDay = new Date(checkIn)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay.toISOString().split('T')[0]
}
