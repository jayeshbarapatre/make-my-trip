// Pricing calculation utilities for consistent price formatting

const GST_RATE = 0.18 // 18% GST

export const formatPrice = (price) => {
  if (!price || isNaN(price)) return '₹0'
  return '₹' + Number(price).toLocaleString('en-IN')
}

export const parsePriceString = (priceStr) => {
  if (!priceStr) return 0
  return parseFloat(String(priceStr).replace(/[^\d.]/g, '')) || 0
}

export const calculateFlightPrice = (basePrice, passengers = 1) => {
  const subtotal = basePrice * passengers
  const gst = subtotal * GST_RATE
  const total = subtotal + gst

  return {
    basePrice,
    subtotal,
    gst,
    total,
    pricePerPassenger: basePrice
  }
}

export const calculateHotelPrice = (pricePerNight, nights = 1, rooms = 1) => {
  const subtotal = pricePerNight * nights * rooms
  const gst = subtotal * GST_RATE
  const total = subtotal + gst

  return {
    pricePerNight,
    nights,
    rooms,
    subtotal,
    gst,
    total,
    pricePerRoom: pricePerNight
  }
}

export const formatPriceSummary = (pricing) => {
  return {
    baseAmount: formatPrice(pricing.subtotal || pricing.basePrice || 0),
    gst: formatPrice(pricing.gst || 0),
    totalAmount: formatPrice(pricing.total || 0)
  }
}

export const isPriceValid = (price) => {
  const num = parseFloat(price)
  return !isNaN(num) && num > 0 && num <= 1000000
}

export const applyCoupon = (totalPrice, couponCode) => {
  const discounts = {
    FLAT500: 500,
    MMTDOM25: totalPrice * 0.25,
    SAVE100: 100
  }

  const discount = discounts[couponCode] || 0
  const finalPrice = Math.max(0, totalPrice - discount)

  return {
    originalPrice: totalPrice,
    discount,
    finalPrice,
    savingsPercentage: ((discount / totalPrice) * 100).toFixed(1)
  }
}
