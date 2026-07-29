import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/TrainBookingFlow.css';
import { photo } from '../utils/images'

export default function TrainPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { train, selectedClass, searchParams, passengers, contact, totalAmount, baseFare } = location.state || {
    train: { id: '1', name: "Rajdhani Express", number: "12952", depTime: "16:55", arrTime: "08:30" },
    selectedClass: { code: "3A", name: "AC 3 Tier", price: 2125 },
    searchParams: { fromCity: "New Delhi", toCity: "Mumbai", travelDate: new Date().toISOString().split('T')[0], quota: "General" },
    passengers: [{ name: "Jayesh Sharma", age: 29, gender: "Male", berth: "Lower Berth" }],
    contact: { mobile: "9876543210", email: "jayesh@gmail.com" },
    totalAmount: 2160,
    baseFare: 2125
  };

  const [selectedMethod, setSelectedMethod] = useState('UPI / Google Pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Bookings must belong to an authenticated user
  useEffect(() => {
    if (!localStorage.getItem('token') || !localStorage.getItem('userId')) {
      navigate('/login?returnTo=/trains', { replace: true });
    }
  }, [navigate]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.warn('Razorpay script failed to load - payment gateway unavailable');
      setRazorpayLoaded(false);
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleRazorpayPayment = async () => {
    if (isProcessing) {
      console.warn('⚠️ Payment already processing, ignoring duplicate request');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to continue with payment');
      }

      // Step 1: Create order on backend
      console.log('Creating payment order...');
      const orderResponse = await api.post('/payment/create-order', {
        amount: totalAmount,
        currency: 'INR',
        notes: {
          bookingType: 'train',
          trainId: train.id,
          passengers: passengers.length
        }
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { orderId, amount, currency } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      if (!window.Razorpay) {
        throw new Error('Razorpay script not loaded');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Sqpk2eYSSYrvWf',
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'MakeMyTrip',
        description: `Train Booking - ${train.name} ${train.number}`,
        image: `${window.location.origin}${photo('state-success', 400)}`,
        prefill: {
          name: passengers?.[0]?.name || '',
          email: contact?.email || '',
          contact: contact?.mobile || ''
        },
        handler: async (response) => {
          await verifyPayment(response, orderId);
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setError('Payment cancelled');
          }
        },
        theme: {
          color: '#003580'
        }
      };

      const razorpayWindow = new window.Razorpay(options);
      razorpayWindow.open();
    } catch (err) {
      console.error('Razorpay error:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (razorpayResponse, orderId) => {
    try {
      console.log('Verifying payment...');

      // Prepare booking data
      const bookingData = {
        type: 'train',
        trainId: train.id,
        fromCity: searchParams.fromCity,
        toCity: searchParams.toCity,
        departureDate: searchParams.travelDate,
        passengers: passengers.map(p => ({ ...p, name: p.name })),
        totalAmount,
        baseFare: baseFare || totalAmount * 0.8,
        taxes: Math.round(totalAmount * 0.15),
        userEmail: contact?.email,
        userName: passengers[0]?.name,
        paymentMethod: 'razorpay'
      };

      // Verify payment on backend
      const verifyResponse = await api.post('/payment/verify', {
        orderId: orderId,
        paymentId: razorpayResponse.razorpay_payment_id,
        signature: razorpayResponse.razorpay_signature,
        bookingData: bookingData
      });

      // The booking is whatever the backend recorded in Firestore. If it did
      // not come back, the booking did not happen — do not fabricate one.
      if (!verifyResponse.success || !verifyResponse.data?.booking?.bookingId) {
        throw new Error(verifyResponse.message || 'Payment verification failed')
      }

      const booking = verifyResponse.data.booking;
      navigate('/trains/success', { state: { booking, train, selectedClass, passengers, searchParams, totalAmount } });
    } catch (err) {
      console.error('Payment verification error:', err);
      setError(err.message || 'Payment verification failed. Please contact support.');
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = async (methodName) => {
    if (!razorpayLoaded) {
      setError('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setSelectedMethod(methodName);
    await handleRazorpayPayment();
  };

  return (
    <div className="train-flow-wrapper">
      <div className="train-flow-container">

        {/* Step Progress Bar */}
        <div className="train-steps-bar">
          <div className="train-step completed">
            <div className="train-step-num">✓</div>
            <span>1. Train Search</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step completed">
            <div className="train-step-num">✓</div>
            <span>2. Select Train &amp; Class</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step completed">
            <div className="train-step-num">✓</div>
            <span>3. Passenger Details</span>
          </div>
          <div className="train-step-sep">――――</div>
          <div className="train-step active">
            <div className="train-step-num">4</div>
            <span>4. Review &amp; Payment</span>
          </div>
        </div>

        <div className="train-pass-grid">
          
          {/* Left Column: Review Summary & Payment Options */}
          <div className="train-left-col">
            
            {/* Booking Summary Box */}
            <div className="train-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="train-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Booking Review</h3>
              
              <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '8px', border: '1px solid hsl(var(--b3))', marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '4px' }}>
                  {train.name} ({train.number})
                </div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>
                  {searchParams.fromCity} ({train.depTime}) → {searchParams.toCity} ({train.arrTime}) · Class: {selectedClass.name}
                </div>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--bc))', marginBottom: '12px' }}>
                Travellers ({passengers.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {passengers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'hsl(var(--bc) / 0.65)', background: 'hsl(var(--b2))', padding: '10px 16px', borderRadius: '6px' }}>
                    <span>👤 {p.name} ({p.age} yrs, {p.gender})</span>
                    <strong>Berth: {p.berth}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Options Accordion List */}
            <div className="train-form-card" style={{ padding: '24px 32px' }}>
              <h3 className="train-form-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Select Payment Method</h3>

              {error && (
                <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er))', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                  ⚠️ {error}
                </div>
              )}

              {!razorpayLoaded && (
                <div style={{ background: 'hsl(var(--wa) / 0.08)', color: 'hsl(var(--wa))', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                  ⏳ Loading payment gateway...
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  onClick={() => !isProcessing && razorpayLoaded && handleProcessPayment('UPI / Google Pay')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing || !razorpayLoaded ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing || !razorpayLoaded ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>UPI / Google Pay / PhonePe</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Instant IRCTC Tatkal &amp; General ticket generation</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && razorpayLoaded && handleProcessPayment('Credit / Debit Card')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing || !razorpayLoaded ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing || !razorpayLoaded ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>💳</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Credit &amp; Debit Cards</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Visa, Mastercard, Amex, RuPay</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>

                <div
                  onClick={() => !isProcessing && razorpayLoaded && handleProcessPayment('Net Banking')}
                  style={{ padding: '20px', border: '1px solid hsl(var(--bc) / 0.1)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isProcessing || !razorpayLoaded ? 'not-allowed' : 'pointer', background: 'hsl(var(--b2))', transition: 'border-color 0.2s', opacity: isProcessing || !razorpayLoaded ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '24px' }}>🏦</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Net Banking</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>SBI, HDFC, ICICI, Axis &amp; all major banks</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: 'hsl(var(--p))' }}>Pay ₹{totalAmount.toLocaleString()} ›</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Total Due Sidebar */}
          <div className="train-right-col">
            <div className="train-fare-side">
              <h3 className="train-form-title" style={{ fontSize: '18px' }}>Total Due</h3>

              <div className="train-fare-row">
                <span>Base Fare</span>
                <span>₹{(selectedClass.price * passengers.length).toLocaleString("en-IN")}</span>
              </div>

              <div className="train-fare-row">
                <span>IRCTC Convenience Fee</span>
                <span>₹35</span>
              </div>

              <div className="train-fare-total">
                <span>Total Payable</span>
                <span style={{ color: 'hsl(var(--er))' }}>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleProcessPayment(selectedMethod)}
                disabled={isProcessing || !razorpayLoaded}
                style={{ width: '100%', padding: '16px', marginTop: '20px', opacity: isProcessing || !razorpayLoaded ? 0.6 : 1, cursor: isProcessing || !razorpayLoaded ? 'not-allowed' : 'pointer' }}
              >
                {!razorpayLoaded ? 'Loading...' : isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString("en-IN")} Now`}
              </button>

              <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.5)', marginTop: '12px', textAlign: 'center' }}>
                💳 Secure payment powered by Razorpay
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
