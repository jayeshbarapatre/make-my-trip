import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/HotelPaymentPage.css';

export default function CabPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=' + encodeURIComponent(location.pathname), { replace: true });
    }
  }, [user, navigate, location.pathname]);

  const cab = location.state?.cab || {
    id: "cab-fallback",
    type: "Sedan",
    model: "Maruti Swift",
    licensePlate: "MH01AB1234",
    rating: 4.8,
    driver: "Rajesh Kumar",
    price: 450,
  };

  const pickupLocation = location.state?.pickupLocation || "Delhi Airport";
  const dropLocation = location.state?.dropLocation || "Connaught Place";
  const distance = location.state?.distance || "25 km";
  const estimatedTime = location.state?.estimatedTime || "45 mins";
  const totalAmount = location.state?.totalAmount || 567;
  const baseFare = location.state?.baseFare || 450;

  const [_selectedMethod, _setSelectedMethod] = useState('UPI');

  const handleProcessPayment = async (_methodName) => {
    if (!user) {
      setToastMessage('Please login to continue booking');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    if (isProcessing) {
      console.warn('⚠️ Payment already processing, ignoring duplicate request');
      return;
    }

    setIsProcessing(true);
    console.log('🚖 Starting cab booking payment process...');

    try {
      // Step 1: Create Razorpay order
      console.log('📋 Creating Razorpay order for amount:', totalAmount);

      const orderResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'INR',
          notes: {
            bookingType: 'cab',
            cabId: cab.id,
            distance: distance,
          }
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      console.log('✓ Order created:', orderData.data);

      if (!orderData.success || !orderData.data?.orderId) {
        throw new Error('Invalid order response from server');
      }

      // Step 2: Check Razorpay SDK
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      // Step 3: Open Razorpay checkout
      const razorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderData.data.orderId,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'MakeMyTrip',
        description: `${cab.type} - ${pickupLocation} to ${dropLocation}`,

        handler: async (response) => {
          console.log('✓ Payment successful!', response);

          try {
            // Step 4: Verify payment
            console.log('🔐 Verifying payment...');

            const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) throw new Error('Payment verification failed');

            const verifyData = await verifyResponse.json();
            console.log('✓ Payment verified!', verifyData);

            if (!verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            // Step 5: Create booking
            console.log('📝 Creating cab booking...');

            const bookingPayload = {
              userId: user.id,
              type: 'cab',
              cabType: cab.type,
              pickupLocation,
              dropLocation,
              distance,
              estimatedTime,
              totalAmount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              driverName: cab.driver,
              cabModel: cab.model,
              licensePlate: cab.licensePlate,
              userEmail: user?.email,
              userName: user?.name,
              // ✅ ENRICHED CAB FIELDS
              fromCity: pickupLocation,
              toCity: dropLocation,
              departureDate: new Date().toISOString().split('T')[0],
              returnDate: new Date().toISOString().split('T')[0],
              travellers: {
                passengers: 1,
                type: cab.type
              },
              baseFare: totalAmount * 0.8,
              taxes: totalAmount * 0.15,
              convenience: totalAmount * 0.05,
              discount: 0,
              gst: totalAmount * 0.05,
              paymentMethod: 'credit_card',
              paymentStatus: 'completed',
              transactionId: response.razorpay_payment_id
            };

            const bookingResponse = await api.post('/bookings/create', bookingPayload);
            console.log('✓ Cab booking created!', bookingResponse);

            // api interceptor unwraps res.data — the created booking lives in .data
            const createdBooking = bookingResponse?.data || bookingResponse;
            if (!createdBooking?.bookingId) {
              throw new Error('The booking could not be confirmed.');
            }

            const bookingData = {
              ...createdBooking,
              paymentId: response.razorpay_payment_id
            };

            navigate('/cab/success', {
              state: {
                booking: bookingData,
                cab,
                pickupLocation,
                dropLocation,
                distance,
                estimatedTime,
                totalAmount,
                baseFare
              }
            });

            setToastMessage('✓ Booking confirmed! Check your email for details.');
            setTimeout(() => setToastMessage(''), 3500);

          } catch (err) {
            console.error('❌ Payment verification/booking error:', err);
            setToastMessage('Payment verified but booking failed: ' + err.message);
            setTimeout(() => setToastMessage(''), 5000);
            setIsProcessing(false);
          }
        },

        prefill: {
          name: user?.name || 'Guest User',
          email: user?.email || '',
          contact: user?.phone || ''
        },

        notes: {
          bookingType: 'cab',
          pickupLocation,
          dropLocation,
          distance
        },

        theme: { color: '#003580' },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment cancelled');
            setToastMessage('Payment cancelled. Please try again.');
            setTimeout(() => setToastMessage(''), 3500);
            setIsProcessing(false);
          }
        }
      };

      console.log('🔓 Opening Razorpay checkout...');
      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();

    } catch (err) {
      console.error('Payment error:', err);
      setToastMessage('Error: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ background: 'hsl(var(--b2))', minHeight: '100vh', padding: '40px 0 80px', fontFamily: "'Space Grotesk', sans-serif", color: 'hsl(var(--bc))' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Step Progress Bar */}
        <div style={{ width: '100%', boxSizing: 'border-box', background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b2))', borderRadius: '12px', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: 'hsl(var(--bc))', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--su))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>✓</div>
            <span>1. Search Cab</span>
          </div>
          <div style={{ color: 'hsl(var(--bc) / 0.2)', fontWeight: 900 }}>――――</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: 'hsl(var(--bc))', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--su))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>✓</div>
            <span>2. Select Cab</span>
          </div>
          <div style={{ color: 'hsl(var(--bc) / 0.2)', fontWeight: 900 }}>――――</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, color: 'hsl(var(--p))', fontSize: '14px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'hsl(var(--p))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: 'white' }}>3</div>
            <span>3. Payment</span>
          </div>
        </div>

        {/* Main Payment Layout - 3 Column */}
        <form onSubmit={(e) => { e.preventDefault(); handleProcessPayment(); }} style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '2rem', marginBottom: '2rem' }}>

          {/* Left Column: Payment Options */}
          <div>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>SELECT PAYMENT MODE</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid hsl(var(--p))',
                background: 'hsl(var(--b1))',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <input type="radio" name="payment" value="upi" defaultChecked style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📱 UPI (GPay, PhonePe, BHIM)</span>
              </label>

              <label style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid hsl(var(--b2))',
                background: 'hsl(var(--b1))',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <input type="radio" name="payment" value="card" style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>💳 Credit / Debit Card</span>
              </label>

              <label style={{
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid hsl(var(--b2))',
                background: 'hsl(var(--b1))',
                cursor: 'pointer',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <input type="radio" name="payment" value="wallet" style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>👜 Wallets</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => navigate(-1)} style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid hsl(var(--b2))',
                  background: 'hsl(var(--b1))',
                  color: 'hsl(var(--bc))',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}>
                  ← Back
                </button>
              </div>
            </div>
          </div>

          {/* Center Column: Cab Details */}
          <div style={{ background: 'hsl(var(--b1))', padding: '2rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--b2))' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>CAB BOOKING DETAILS</h3>

            <div style={{ background: 'hsl(var(--b2))', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, color: 'hsl(var(--bc))', marginBottom: '0.5rem', fontSize: '1rem' }}>
                {cab.type} • {cab.model}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'hsl(var(--nc))', marginBottom: '1rem' }}>
                License: {cab.licensePlate}
              </div>

              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>📍 Pickup</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{pickupLocation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>📍 Drop-off</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{dropLocation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>📏 Distance</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{distance}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'hsl(var(--nc))' }}>⏱️ Duration</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>{estimatedTime}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'hsl(var(--b2))', padding: '1.5rem', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'hsl(var(--bc))' }}>DRIVER INFORMATION</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--bc))' }}>👤 {cab.driver}</div>
                  <div style={{ fontSize: '0.85rem', color: 'hsl(var(--nc))' }}>{cab.type} Driver</div>
                </div>
                <div style={{ fontWeight: 700, color: 'hsl(var(--su))', fontSize: '1.1rem' }}>⭐ {cab.rating}</div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Booking Summary */}
          <div style={{ background: 'hsl(var(--b1))', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--b2))', height: 'fit-content', position: 'sticky', top: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>BOOKING SUMMARY</h3>

            {/* Price Breakdown */}
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--b2))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>
                <span>Base Fare</span>
                <span>₹{baseFare.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>
                <span>Taxes & Fees</span>
                <span>₹{(totalAmount - baseFare).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--p))' }}>
              <span>Payable Amt:</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>

            <button type="submit" disabled={isProcessing} style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'hsl(var(--p))',
              color: 'white',
              fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              opacity: isProcessing ? 0.6 : 1
            }}>
              {isProcessing ? 'Processing...' : `PAY NOW ₹${totalAmount.toLocaleString("en-IN")}`}
            </button>
          </div>

        </form>
      </div>

      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: 'hsl(var(--n))', color: 'hsl(var(--nc))',
          padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          fontSize: '14px', fontWeight: 600, maxWidth: '340px'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
