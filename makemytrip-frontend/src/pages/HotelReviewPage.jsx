import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/HotelReviewPage.css';
import OtpLoginModal from '../components/Auth/OtpLoginModal'
import { photo } from '../utils/images'

function HotelReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Checkout state lives in router state, which a refresh or deep link discards.
  //
  // This used to fabricate "Axiom Resort Luxury Cottages, Arambol" at ₹5,000
  // with id `hotel-fallback` and hardcoded 2026-05-15/16 dates. Because this
  // step runs BEFORE payment, the fake hotel and wrong dates were then carried
  // forward into the payment page as though the customer had chosen them.
  const defaultImage = photo('hotel-luxury-exterior', 400);
  const hotel = location.state?.hotel ?? null;
  const checkIn = location.state?.checkIn ?? '';
  const checkOut = location.state?.checkOut ?? '';
  const guestsObj = location.state?.guestsObj ?? { adults: 2, rooms: 1 };

  useEffect(() => {
    if (!hotel?.id) {
      navigate('/hotels', { replace: true });
    }
  }, [hotel, navigate]);

  const getImageUrl = (h) => {
    if (h.image) return h.image;
    if (h.images && h.images.length > 0) return h.images[0];
    if (h.seed && h.seed.length > 0) return h.seed[0];
    if (h.img) return h.img;
    return defaultImage;
  };

  const roomName = location.state?.roomName ?? 'Selected room';
  const guests = location.state?.guests ?? '';

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

  ;

  ;

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    if (couponCode.toUpperCase() === 'MMT500') {
      setAppliedDiscount(500);
      showNotify('Success!', 'Coupon MMT500 applied successfully! ₹500 discount added.', 'success');
    } else {
      showNotify('Invalid Coupon', 'The coupon code you entered is invalid. Please try MMT500.', 'error');
    }
  };


  const handleOtpLoginSuccess = () => {
    setShowLoginModal(false)
    finalizeBooking()
  }

  // The redirect fires in an effect, so the first render still runs with no
  // hotel. Render nothing rather than showing inventory the customer never chose.
  if (!hotel?.id) return null;

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
      <OtpLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleOtpLoginSuccess}
      />

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
