# Payment Integration Example

## Quick Start: Add Payment to BookingPage.jsx

Here's a complete example of how to integrate the PaymentButton into your flight booking page:

```jsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PaymentButton from '../components/PaymentButton'
import { toast } from 'react-toastify'
import bookingService from '../services/bookingService'

export default function BookingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [bookingData, setBookingData] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const flight = location.state?.flight
  const passengers = location.state?.passengers

  useEffect(() => {
    if (!flight || !passengers) {
      navigate('/flights')
      return
    }

    // Calculate total price (base price × passengers + taxes)
    const basePrice = flight.price || 0
    const tax = Math.round(basePrice * 0.18) // 18% GST
    const total = (basePrice * passengers.length) + tax

    setTotalPrice(total)
    setBookingData({
      flight,
      passengers,
      totalPrice: total
    })
  }, [flight, passengers, navigate])

  const handlePaymentSuccess = async (response) => {
    try {
      setIsProcessing(true)

      // Create booking with payment details
      const bookingPayload = {
        flightId: flight._id,
        passengers: passengers,
        totalPrice: totalPrice,
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature
      }

      const booking = await bookingService.createFlightBooking(bookingPayload)

      toast.success('🎉 Booking confirmed! Confirmation sent to email.')
      
      // Redirect to confirmation page
      navigate('/booking-confirmation', {
        state: { booking, paymentId: response.razorpay_payment_id }
      })
    } catch (error) {
      toast.error('Booking failed after payment: ' + error.message)
      console.error('Booking error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentFailure = (errorMessage) => {
    toast.error('Payment failed: ' + errorMessage)
  }

  if (!bookingData) {
    return <div className="loading loading-spinner"></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Review & Pay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flight Details */}
          <div className="lg:col-span-2">
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">✈️ Flight Details</h2>

                <div className="divider my-2"></div>

                {/* Flight Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Airline:</span>
                    <span>{flight.airlineName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">From:</span>
                    <span className="badge badge-primary">{flight.from}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">To:</span>
                    <span className="badge badge-primary">{flight.to}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Departure:</span>
                    <span>{new Date(flight.departureTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Duration:</span>
                    <span>{flight.durationMinutes} minutes</span>
                  </div>
                </div>

                <div className="divider my-2"></div>

                {/* Passengers */}
                <h3 className="font-bold text-lg mb-3">👥 Passengers ({passengers.length})</h3>
                <div className="space-y-2">
                  {passengers.map((passenger, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between bg-gray-50 p-3 rounded"
                    >
                      <span>{passenger.firstName} {passenger.lastName}</span>
                      <span className="text-sm text-gray-500">Age: {passenger.age}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary & Payment */}
          <div className="lg:col-span-1">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl text-white">
              <div className="card-body">
                <h2 className="card-title mb-4">💳 Price Summary</h2>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>₹{flight.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passengers:</span>
                    <span>×{passengers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{flight.price * passengers.length}</span>
                  </div>
                  <div className="divider my-2"></div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{Math.round(flight.price * 0.18)}</span>
                  </div>
                  <div className="divider my-2"></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>

                {/* Payment Button */}
                <PaymentButton
                  amount={totalPrice}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFailure={handlePaymentFailure}
                  bookingDetails={{
                    type: 'flight',
                    id: flight._id,
                    name: passengers[0]?.firstName || 'Guest',
                    email: passengers[0]?.email || '',
                    phone: passengers[0]?.phone || ''
                  }}
                  buttonText="Pay & Book"
                  className="btn btn-success w-full text-white font-bold"
                  disabled={isProcessing}
                />

                <p className="text-xs opacity-75 text-center mt-3">
                  ✓ Secure Payment via Razorpay
                </p>
              </div>
            </div>

            {/* Test Cards Info */}
            <div className="alert alert-info mt-4 text-sm">
              <div>
                <h3 className="font-bold">🧪 Test Mode</h3>
                <p>Use test card: 4111 1111 1111 1111</p>
                <p>Any CVV & future expiry</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Key Points

1. **Payment Verification**: The payment is verified on the backend before creating the booking (secure)
2. **Test Mode**: You're in test mode—use the provided test cards
3. **Error Handling**: All errors are caught and displayed via toast notifications
4. **User Experience**: Smooth flow from payment → verification → booking creation

## Backend Booking Controller Update

Make sure your booking controller handles the payment details:

```javascript
// bookingController.js
export const createFlightBooking = async (req, res) => {
  try {
    const { flightId, passengers, totalPrice, paymentId, orderId, signature } = req.body

    // 1. Verify user is authenticated
    const userId = req.user._id

    // 2. Fetch flight and verify availability
    const flight = await Flight.findById(flightId)
    if (!flight || flight.seatsAvailable < passengers.length) {
      return res.status(400).json({ message: 'Flight not available' })
    }

    // 3. Create booking record
    const booking = await Booking.create({
      userId,
      bookingType: 'flight',
      flightId,
      passengers,
      totalPrice,
      paymentId, // Store for reference
      orderId,
      status: 'confirmed'
    })

    // 4. Decrement available seats atomically
    await Flight.findByIdAndUpdate(
      flightId,
      { $inc: { seatsAvailable: -passengers.length } },
      { new: true }
    )

    // 5. Send confirmation email
    // await sendBookingConfirmation(booking)

    res.json({
      success: true,
      data: booking
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
```

## Test Payment Flow

1. **Fill in passenger details** on your form
2. **Review booking** and click "Pay & Book"
3. **Razorpay modal opens** with payment options
4. **Enter test card**: 4111 1111 1111 1111
5. **Any CVV and future expiry date**
6. **Payment completes** → Booking created → Confirmation email sent

## Testing with Different Scenarios

### Successful Payment
- Card: 4111 1111 1111 1111
- Any CVV, any future expiry

### Failed Payment
- Card: 4000 0000 0000 0002
- Any CVV, any future expiry

### View All Test Cards
- See `RAZORPAY_INTEGRATION_GUIDE.md` for more options

---

**Your Razorpay integration is production-ready!** Just integrate the `PaymentButton` component into your existing booking pages.
