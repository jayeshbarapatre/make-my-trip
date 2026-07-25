import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/HotelPaymentPage.css';

export default function HotelPaymentPage() {
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

  const defaultImage = "https://images.unsplash.com/photo-1542314831-c53cd4b85d05?auto=format&fit=crop&w=240&h=180&q=80";
  const hotel = location.state?.hotel || {
    id: "hotel-fallback",
    name: "Axiom Resort Luxury Cottages, Arambol",
    locality: "Arambol, Goa",
    price: 5000,
    images: [defaultImage]
  };

  const getImageUrl = (h) => {
    if (h.image) return h.image;
    if (h.images && h.images.length > 0) return h.images[0].includes('unsplash.com') ? h.images[0] : `https://images.unsplash.com/photo-${h.images[0]}?auto=format&fit=crop&w=240&h=180&q=80`;
    if (h.seed && h.seed.length > 0) return h.seed[0].includes('unsplash.com') ? h.seed[0] : `https://images.unsplash.com/photo-${h.seed[0]}?auto=format&fit=crop&w=240&h=180&q=80`;
    if (h.img) return h.img;
    return defaultImage;
  };

  const roomName = location.state?.roomName || "Premium room with Pool view";
  const checkIn = location.state?.checkIn || "2026-05-15";
  const checkOut = location.state?.checkOut || "2026-05-16";
  const guests = location.state?.guests || "2 Adults | 1 Room";
  const guestsObj = location.state?.guestsObj || { adults: 2, rooms: 1 };
  const nights = location.state?.nights || 1;
  const rooms = location.state?.rooms || guestsObj.rooms || 1;
  const totalAmount = location.state?.totalAmount || 4760;
  const bookEntireHotel = location.state?.bookEntireHotel || false;

  const [secureAdded, setSecureAdded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('UPI');

  const finalDue = secureAdded ? totalAmount + 59 : totalAmount;

  // Price breakdown (consistent with Review page: 18% GST)
  const basePrice      = location.state?.basePrice      || Math.round(finalDue / (1 - 0.15 + 0.18) * (1 - 0.15));
  const taxesBreakdown = Math.round(finalDue * 0.18 / 1.18) || Math.round(finalDue * 0.18);
  const serviceFees    = Math.round(finalDue * 0.005) || 297;
  const hotelFare      = finalDue - serviceFees;

  const handleProcessPayment = async (methodName) => {
    if (!user) {
      setToastMessage('Please login to continue booking');
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }

    setIsProcessing(true);
    console.log('🏨 Starting hotel booking payment process...');

    try {
      // Step 1: Create Razorpay order
      console.log('📋 Creating Razorpay order for amount:', finalDue);

      const orderResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: finalDue,
          currency: 'INR',
          notes: {
            bookingType: 'hotel',
            hotelId: hotel.id,
            rooms: rooms,
            nights: nights
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
        description: `${hotel.name} - ${roomName}`,

        handler: async (response) => {
          console.log('✓ Payment successful!', response);

          try {
            // Step 4: Verify payment
            console.log('🔐 Verifying payment...');

            const verifyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            console.log('✓ Payment verified!', verifyData);

            if (!verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            // Step 5: Create booking after successful payment
            console.log('📝 Creating hotel booking...');

            const bookingPayload = {
              userId: user?.id || 'usr_1111-2222-3333-4444',
              type: 'hotel',
              fromCity: hotel.name,
              toCity: hotel.locality || hotel.location || '',
              departureDate: checkIn,
              returnDate: checkOut,
              checkIn,
              checkOut,
              travellers: {
                guests,
                rooms,
                adults: guestsObj.adults,
                method: methodName || selectedMethod,
                roomName,
                bookEntireHotel,
                nights
              },
              passengers: [{
                name: user?.name || 'Guest',
                email: user?.email || ''
              }],
              totalAmount: finalDue,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              hotelName: hotel.name,
              hotelLocality: hotel.locality || hotel.location || '',
              roomName,
              nights,
              rooms,
              userEmail: user?.email,
              userName: user?.name,
              // ✅ ENRICHED HOTEL FIELDS
              baseFare: finalDue * 0.8,
              taxes: finalDue * 0.15,
              convenience: finalDue * 0.05,
              discount: 0,
              gst: finalDue * 0.05,
              // Payment
              paymentMethod: 'credit_card',
              paymentStatus: 'completed',
              transactionId: response.razorpay_payment_id
            };

            const bookingResponse = await api.post('/bookings', bookingPayload);
            console.log('✓ Hotel booking created!', bookingResponse);

            const bookingData = {
              ...bookingResponse,
              pnr: bookingResponse.pnr || 'HTL-' + Math.floor(100000 + Math.random() * 900000),
              bookingId: bookingResponse.bookingId || 'MMT-HT-' + Math.floor(100000 + Math.random() * 900000),
              paymentId: response.razorpay_payment_id
            };

            navigate('/hotels/success', {
              state: {
                booking: bookingData,
                hotel,
                roomName,
                checkIn,
                checkOut,
                guests,
                guestsObj,
                nights,
                rooms,
                totalAmount: finalDue,
                bookEntireHotel
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
          bookingType: 'hotel',
          hotelName: hotel.name,
          rooms: rooms,
          nights: nights
        },

        theme: {
          color: '#003580'
        },

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
      console.error('❌ Payment error:', err);
      setToastMessage(err.message || 'Payment failed. Please try again.');
      setTimeout(() => setToastMessage(''), 3500);
      setIsProcessing(false);
    }
  };

  return (
    <div className="pmt-wrapper">
      <div className="pmt-container">
        <div className="pmt-grid">
          
          {/* ── Left Column ── */}
          <div className="pmt-left-col">
            
            {/* Booking Summary Box */}
            <div className="pmt-card">
              <div className="pmt-summary-box">
                <div className="pmt-summary-top">
                  <div className="pmt-prop-info">
                    <img src={getImageUrl(hotel)} alt={hotel.name} className="pmt-prop-thumb" />
                    <div className="pmt-prop-text">
                      <h3>{hotel.name}</h3>
                      <p className="pmt-meta">{checkIn} - {checkOut} · {nights} Night{nights !== 1 ? 's' : ''} · {rooms} Room{rooms !== 1 ? 's' : ''} · {guests}</p>
                    </div>
                  </div>
                  <span className="pmt-toggle">VIEW DETAILS ∨</span>
                </div>
              </div>

              <div className="pmt-traveller-row">
                <span className="pmt-traveller-lbl">👤 Primary Guest:</span>
                <span>{user ? user.name || "Jayesh Sharma" : "Jayesh Sharma"} ({user ? user.email || "jayesh@gmail.com" : "jayesh@gmail.com"}, +91-9876543210)</span>
              </div>
            </div>

            {/* Login / Saved Payments Promo */}
            {!user && (
              <div className="pmt-card">
                <div className="pmt-login-promo">
                  <div className="pmt-login-text">
                    <h4>Additional discounts and saved payment options</h4>
                    <p>Login to access saved payments and discounts!</p>
                  </div>
                  <button className="pmt-login-btn" onClick={() => alert("Please proceed with payment or login via the header.")}>LOGIN</button>
                </div>
              </div>
            )}

            {/* Trip Secure Banner */}
            <div className="pmt-card">
              <div className="pmt-secure-banner">
                <div>
                  <span className="pmt-sec-badge">Trip Secure | One Plan, Many Benefits</span>
                  <h4 className="pmt-sec-hdr">Enjoy Worry Free Hotel Stay!</h4>
                  <p className="pmt-sec-desc">Covers medical expenses, loss of valuables, hotel cancellations, emergency assistance &amp; more. <span style={{ textDecoration: 'underline' }}>View benefits</span></p>
                </div>
                <div>
                  <button 
                    className="pmt-sec-add" 
                    style={{ background: secureAdded ? 'hsl(var(--su))' : 'hsl(var(--p))' }}
                    onClick={() => setSecureAdded(!secureAdded)}
                  >
                    {secureAdded ? "✓ Added @ ₹59" : "Add @ ₹59"}
                  </button>
                </div>
              </div>
            </div>

            {/* Gift Cards Accordion */}
            <div className="pmt-card">
              <div className="pmt-summary-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
                  <span>💳</span> Gift Cards
                </div>
                <span className="pmt-toggle">VIEW ALL ∨</span>
              </div>
            </div>

            {/* Payment Options Accordion List */}
            <div className="pmt-card">
              <h3 className="pmt-options-title">Payment Options</h3>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('UPI / Google Pay')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">📱</div>
                  <div>
                    <h4 className="pmt-opt-name">UPI Options</h4>
                    <p className="pmt-opt-sub">Pay Directly From Your Bank Account</p>
                  </div>
                </div>
                <span>›</span>
              </div>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('Credit / Debit Card')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">💳</div>
                  <div>
                    <h4 className="pmt-opt-name">Credit &amp; Debit Cards</h4>
                    <p className="pmt-opt-sub">Visa, Mastercard, Amex, Rupay and more</p>
                  </div>
                </div>
                <span>›</span>
              </div>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('EMI Checkout')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">🏷️</div>
                  <div>
                    <h4 className="pmt-opt-name">EMI <span className="pmt-emi-badge">NO COST EMI</span></h4>
                    <p className="pmt-opt-sub">Credit/Debit Card &amp; Cardless EMI available</p>
                  </div>
                </div>
                <span>›</span>
              </div>

              <div className="pmt-option-item" onClick={() => handleProcessPayment('Net Banking')}>
                <div className="pmt-opt-left">
                  <div className="pmt-opt-icon">🏦</div>
                  <div>
                    <h4 className="pmt-opt-name">Net Banking</h4>
                    <p className="pmt-opt-sub">All major banks supported</p>
                  </div>
                </div>
                <span>›</span>
              </div>
            </div>

          </div>

          {/* ── Right Column (Sidebar) ── */}
          <div className="pmt-right-col">
            
            {/* Total Due Card */}
            <div className="pmt-total-card">
              <div className="pmt-due-top">
                <span className="pmt-due-lbl">Total Due</span>
                <span className="pmt-due-val">₹ {finalDue.toLocaleString("en-IN")}</span>
              </div>

              <div className="pmt-due-row">
                <span>Hotel Fare ({rooms} Room{rooms !== 1 ? 's' : ''} × {nights} Night{nights !== 1 ? 's' : ''})</span>
                <span>₹ {hotelFare.toLocaleString("en-IN")}</span>
              </div>

              <div className="pmt-due-row">
                <span>Service Fees</span>
                <span>₹ {serviceFees.toLocaleString("en-IN")}</span>
              </div>

              <div className="pmt-due-row" style={{ marginBottom: 0 }}>
                <span>Taxes</span>
                <span>₹ {taxesBreakdown.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Scan to Pay Card */}
            <div className="pmt-qr-card">
              <h4 className="pmt-qr-hdr">Scan to Pay</h4>
              <p className="pmt-qr-sub">Instant Refund &amp; High Success Rate</p>

              <div className="pmt-qr-box">
                {/* SVG Mock QR Code Graphic */}
                <svg viewBox="0 0 100 100" className="pmt-qr-img">
                  <rect width="100" height="100" fill="#fff"/>
                  <path d="M10 10h25v25H10zM15 15h15v15H15zM65 10h25v25H65zM70 15h15v15H70zM10 65h25v25H10zM15 70h15v15H15z" fill="hsl(var(--bc))"/>
                  <rect x="40" y="20" width="10" height="10" fill="hsl(var(--bc))"/>
                  <rect x="50" y="40" width="10" height="10" fill="hsl(var(--bc))"/>
                  <rect x="40" y="60" width="15" height="10" fill="hsl(var(--bc))"/>
                  <rect x="70" y="50" width="10" height="15" fill="hsl(var(--bc))"/>
                  <rect x="80" y="70" width="10" height="20" fill="hsl(var(--bc))"/>
                  <rect x="60" y="80" width="15" height="10" fill="hsl(var(--bc))"/>
                </svg>
                
                <button className="pmt-qr-overlay-btn" onClick={() => handleProcessPayment('Scan to Pay QR')}>
                  VIEW QR &amp; PAY
                </button>
              </div>

              <div className="pmt-qr-logos">
                <span>🌐 GPay</span>
                <span>⚡ PhonePe</span>
                <span>💳 Paytm</span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
