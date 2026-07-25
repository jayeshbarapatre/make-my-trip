import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import '../styles/HotelReviewPage.css';

function HotelReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, verifyOtpLogin } = useAuth();

  // Retrieve state or fallback values
  const defaultImage = "https://images.unsplash.com/photo-1542314831-c53cd4b85d05?auto=format&fit=crop&w=240&h=180&q=80";
  const hotel = location.state?.hotel || {
    id: "hotel-fallback",
    name: "Axiom Resort Luxury Cottages, Arambol",
    locality: "Arambol, Goa",
    rating: 4.5,
    ratingLabel: "Excellent",
    reviews: 124,
    price: 5000,
    taxes: 511,
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

  // Calculate nights (with consistent timezone handling)
  const checkInDate = new Date(checkIn + 'T00:00:00');
  const checkOutDate = new Date(checkOut + 'T00:00:00');
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const bookEntireHotel = location.state?.bookEntireHotel || false;
  const rooms = bookEntireHotel ? 10 : (guestsObj.rooms || 1);

  // Calculations matching MakeMyTrip Price Breakup
  const basePrice = bookEntireHotel 
    ? Math.round(hotel.price * ((hotel.rooms || 10) * 0.9) * nights)
    : hotel.price * nights * rooms;
  const discount = Math.round(basePrice * 0.15);       // 15% property discount
  const priceAfterDiscount = basePrice - discount;
  const taxes = Math.round(basePrice * 0.18);          // 18% GST on base price
  const totalAmount = priceAfterDiscount + taxes;

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Auth & Booking submission state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobilePhone, setMobilePhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' // 'success' | 'error'
  });

  const showNotify = (title, message, type = 'success') => {
    setAlertConfig({ show: true, title, message, type });
  };

  const closeNotify = () => {
    setAlertConfig({ ...alertConfig, show: false });
  };
  const [loginError, setLoginError] = useState('');

  const finalizeBooking = () => {
    const finalBilled = totalAmount - appliedDiscount;
    navigate('/hotels/payment', {
      state: {
        hotel,
        roomName,
        checkIn,
        checkOut,
        guests,
        guestsObj,
        nights,
        rooms,
        totalAmount: finalBilled,
        bookEntireHotel
      }
    });
  };

  const handleCompleteBooking = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    finalizeBooking();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobilePhone || mobilePhone.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoginError('');
    try {
      const res = await authService.sendMobileOtp(mobilePhone);
      if (res && (res.data || res.message)) {
        setOtpSent(true);
      } else {
        setLoginError('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setLoginError(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setLoginError('Please enter a valid 6-digit OTP (e.g., 123456)');
      return;
    }
    setLoginError('');
    try {
      await verifyOtpLogin(mobilePhone, otpCode);
      setShowLoginModal(false);
      finalizeBooking();
    } catch (err) {
      setLoginError(err.message || 'Verification failed. Try 123456.');
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    if (couponCode.toUpperCase() === 'MMT500') {
      setAppliedDiscount(500);
      showNotify('Success!', 'Coupon MMT500 applied successfully! ₹500 discount added.', 'success');
    } else {
      showNotify('Invalid Coupon', 'The coupon code you entered is invalid. Please try MMT500.', 'error');
    }
  };

  return (
    <div className="review-wrapper">
      <div className="review-container">
        
        <h1 className="review-header-title">Review your Booking</h1>

        <div className="review-grid">
          
          {/* ── Left Column ── */}
          <div className="rev-left-col">
            
            {/* Property Summary Card */}
            <div className="rev-card">
              <div className="rev-property-top">
                <div className="rev-prop-info">
                  <h2>{hotel.name}</h2>
                  <div className="rev-badges">
                    <span className="rev-stars">★★★★☆</span>
                    <span className="rev-couple-badge">Couple Friendly</span>
                  </div>
                  <p className="rev-address">{hotel.locality}</p>
                </div>
                <img src={getImageUrl(hotel)} alt={hotel.name} className="rev-prop-img" />
              </div>

              {/* Check-in / Check-out Dates */}
              <div className="rev-dates-row">
                <div className="rev-date-box">
                  <span className="rev-date-lbl">Check In</span>
                  <span className="rev-date-val">{checkIn}</span>
                  <span className="rev-time">2 PM</span>
                </div>

                <div className="rev-night-pill">{nights} NIGHT{nights !== 1 ? 'S' : ''}</div>

                <div className="rev-date-box">
                  <span className="rev-date-lbl">Check Out</span>
                  <span className="rev-date-val">{checkOut}</span>
                  <span className="rev-time">11 AM</span>
                </div>
              </div>

              {/* Early Check-in Promo */}
              <div className="rev-early-box">
                <div>
                  <div className="rev-early-lbl">⏱️ Early Check-in/Late Check-out</div>
                  <div className="rev-early-sub">Opt for early check-in/late check-out at an extra cost</div>
                </div>
                <button className="rev-early-btn" onClick={() => showNotify('Time Slot', 'Your early check-in request has been added to the booking.', 'success')}>Add Time Slot</button>
              </div>

              <div className="rev-summary-bar">
                {nights} Night{nights !== 1 ? 's' : ''} | {guests}
              </div>
            </div>

            {/* Room Details Card */}
            <div className="rev-card">
              <div className="rev-room-header">
                <h3>{roomName}</h3>
                <span className="rev-link" onClick={() => showNotify('Room Inclusions', 'Free WiFi, Air Conditioning, Private Balcony, and complimentary Mineral Water are included in this stay.', 'success')}>See Inclusions</span>
              </div>
              <div className="rev-room-sub">2 Adults</div>
              <ul className="rev-room-bullets">
                <li>Room Only</li>
                <li>No meals included</li>
              </ul>
              <div className="rev-non-ref">Non-Refundable</div>
              <div className="rev-non-ref-sub">Refund is not applicable for this booking</div>
              <span className="rev-link" onClick={() => showNotify('Cancellation Policy', 'Refundable up to 24 hours before check-in. 100% penalty applies if cancelled within 24 hours of arrival.', 'success')}>Cancellation policy details</span>
            </div>

            {/* Important Information Card */}
            <div className="rev-card" style={{ marginBottom: 0 }}>
              <h3 className="rev-info-title">Important information</h3>
              
              <div className="rev-rule-box">
                <span className="rev-rule-badge">💖 Couple/Bachelor Rules</span>
                <p className="rev-rule-txt">Unmarried couples allowed. Local ids are allowed</p>
              </div>

              <ul className="rev-info-bullets">
                <li>Primary Guest should be atleast 18 years of age.</li>
                <li>Groups with only male guests are allowed at the property</li>
                <li>Passport, Aadhaar, Driving License and Govt. ID are accepted as ID proof(s)</li>
                <li>Pets are not allowed</li>
              </ul>
            </div>

          </div>

          {/* ── Right Column (Sidebar) ── */}
          <div className="rev-right-col">
            
            {/* Price Breakup Card */}
            <div className="rev-side-card">
              <h3 className="rev-side-title">Price Breakup</h3>
              
              <div className="rev-price-row">
                {bookEntireHotel ? (
                  <span>Base Price (Resort Takeover) <br/><small>All Rooms x {nights} Night{nights !== 1 ? 's' : ''}</small></span>
                ) : (
                  <span>Base Price <br/><small>{rooms} Room{rooms !== 1 ? 's' : ''} x {nights} Night{nights !== 1 ? 's' : ''}</small></span>
                )}
                <span>₹ {basePrice.toLocaleString("en-IN")}</span>
              </div>

              <div className="rev-price-row discount">
                <span>Discount by Property</span>
                <span>- ₹ {discount.toLocaleString("en-IN")}</span>
              </div>

              <div className="rev-price-row after-disc">
                <span>Price after Discount</span>
                <span>₹ {priceAfterDiscount.toLocaleString("en-IN")}</span>
              </div>

              <div className="rev-price-row">
                <span>Taxes &amp; Service Fees ⓘ</span>
                <span>₹ {taxes.toLocaleString("en-IN")}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="rev-price-row discount">
                  <span>Coupon Discount</span>
                  <span>- ₹ {appliedDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="rev-total-box">
                <span>Total Amount to be paid</span>
                <span>₹ {(totalAmount - appliedDiscount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Coupon Card */}
            <div className="rev-side-card">
              <h3 className="rev-side-title" style={{ fontSize: '16px' }}>Coupon Codes</h3>
              <div className="rev-coupon-box">
                <input 
                  type="text" 
                  placeholder="Have A Coupon Code?" 
                  className="rev-coupon-input"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button className="rev-coupon-btn" onClick={handleApplyCoupon}>APPLY</button>
              </div>
              <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '12px' }}>
                Try coupon code <strong style={{color:'hsl(var(--bc))'}}>MMT500</strong> for instant ₹500 off.
              </div>
              <div className="rev-gift-banner">
                MMT Gift Cards can be applied at payment step
              </div>
            </div>

            {/* Why Sign Up Card */}
            {!user && (
              <div className="rev-side-card">
                <div className="rev-why-hdr">WHY <span className="rev-why-lbl">SIGN UP</span> OR <span className="rev-why-lbl">LOGIN</span></div>
                <div className="rev-why-item">✓ <span style={{ color: 'hsl(var(--bc))', fontWeight: 700 }}>Get access to Secret Deals</span></div>
                <div className="rev-why-item">✓ <span style={{ color: 'hsl(var(--bc))', fontWeight: 700 }}>Book Faster</span> - we'll save &amp; pre-enter your details</div>
                <div className="rev-why-item" style={{ marginBottom: 0 }}>✓ <span style={{ color: 'hsl(var(--bc))', fontWeight: 700 }}>Manage your bookings</span> from one place</div>
              </div>
            )}

            {/* Action Pay Button */}
            <button className="rev-pay-btn" onClick={handleCompleteBooking}>
              Pay Now
            </button>

          </div>

        </div>

      </div>

      {/* Simulated Auth Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', width: '90%', maxWidth: '420px', padding: '32px 28px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative', boxSizing: 'border-box' }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'hsl(var(--b2))', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔐</span>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'hsl(var(--bc) / 0.9)' }}>Login to Complete Booking</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--bc) / 0.6)' }}>MakeMyTrip requires verification before booking. Enter your mobile number to instantly login.</p>
            </div>

            {loginError && <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er) / 0.7)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center', fontWeight: 600 }}>{loginError}</div>}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.65)', marginBottom: '6px' }}>MOBILE NUMBER</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ background: 'hsl(var(--b2))', border: '1px solid hsl(var(--b3))', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc) / 0.7)', display: 'flex', alignItems: 'center' }}>+91</span>
                    <input type="tel" placeholder="10-digit mobile number" maxLength={10} value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} style={{ flex: 1, border: '1px solid hsl(var(--b3))', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }} autoFocus required />
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', background: 'hsl(var(--er))', color: 'hsl(var(--b1))', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(235,32,38,0.3)' }}>GET ONE TIME PASSWORD (OTP)</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.65)' }}>ENTER 6-DIGIT OTP</label>
                    <button type="button" onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--er))', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Change Number</button>
                  </div>
                  <input type="text" maxLength="6" placeholder="e.g. 123456" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} style={{ width: '100%', border: '2px solid hsl(var(--er))', borderRadius: '8px', padding: '12px 14px', fontSize: '18px', fontWeight: 800, letterSpacing: '4px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} autoFocus required />
                  <span style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: 'hsl(var(--su))', marginTop: '8px', fontWeight: 600 }}>✓ Simulated OTP sent! (Use test OTP: 123456)</span>
                </div>
                <button type="submit" style={{ width: '100%', background: 'hsl(var(--su))', color: 'hsl(var(--b1))', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>VERIFY &amp; CONFIRM BOOKING</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Custom Alert Modal ── */}
      {alertConfig.show && (
        <div className="custom-alert-overlay" onClick={closeNotify}>
          <div className="custom-alert-box" onClick={e => e.stopPropagation()}>
            <div className={`alert-icon ${alertConfig.type}`}>
              {alertConfig.type === 'success' ? '✓' : '✕'}
            </div>
            <h3 className="alert-title">{alertConfig.title}</h3>
            <p className="alert-message">{alertConfig.message}</p>
            <button className="alert-btn" onClick={closeNotify}>
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HotelReviewPage;
