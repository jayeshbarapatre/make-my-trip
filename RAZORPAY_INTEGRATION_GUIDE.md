# Razorpay Payment Integration Guide

## Setup Complete ✓

Your Razorpay payment integration is now fully set up and ready to use!

### What Was Added

#### Backend (Node.js/Express)
- **Package**: `razorpay` npm package installed
- **Controller**: `src/controllers/paymentController.js`
  - `createRazorpayOrder()` - Creates payment order via Razorpay API
  - `verifyPayment()` - Verifies payment signature for security
- **Routes**: `src/routes/paymentRoutes.js`
  - `POST /api/v1/payment/create-order` - Requires authentication
  - `POST /api/v1/payment/verify` - Public endpoint for verification
- **Environment Variables** (`.env`):
  - `RAZORPAY_KEY_ID` - Your test key ID
  - `RAZORPAY_KEY_SECRET` - Your test key secret

#### Frontend (React)
- **Service**: `src/services/paymentService.js`
  - `createOrder(amount, notes)` - Backend call to create order
  - `verifyPayment(orderId, paymentId, signature)` - Backend call to verify
- **Component**: `src/components/PaymentButton.jsx`
  - Ready-to-use button component for payments
  - Handles Razorpay checkout modal integration
  - Automatic payment verification
- **HTML**: Added Razorpay Checkout script to `index.html`
- **Environment Variables** (`.env.local`):
  - `VITE_RAZORPAY_KEY_ID` - Public key for frontend

## Usage Example

### Basic Usage in a Booking Page

```jsx
import PaymentButton from '../components/PaymentButton'
import { useState } from 'react'

export default function BookingPage() {
  const [bookingTotal, setBookingTotal] = useState(5000) // Amount in rupees

  const handlePaymentSuccess = (response) => {
    console.log('Payment successful!', response)
    // Create booking in your database
    // Redirect to confirmation page
    toast.success('Payment successful! Booking confirmed.')
    navigate('/booking-confirmation', { state: { bookingId: '...' } })
  }

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error)
    toast.error('Payment failed: ' + error)
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Order Summary</h2>
        <p>Total Amount: ₹{bookingTotal}</p>
        
        <PaymentButton
          amount={bookingTotal}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          bookingDetails={{
            type: 'flight', // 'flight', 'hotel', 'bus', 'cab'
            id: 'BOOKING_123',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '9876543210'
          }}
          buttonText="Pay & Book Now"
          className="btn btn-primary btn-lg w-full"
        />
      </div>
    </div>
  )
}
```

## PaymentButton Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `amount` | number | Yes | Amount to charge in INR (e.g., 5000 for ₹5000) |
| `onPaymentSuccess` | function | No | Callback when payment succeeds. Receives Razorpay response |
| `onPaymentFailure` | function | No | Callback when payment fails. Receives error message |
| `bookingDetails` | object | No | Booking metadata (type, id, name, email, phone) |
| `buttonText` | string | No | Button label (default: "Pay Now") |
| `className` | string | No | Tailwind/DaisyUI classes for button styling |

## Payment Flow

```
1. User clicks "Pay Now" button
   ↓
2. Frontend calls POST /api/v1/payment/create-order
   ↓
3. Backend creates Razorpay order, returns orderId
   ↓
4. Razorpay checkout modal opens
   ↓
5. User enters payment details (test card below)
   ↓
6. Razorpay processes payment
   ↓
7. Frontend receives payment response
   ↓
8. Frontend calls POST /api/v1/payment/verify
   ↓
9. Backend verifies signature with Razorpay secret
   ↓
10. If valid → Success callback (create booking, show confirmation)
    If invalid → Failure callback (show error)
```

## Test Cards for Development

Use these test cards in Razorpay checkout (test mode):

### Success Cards
- **Visa**: 4111 1111 1111 1111
- **MasterCard**: 5555 5555 5555 4444
- **Any 3-digit CVV, Any future expiry date**

### Failed Cards
- **Visa (Decline)**: 4000 0000 0000 0002
- **MasterCard (Decline)**: 5105 1051 0510 5100

## Integration Checklist

- [x] Backend Razorpay setup
- [x] Frontend payment component
- [x] API endpoints created
- [x] Environment variables configured
- [x] Razorpay script loaded in HTML
- [ ] **Next**: Integrate PaymentButton into your booking pages
  - BookingPage.jsx (flights)
  - HotelDetailsPage.jsx (hotels)
  - Checkout components for buses/cabs
- [ ] Test with sample cards above
- [ ] Verify payment signature validation
- [ ] Update booking flow to create booking after payment success

## API Endpoints

### Create Payment Order
```
POST /api/v1/payment/create-order
Headers: Authorization: Bearer {token}
Body: {
  "amount": 5000,
  "currency": "INR",
  "notes": {
    "bookingType": "flight",
    "bookingId": "BK123"
  }
}
Response: {
  "success": true,
  "data": {
    "orderId": "order_Sqpk2eYSSYrvWf",
    "amount": 500000,
    "currency": "INR",
    "receipt": "receipt_1234567890"
  }
}
```

### Verify Payment
```
POST /api/v1/payment/verify
Body: {
  "orderId": "order_Sqpk2eYSSYrvWf",
  "paymentId": "pay_Sqpk2eYSSYrvWf",
  "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
Response: {
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "order_Sqpk2eYSSYrvWf",
    "paymentId": "pay_Sqpk2eYSSYrvWf"
  }
}
```

## Important Security Notes

1. **Never expose secret key**: The `RAZORPAY_KEY_SECRET` is already in backend .env (not in frontend)
2. **Signature verification is mandatory**: Always verify signatures on the backend before creating bookings
3. **Idempotency**: The verify endpoint doesn't create anything—it just validates. Your booking controller should handle creation.
4. **Test mode**: Your current keys are in test mode. Update them before going to production.

## Environment Variables Reference

### Backend (.env)
```
RAZORPAY_KEY_ID=rzp_test_Sqpk2eYSSYrvWf
RAZORPAY_KEY_SECRET=umxn1sNhqHnT6GUwbzIoztNH
```

### Frontend (.env.local)
```
VITE_RAZORPAY_KEY_ID=rzp_test_Sqpk2eYSSYrvWf
```

## Next Steps

1. **Integrate into Booking Pages**:
   - Import `PaymentButton` in your booking/checkout components
   - Pass booking amount and details
   - Handle success/failure callbacks

2. **Update Booking Controller**:
   - After payment verification succeeds, create booking record
   - Store paymentId in booking for reference
   - Send confirmation email with booking details

3. **Test Thoroughly**:
   - Use test cards provided above
   - Test success and failure scenarios
   - Check that bookings are created only after verification

4. **Production Readiness**:
   - Replace test keys with live keys from Razorpay dashboard
   - Update `NODE_ENV` check if needed
   - Enable HTTPS (required for production)
   - Set up email confirmations
   - Monitor payment failures and retries

## Troubleshooting

### "Razorpay SDK is not loaded"
- Ensure `index.html` has the Razorpay script loaded
- Check browser console for CSP errors
- Verify internet connection for script loading

### "Invalid signature" error
- Verify `RAZORPAY_KEY_SECRET` is correct in backend .env
- Check that signature is passed correctly from frontend
- Ensure no whitespace or encoding issues in secret

### Amount mismatch
- Frontend amount is in rupees (e.g., 5000)
- Backend converts to paise (multiply by 100)
- Ensure frontend and backend amounts match

## Support

For Razorpay API docs: https://razorpay.com/docs/api/orders/
For payment verification: https://razorpay.com/docs/payments/payment-gateway/web-integration/verify-payments/
