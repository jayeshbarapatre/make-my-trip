import api from './api'
import { photo } from '../utils/images'

// Load Razorpay script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true

    script.onload = () => {
      resolve(true)
    }

    script.onerror = () => {
      console.error('Failed to load Razorpay script')
      resolve(false)
    }

    document.body.appendChild(script)
  })
}

// Create payment order
export const createPaymentOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    const response = await api.post('/payment/create-order', {
      amount,
      currency,
      notes
    })

    if (!response.data.success) {
      throw new Error('Failed to create payment order')
    }

    return response.data.data
  } catch (err) {
    console.error('Order creation error:', err)
    throw err
  }
}

// Verify payment
export const verifyPayment = async (orderId, paymentId, signature, bookingData) => {
  try {
    const response = await api.post('/payment/verify', {
      orderId,
      paymentId,
      signature,
      bookingData
    })

    if (!response.data.success) {
      throw new Error('Payment verification failed')
    }

    return response.data.data
  } catch (err) {
    console.error('Payment verification error:', err)
    throw err
  }
}

// Open Razorpay checkout
export const openRazorpayCheckout = (options) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay not loaded')
  }

  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay({
      ...options,
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled'))
        },
        ...options.modal
      }
    })

    razorpay.open()
  })
}

// Complete payment flow
export const processPayment = async (amount, bookingData, onHandler) => {
  // Step 1: Create order
  const order = await createPaymentOrder(amount, 'INR', {
    bookingType: bookingData.type,
    ...bookingData
  })

  // Step 2: Prepare checkout options
  const options = {
    // No hardcoded fallback: a key baked into the bundle ships to every browser
    // and silently outlives its rotation at the provider.
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: 'MakeMyTrip',
    description: bookingData.description || 'MakeMyTrip Booking',
    image: `${window.location.origin}${photo('state-success', 400)}`,
    prefill: {
      name: bookingData.userName || '',
      email: bookingData.userEmail || '',
      contact: bookingData.userPhone || ''
    },
    theme: {
      color: '#003580'
    }
  }

  // Step 3: Open checkout
  const razorpay = new window.Razorpay(options)

  // Handle success
  razorpay.on('payment.success', async (response) => {
    await onHandler(response, order.orderId)
  })

  // Handle failure
  razorpay.on('payment.failed', (response) => {
    throw new Error(`Payment failed: ${response.error.description}`)
  })

  razorpay.open()

  return order
}
