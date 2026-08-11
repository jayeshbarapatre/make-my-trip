import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/HotelReviewPage.css';
import OtpLoginModal from '../components/Auth/OtpLoginModal'
import { photo } from '../utils/images'
import CheckoutStateLost from '../components/CheckoutStateLost'
import { requestQuote } from '../services/checkout'

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

  // The server prices the stay; this page renders what it is told.
  //
  // It used to compute its own total from invented rules — 90% of the property's
  // room count, a 15% "property discount" and 18% GST — none of which exist in
  // pricingService. For a 10-room takeover at ₹20 a night it showed ₹927 while
  // the payment page, which asks the server, charged ₹224. The customer
  // reviewed one price and paid another, and the review step is precisely where
  // that must not happen.
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    if (!hotel?.id) return;

    let active = true;
    requestQuote({ type: 'hotel', itemId: hotel.id, quantity: rooms, nights })
      .then((q) => { if (active) { setQuote(q); setQuoteError(''); } })
      .catch((err) => { if (active) { setQuote(null); setQuoteError(err.message); } });

    return () => { active = false; };
  }, [hotel?.id, rooms, nights]);

  const basePrice = quote?.baseFare ?? null;
  const discount = quote?.discount ?? 0;
  const priceAfterDiscount = basePrice === null ? null : basePrice - discount;
  const taxes = (quote?.taxes ?? 0) + (quote?.convenience ?? 0);
  const totalAmount = quote?.totalAmount ?? null;
  const quoteReady = Boolean(quote);

  /** Renders an amount, or a dash while the server's quote is still in flight. */
  const money = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '—');

  // Coupon state
  // ── Guest details ───────────────────────────────────────────────────────
  //
  // Hotels were the only vertical that took a booking without asking who was
  // staying: flights collect travellers and buses collect passengers, but a
  // hotel booking went through with nothing but a room count. The property had
  // no name to check anyone in against.
  //
  // The lead guest is pre-filled from the signed-in account, because that is
  // whose card is paying and re-typing it is friction for no gain.
  const MAX_GUESTS = 20

  const [guestList, setGuestList] = useState(() => [
    { name: user?.name ?? '', age: '', gender: '' }
  ])
  const [contact, setContact] = useState({
    email: user?.email ?? '',
    phone: user?.phone ?? ''
  })
  const [guestErrors, setGuestErrors] = useState({})

  // Fill the lead guest once the session restores, without clobbering anything
  // already typed.
  useEffect(() => {
    if (!user) return
    setGuestList((prev) => {
      if (prev[0]?.name) return prev
      const next = [...prev]
      next[0] = { ...next[0], name: user.name ?? '' }
      return next
    })
    setContact((c) => ({
      email: c.email || user.email || '',
      phone: c.phone || user.phone || ''
    }))
  }, [user])

  const addGuest = () => {
    setGuestList((prev) => (prev.length >= MAX_GUESTS ? prev : [...prev, { name: '', age: '', gender: '' }]))
  }

  const removeGuest = (index) => {
    // The lead guest cannot be removed — somebody has to hold the booking.
    if (index === 0) return
    setGuestList((prev) => prev.filter((_, i) => i !== index))
    setGuestErrors({})
  }

  const updateGuest = (index, field, value) => {
    setGuestList((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)))
    setGuestErrors((e) => {
      const next = { ...e }
      delete next[`g_${index}_${field}`]
      return next
    })
  }

  const validateGuests = () => {
    const errs = {}

    if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errs.email = 'Enter a valid email address — the confirmation is sent here.'
    }
    if (!contact.phone || contact.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Enter a valid 10-digit mobile number.'
    }

    guestList.forEach((g, i) => {
      if (!g.name.trim()) {
        errs[`g_${i}_name`] = 'Name is required.'
      } else if (g.name.trim().length < 2) {
        errs[`g_${i}_name`] = 'Enter the full name.'
      }

      const age = Number(g.age)
      if (!g.age) errs[`g_${i}_age`] = 'Age is required.'
      else if (!Number.isFinite(age) || age < 0 || age > 120) errs[`g_${i}_age`] = 'Enter a valid age.'
    })

    // A hotel needs someone who can legally hold the room.
    if (guestList.length && !guestList.some((g) => Number(g.age) >= 18)) {
      errs.adult = 'At least one guest must be 18 or older.'
    }

    setGuestErrors(errs)
    return Object.keys(errs).length === 0
  }

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
        bookEntireHotel,
        // Who is actually staying. Without this the booking recorded a room
        // count and nothing else, so the property had no name to check anyone
        // in against.
        guestDetails: guestList,
        contact
      }
    });
  };

  const handleCompleteBooking = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Validate before leaving this page. Catching a missing guest name on the
    // payment screen — or worse, after the gateway has taken the money — is far
    // more expensive than catching it here.
    if (!validateGuests()) {
      const firstError = document.querySelector('[data-guest-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  if (!hotel?.id) return <CheckoutStateLost searchPath="/hotels" label="hotel search" />;

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

            {/* Guest Details */}
            <div className="rev-card" data-guest-error={Object.keys(guestErrors).length > 0 ? 'true' : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h3 className="rev-info-title" style={{ margin: 0 }}>Guest Details</h3>
                <span style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>
                  {guestList.length} guest{guestList.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p style={{ margin: '6px 0 18px', fontSize: '13px', color: 'hsl(var(--bc) / 0.6)' }}>
                Names must match the ID each guest presents at check-in.
              </p>

              {guestList.map((g, i) => (
                <div key={i} style={{ padding: '14px', marginBottom: '12px', borderRadius: '10px', border: '1px solid hsl(var(--bc) / 0.12)', background: 'hsl(var(--b2) / 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '13px' }}>{i === 0 ? 'Lead guest' : 'Guest ' + (i + 1)}</strong>
                    {i > 0 && (
                      <button type="button" onClick={() => removeGuest(i)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'hsl(var(--er))', fontSize: '13px', fontWeight: 700 }}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="rev-guest-grid">
                    <div>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={g.name}
                        onChange={(e) => updateGuest(i, 'name', e.target.value)}
                        className={guestErrors['g_' + i + '_name'] ? 'rev-input rev-input-err' : 'rev-input'}
                      />
                      {guestErrors['g_' + i + '_name'] && <small className="rev-err">{guestErrors['g_' + i + '_name']}</small>}
                    </div>

                    <div>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        placeholder="Age"
                        value={g.age}
                        onChange={(e) => updateGuest(i, 'age', e.target.value)}
                        className={guestErrors['g_' + i + '_age'] ? 'rev-input rev-input-err' : 'rev-input'}
                      />
                      {guestErrors['g_' + i + '_age'] && <small className="rev-err">{guestErrors['g_' + i + '_age']}</small>}
                    </div>

                    <select
                      value={g.gender}
                      onChange={(e) => updateGuest(i, 'gender', e.target.value)}
                      className="rev-input"
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              ))}

              {guestErrors.adult && <p className="rev-err" style={{ marginBottom: '12px' }}>{guestErrors.adult}</p>}

              <button
                type="button"
                onClick={addGuest}
                disabled={guestList.length >= MAX_GUESTS}
                className="rev-add-guest"
              >
                + Add another guest
              </button>

              <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid hsl(var(--bc) / 0.10)' }}>
                <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px' }}>Contact details</strong>
                <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: 'hsl(var(--bc) / 0.6)' }}>
                  The confirmation and PDF ticket are sent here.
                </p>
                <div className="rev-contact-grid">
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={contact.email}
                      onChange={(e) => { setContact((c) => ({ ...c, email: e.target.value })); setGuestErrors((x) => { const n = { ...x }; delete n.email; return n; }); }}
                      className={guestErrors.email ? 'rev-input rev-input-err' : 'rev-input'}
                    />
                    {guestErrors.email && <small className="rev-err">{guestErrors.email}</small>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Mobile number"
                      value={contact.phone}
                      onChange={(e) => { setContact((c) => ({ ...c, phone: e.target.value })); setGuestErrors((x) => { const n = { ...x }; delete n.phone; return n; }); }}
                      className={guestErrors.phone ? 'rev-input rev-input-err' : 'rev-input'}
                    />
                    {guestErrors.phone && <small className="rev-err">{guestErrors.phone}</small>}
                  </div>
                </div>
              </div>
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
                <span>₹ {money(basePrice)}</span>
              </div>

              <div className="rev-price-row discount">
                <span>Discount by Property</span>
                <span>- ₹ {money(discount)}</span>
              </div>

              <div className="rev-price-row after-disc">
                <span>Price after Discount</span>
                <span>₹ {money(priceAfterDiscount)}</span>
              </div>

              <div className="rev-price-row">
                <span>Taxes &amp; Service Fees ⓘ</span>
                <span>₹ {money(taxes)}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="rev-price-row discount">
                  <span>Coupon Discount</span>
                  <span>- ₹ {money(appliedDiscount)}</span>
                </div>
              )}

              <div className="rev-total-box">
                <span>Total Amount to be paid</span>
                <span>₹ {money(quoteReady ? totalAmount - appliedDiscount : null)}</span>
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
            {/* Disabled until the server has priced the stay. Advancing without a
                quote would carry a total this page never received, which is how
                the review and payment screens disagreed in the first place. */}
            <button
              className="rev-pay-btn"
              onClick={handleCompleteBooking}
              disabled={!quoteReady}
              style={!quoteReady ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
            >
              {quoteReady ? 'Pay Now' : (quoteError ? 'Price unavailable' : 'Getting price…')}
            </button>
            {quoteError && (
              <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'hsl(var(--er))', textAlign: 'center' }}>
                {quoteError}
              </p>
            )}

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
