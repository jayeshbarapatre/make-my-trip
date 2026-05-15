import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/HotelPaymentPage.css';

export default function HotelPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Retrieve state or fallback values
  const hotel = location.state?.hotel || {
    id: "hotel-fallback",
    name: "Axiom Resort Luxury Cottages, Arambol",
    locality: "Arambol, Goa",
    price: 5000,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=240&h=180&q=80"
  };

  const roomName = location.state?.roomName || "Premium room with Pool view";
  const checkIn = location.state?.checkIn || "2026-05-15";
  const checkOut = location.state?.checkOut || "2026-05-16";
  const guests = location.state?.guests || "2 Adults | 1 Room";
  const totalAmount = location.state?.totalAmount || 4760;

  const [secureAdded, setSecureAdded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('UPI');

  const finalDue = secureAdded ? totalAmount + 59 : totalAmount;

  const handleProcessPayment = (methodName) => {
    // Generate confirmed booking payload
    const newBooking = {
      id: "bkg_hotel_" + Date.now(),
      userId: user?.id || 'usr_1111-2222-3333-4444',
      type: "hotel",
      fromCity: `${hotel.name} - ${roomName}`,
      toCity: `${hotel.locality}`,
      departureDate: checkIn,
      returnDate: checkOut,
      travellers: { guests, rooms: 1, adults: 2, method: methodName || selectedMethod },
      totalAmount: finalDue,
      status: "confirmed",
      bookingId: "MMT-HT-" + Math.floor(100000 + Math.random() * 900000),
      pnr: "HTL-" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('user_bookings_hotel') || '[]');
    localStorage.setItem('user_bookings_hotel', JSON.stringify([newBooking, ...existing]));

    navigate('/hotels/success', { state: { booking: newBooking, hotel } });
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
                    <img src={hotel.img} alt={hotel.name} className="pmt-prop-thumb" />
                    <div className="pmt-prop-text">
                      <h3>{hotel.name}</h3>
                      <p className="pmt-meta">{checkIn} - {checkOut} · {guests}</p>
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
                    style={{ background: secureAdded ? '#10b981' : '#2563eb' }}
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
                <span>Hotel Fare</span>
                <span>₹ {(finalDue - 510).toLocaleString("en-IN")}</span>
              </div>

              <div className="pmt-due-row">
                <span>Service Fees</span>
                <span>₹ 297</span>
              </div>

              <div className="pmt-due-row" style={{ marginBottom: 0 }}>
                <span>Taxes</span>
                <span>₹ 213</span>
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
                  <path d="M10 10h25v25H10zM15 15h15v15H15zM65 10h25v25H65zM70 15h15v15H70zM10 65h25v25H10zM15 70h15v15H15z" fill="#0f172a"/>
                  <rect x="40" y="20" width="10" height="10" fill="#0f172a"/>
                  <rect x="50" y="40" width="10" height="10" fill="#0f172a"/>
                  <rect x="40" y="60" width="15" height="10" fill="#0f172a"/>
                  <rect x="70" y="50" width="10" height="15" fill="#0f172a"/>
                  <rect x="80" y="70" width="10" height="20" fill="#0f172a"/>
                  <rect x="60" y="80" width="15" height="10" fill="#0f172a"/>
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
