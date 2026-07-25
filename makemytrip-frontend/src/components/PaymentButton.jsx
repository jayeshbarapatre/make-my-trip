import { useState } from 'react'
import paymentService from '../services/paymentService'

const PaymentButton = ({
  amount,
  onPaymentSuccess,
  onPaymentFailure,
  bookingDetails = {},
  buttonText = 'Pay Now',
  className = 'btn btn-primary'
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK is not loaded')
      }

      // Create order on backend
      const orderResponse = await paymentService.createOrder(amount, {
        bookingType: bookingDetails.type || 'flight',
        bookingId: bookingDetails.id || 'N/A'
      })

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order')
      }

      // Initialize Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        order_id: orderResponse.data.orderId,
        name: 'MakeMyTrip',
        description: `Payment for ${bookingDetails.type || 'flight'} booking`,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyResponse = await paymentService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )

            if (verifyResponse.success) {
              onPaymentSuccess?.(response)
            } else {
              onPaymentFailure?.(verifyResponse.message)
            }
          } catch (err) {
            onPaymentFailure?.(err.message)
          }
        },
        prefill: {
          name: bookingDetails.name || 'Guest User',
          email: bookingDetails.email || '',
          contact: bookingDetails.phone || ''
        },
        notes: {
          bookingType: bookingDetails.type || 'flight',
          bookingId: bookingDetails.id || 'N/A'
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
          }
        },
        theme: {
          color: '#003580'
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      setError(err.message)
      onPaymentFailure?.(err.message)
      console.error('Payment error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={isLoading || !amount}
        className={`${className} ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
      {error && <p className="text-error text-sm mt-2">{error}</p>}
    </div>
  )
}

export default PaymentButton
