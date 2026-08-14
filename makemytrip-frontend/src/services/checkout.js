import api from './api'

// The single client-side checkout flow.
//
// It replaces three overlapping implementations (paymentService, razorpayService
// and inline fetch calls in each payment page) that each computed their own
// total with different tax rates and posted that figure to the server. The
// server now prices every trip; this module only displays what it is told and
// hands back the signed quote.

export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

const messageFor = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback

/**
 * Asks the server what a trip costs.
 *
 * @returns {Promise<{baseFare, taxes, gst, convenience, discount, totalAmount,
 *                    currency, policy, quoteToken}>}
 */
export const requestQuote = async ({ type, itemId, quantity = 1, nights = 1, distance = 0 }) => {
  try {
    const body = await api.post('/payment/quote', { type, itemId, quantity, nights, distance })
    const quote = body?.data ?? body
    if (!quote?.quoteToken) throw new Error('The server did not return a price for this trip.')
    return quote
  } catch (err) {
    throw new Error(messageFor(err, 'Could not price this trip. Please try again.'), { cause: err })
  }
}

/**
 * Runs the full charge-and-book sequence against the authoritative quote:
 * create order → Razorpay checkout → verify → booking.
 *
 * The booking is created by the verification endpoint from the amount the
 * gateway actually captured, so nothing here can influence what is charged.
 *
 * @returns {Promise<object>} the confirmed booking document
 */
export const payAndBook = async ({ quote, bookingData, prefill = {}, description }) => {
  const scriptReady = await loadRazorpayScript()
  if (!scriptReady || !window.Razorpay) {
    throw new Error('Could not load the payment gateway. Check your connection and try again.')
  }

  let order
  try {
    // The draft travels with the order so the server can finish the booking from
    // the webhook if this browser never comes back — a closed tab after payment
    // otherwise leaves money captured with no booking. The server strips every
    // field it owns from this, so it is display/traveller data only.
    const body = await api.post('/payment/create-order', {
      quoteToken: quote.quoteToken,
      bookingDraft: bookingData ?? null
    })
    order = body?.data ?? body
  } catch (err) {
    throw new Error(messageFor(err, 'Could not start the payment. Please try again.'), { cause: err })
  }

  if (!order?.orderId) throw new Error('The payment could not be started.')

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: 'TripOra',
      description: description || 'TripOra Booking',
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || ''
      },
      theme: { color: '#003580' },
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled.'))
      },
      handler: async (response) => {
        try {
          const body = await api.post('/payment/verify', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            bookingData
          })

          const result = body?.data ?? body
          const booking = result?.booking

          if (!booking?.bookingId) {
            // The money may well have been taken; never report success without a
            // booking reference the customer can quote to support.
            throw new Error(
              'Your payment went through but the booking could not be confirmed. ' +
              'Please contact support with your payment id: ' + response.razorpay_payment_id
            )
          }

          resolve(booking)
        } catch (err) {
          reject(new Error(messageFor(err, 'Payment verification failed.'), { cause: err }))
        }
      }
    })

    checkout.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'The payment failed.'))
    })

    checkout.open()
  })
}
