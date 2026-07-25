import React, { useState, useEffect } from 'react';
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

  const [selectedMethod, setSelectedMethod] = useState('UPI');

  const handleProcessPayment = async (methodName) => {
    if (!user) {
      setToastMessage('Please login to continue booking');
      setTimeout(() => setToastMessage(''), 3500);
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
              headers: { 'Content-Type': 'application/json' },
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
              userId: user?.id || 'usr_1111-2222-3333-4444',
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

            const bookingResponse = await api.post('/bookings', bookingPayload);
            console.log('✓ Cab booking created!', bookingResponse);

            const bookingData = {
              ...bookingResponse,
              pnr: bookingResponse.pnr || 'CAB-' + Math.floor(100000 + Math.random() * 900000),
              bookingId: bookingResponse.bookingId || 'MMT-CB-' + Math.floor(100000 + Math.random() * 900000),
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
    <div className="flight-flow-wrapper">
      <div className="flight-flow-container">

        {/* Step Progress Bar */}
        <div className="flight-steps-bar">
          <div className="flight-step completed">
            <div className="flight-step-num">✓</div>
            <span>1. Search Cab</span>
          </div>
          <div className="flight-step-sep">――――</div>
          <div className="flight-step completed">
            <div className="flight-step-num">✓</div>
            <span>2. Select Cab</span>
          </div>
          <div className="flight-step-sep">――――</div>
          <div className="flight-step active">
            <div className="flight-step-num">3</div>
            <span>3. Payment</span>
          </div>
        </div>

        <div className="flight-pass-grid">

          {/* Left Column: Review Summary & Payment Options */}
          <div className="flight-left-col">

            {/* Booking Summary Box */}
            <div className="flight-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="flight-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Booking Review</h3>

              <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '4px' }}>
                  {cab.type} - {cab.model}
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>
                  📍 {pickupLocation} → {dropLocation}
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)', marginTop: '8px' }}>
                  📏 {distance} · ⏱️ {estimatedTime}
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '12px' }}>
                Driver Details
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'hsl(var(--bc) / 0.65)', background: 'hsl(var(--b2))', padding: '10px 16px', borderRadius: '6px' }}>
                  <span>👤 {cab.driver}</span>
                  <strong>⭐ {cab.rating}</strong>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="flight-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="flight-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Select Payment Method</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  onClick={() => !isProcessing && handleProcessPayment('UPI')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', opacity: isProcessing ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>UPI / Google Pay</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Instant booking confirmation</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && handleProcessPayment('Card')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', opacity: isProcessing ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>💳</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Credit & Debit Cards</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Visa, Mastercard, Amex</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Total Due Sidebar */}
          <div className="flight-right-col">
            <div className="flight-fare-side">
              <h3 className="flight-form-title" style={{ fontSize: '18px' }}>Total Due</h3>

              <div className="flight-fare-row">
                <span>Base Fare</span>
                <span>₹{baseFare.toLocaleString("en-IN")}</span>
              </div>

              <div className="flight-fare-row">
                <span>Taxes & Fees</span>
                <span>₹{(totalAmount - baseFare).toLocaleString("en-IN")}</span>
              </div>

              <div className="flight-fare-total">
                <span>Total Payable</span>
                <span style={{ color: 'hsl(var(--er))' }}>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleProcessPayment()}
                disabled={isProcessing}
                style={{ width: '100%', padding: '16px', marginTop: '20px', opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              >
                {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString("en-IN")} Now`}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
