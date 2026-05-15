import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { UDAIPUR_HOTELS } from '../data/udaipurHotelsData'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import '../styles/HotelDetailsPage.css'

export default function HotelDetailsPage() {
  const { hotelId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, verifyOtpLogin } = useAuth()

  // Retrieve hotel from router state or fallback to lookup/default
  const hotel = location.state?.hotel || UDAIPUR_HOTELS.find(h => h.id === Number(hotelId)) || UDAIPUR_HOTELS[0]

  // Gallery slider state
  const images = hotel.seed ? hotel.seed.map(s => `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&h=600&q=80&sig=${s}`) : [hotel.img, "https://images.unsplash.com/photo-1543731068-7e0f5beff43a?auto=format&fit=crop&w=1200&h=600&q=80", "https://images.unsplash.com/photo-1590050752117-238cb061271f?auto=format&fit=crop&w=1200&h=600&q=80", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&h=600&q=80"]
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  // Booking form state
  const [checkIn, setCheckIn] = useState('2026-05-14')
  const [checkOut, setCheckOut] = useState('2026-05-18')
  const [showCheckInCal, setShowCheckInCal] = useState(false)
  const [showCheckOutCal, setShowCheckOutCal] = useState(false)
  const [guests, setGuests] = useState('2 Adults, 1 Room')

  // Auth Modal State for realistic booking simulation
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [selectedRoomName, setSelectedRoomName] = useState('')

  // Auto-slide optional feature
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImgIdx(prev => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  const nextImg = (e) => {
    e.stopPropagation()
    setActiveImgIdx(prev => (prev + 1) % images.length)
  }

  const prevImg = (e) => {
    e.stopPropagation()
    setActiveImgIdx(prev => (prev - 1 + images.length) % images.length)
  }

  // Trigger Booking flow -> Review Page
  const handleReserve = (roomName) => {
    navigate('/hotels/review', {
      state: {
        hotel,
        roomName: roomName || hotel.roomType || 'Deluxe Room',
        checkIn,
        checkOut,
        guests
      }
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!mobilePhone || mobilePhone.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number')
      return
    }
    setLoginError('')
    try {
      await authService.sendMobileOtp(mobilePhone)
      setOtpSent(true)
    } catch (err) {
      setOtpSent(true)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      setLoginError('Please enter a valid 6-digit OTP (e.g., 123456)')
      return
    }
    setLoginError('')
    try {
      await verifyOtpLogin(mobilePhone, otpCode)
      setShowLoginModal(false)
      finalizeBooking(selectedRoomName || hotel.roomType)
    } catch (err) {
      setLoginError(err.message || 'Verification failed. Try 123456.')
    }
  }

  return (
    <div className="hotel-details-wrapper">
      
      {/* Breadcrumbs */}
      <div className="hd-breadcrumb">
        <span style={{ cursor: 'pointer', color: '#003580', fontWeight: 600 }} onClick={() => navigate('/hotels')}>Hotels</span>
        <span>›</span>
        <span style={{ cursor: 'pointer', color: '#003580', fontWeight: 600 }} onClick={() => navigate('/hotels/results?city=Udaipur')}>Udaipur Stays</span>
        <span>›</span>
        <span style={{ color: '#0f172a', fontWeight: 700 }}>{hotel.name}</span>
      </div>

      {/* Header Info */}
      <div className="hd-header">
        <div className="hd-title-area">
          <div className="hd-badge-row">
            <span className="hd-star-badge">⭐ {hotel.rating.toFixed(1)} {hotel.ratingLabel}</span>
            {hotel.starHost && <span className="hd-luxe-tag">★ MMT Luxe Selection</span>}
            {hotel.coupleFriendly && <span style={{ background: '#dcfce7', color: '#10b981', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '4px' }}>✓ Couple Friendly</span>}
          </div>
          <h1 className="hd-name">{hotel.name}</h1>
          <div className="hd-location">📍 {hotel.locality}, Udaipur · <span style={{ color: '#003580', fontWeight: 600 }}>{hotel.distance}</span></div>
        </div>

        <div className="hd-action-row">
          <button className="hd-btn-secondary" onClick={() => alert("Added to Wishlist!")}>
            ❤️ Wishlist
          </button>
          <button className="hd-btn-secondary" onClick={() => alert("Link copied to clipboard!")}>
            🔗 Share
          </button>
        </div>
      </div>

      {/* ── Image Gallery Slider ── */}
      <div className="hd-gallery-container">
        <div className="hd-main-image-wrapper">
          <img src={images[activeImgIdx]} alt={hotel.name} className="hd-main-image" />
          <button className="hd-arrow-btn left" onClick={prevImg} aria-label="Previous image">‹</button>
          <button className="hd-arrow-btn right" onClick={nextImg} aria-label="Next image">›</button>
        </div>

        <div className="hd-thumbnails">
          {images.map((imgUrl, idx) => (
            <div 
              key={idx} 
              className={`hd-thumb ${idx === activeImgIdx ? 'active' : ''}`}
              onClick={() => setActiveImgIdx(idx)}
            >
              <img src={imgUrl} alt={`Thumbnail ${idx+1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="hd-content-grid">
        
        {/* Left Area: Description, Amenities, Rooms, Reviews */}
        <div className="hd-left-column">
          
          {/* About Section */}
          <div className="hd-section-card">
            <h2 className="hd-section-title">🏢 About This Property</h2>
            <p className="hd-description">
              {hotel.review || "Experience authentic Mewari hospitality paired with state-of-the-art luxury. Featuring expansive private balconies overlooking the serene lakes, curated gourmet dining, and absolute royal elegance. Perfectly situated for both leisure getaways and heritage explorations."}
            </p>
            {hotel.longStay && hotel.longStay.length > 0 && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #003580' }}>
                <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '15px', fontWeight: 800 }}>✨ Exclusive Member Benefits</h4>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
                  {hotel.longStay.map((benefit, bIdx) => (
                    <li key={bIdx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="hd-section-card">
            <h2 className="hd-section-title">✨ Premium Amenities</h2>
            <div className="hd-amenities-grid">
              <div className="hd-amenity-item">📶 High-Speed WiFi</div>
              <div className="hd-amenity-item">🏊 Infinity Pool</div>
              <div className="hd-amenity-item">🅿️ Valet Parking</div>
              <div className="hd-amenity-item">❄️ Air Conditioning</div>
              <div className="hd-amenity-item">🍽️ Fine Dining</div>
              <div className="hd-amenity-item">💆 Spa &amp; Wellness</div>
              <div className="hd-amenity-item">🛎️ 24/7 Room Service</div>
              <div className="hd-amenity-item">🍹 Bar &amp; Lounge</div>
            </div>
          </div>

          {/* Room Booking Options */}
          <div className="hd-section-card">
            <h2 className="hd-section-title">🛏️ Choose Your Room</h2>
            <div className="hd-rooms-list">
              
              <div className="hd-room-card">
                <div className="hd-room-info">
                  <h4>{hotel.roomType || "Luxury Heritage Suite"}</h4>
                  <div className="hd-room-tags">
                    <span>👑 King Size Bed</span>
                    <span>🌅 Lake / City View</span>
                    <span>🛁 Bathtub Included</span>
                  </div>
                  <span className="hd-room-status">✓ Available On Instant Confirmation</span>
                </div>
                <div className="hd-room-price-area">
                  <div className="hd-room-sub">Base Price / Night</div>
                  <div className="hd-room-price">₹ {hotel.price.toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>+ ₹{hotel.taxes} taxes &amp; fees</div>
                  <button className="hd-btn-primary btn-primary" onClick={() => handleReserve(hotel.roomType || "Luxury Heritage Suite")}>
                    Book Now
                  </button>
                </div>
              </div>

              <div className="hd-room-card">
                <div className="hd-room-info">
                  <h4>Royal Maharaja Suite with Private Terrace</h4>
                  <div className="hd-room-tags">
                    <span>💎 Premium Bedding</span>
                    <span>🏊 Plunge Pool Access</span>
                    <span>🥂 Complimentary Wine</span>
                  </div>
                  <span className="hd-room-status few">⚡ Only 2 Rooms Left</span>
                </div>
                <div className="hd-room-price-area">
                  <div className="hd-room-sub">Base Price / Night</div>
                  <div className="hd-room-price">₹ {(hotel.price + 3200).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>+ ₹{hotel.taxes + 450} taxes &amp; fees</div>
                  <button className="hd-btn-primary btn-primary" onClick={() => handleReserve("Royal Maharaja Suite with Private Terrace")}>
                    Book Now
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* User Reviews */}
          <div className="hd-section-card">
            <h2 className="hd-section-title">⭐ Verified Guest Reviews ({hotel.reviews} Reviews)</h2>
            <div className="hd-reviews-list">
              
              <div className="hd-review-item">
                <div className="hd-review-header">
                  <div className="hd-reviewer">
                    <div className="hd-avatar">K</div>
                    <div>
                      <div className="hd-reviewer-name">Karan Sharma</div>
                      <div className="hd-review-date">Checked in · Family Trip</div>
                    </div>
                  </div>
                  <span style={{ background: '#0f172a', color: '#fbb52c', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '13px' }}>
                    ★ 5.0
                  </span>
                </div>
                <p className="hd-review-comment">
                  {hotel.review || "Absolutely wonderful experience! The location is prime, and the sunset from the rooftop is unforgettable. Staff went out of their way to make sure our family was extremely comfortable."}
                </p>
              </div>

              <div className="hd-review-item">
                <div className="hd-review-header">
                  <div className="hd-reviewer">
                    <div className="hd-avatar">A</div>
                    <div>
                      <div className="hd-reviewer-name">Ananya Mehta</div>
                      <div className="hd-review-date">Checked in · Couple Stay</div>
                    </div>
                  </div>
                  <span style={{ background: '#0f172a', color: '#fbb52c', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '13px' }}>
                    ★ 4.8
                  </span>
                </div>
                <p className="hd-review-comment">
                  Immaculately clean rooms, smooth check-in process, and the food at the restaurant was delicious. Definitely coming back on our next trip to Udaipur!
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Right Sticky Sidebar: Reservation Panel */}
        <div className="hd-sidebar-column">
          <div className="hd-booking-card">
            
            <div className="hd-bc-price-row">
              <div>
                {hotel.strike > hotel.price && <span className="hd-bc-strike">₹{hotel.strike.toLocaleString("en-IN")}</span>}
                <span className="hd-bc-price">₹ {hotel.price.toLocaleString("en-IN")}</span>
              </div>
              <span className="hd-bc-unit">/ night</span>
            </div>

            <div className="hd-bc-form">
              <div className="hd-input-box" style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => { setShowCheckInCal(p => !p); setShowCheckOutCal(false) }}>
                <label>Check-In Date</label>
                <div className="hd-input-field" style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                  {checkIn ? new Date(checkIn + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                </div>
                <CustomCalendarPicker
                  isOpen={showCheckInCal}
                  value={checkIn}
                  onChange={v => { setCheckIn(v); setShowCheckInCal(false) }}
                  onClose={() => setShowCheckInCal(false)}
                  labelText="Check-in"
                />
              </div>

              <div className="hd-input-box" style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => { setShowCheckOutCal(p => !p); setShowCheckInCal(false) }}>
                <label>Check-Out Date</label>
                <div className="hd-input-field" style={{ display: 'flex', alignItems: 'center', userSelect: 'none' }}>
                  {checkOut ? new Date(checkOut + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                </div>
                <CustomCalendarPicker
                  isOpen={showCheckOutCal}
                  value={checkOut}
                  onChange={v => { setCheckOut(v); setShowCheckOutCal(false) }}
                  onClose={() => setShowCheckOutCal(false)}
                  labelText="Check-out"
                />
              </div>

              <div className="hd-input-box">
                <label>Guests &amp; Rooms</label>
                <input 
                  type="text" 
                  className="hd-input-field" 
                  value={guests} 
                  onChange={(e) => setGuests(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '8px' }}>
                <span>₹ {hotel.price.toLocaleString("en-IN")} x 4 nights</span>
                <span>₹ {(hotel.price * 4).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
                <span>Taxes &amp; Service fees</span>
                <span>₹ {(hotel.taxes * 4).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>
                <span>Total Billed</span>
                <span>₹ {((hotel.price + hotel.taxes) * 4).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button 
              className="hd-btn-primary btn-primary" 
              style={{ padding: '16px', fontSize: '18px', width: '100%', borderRadius: '16px' }}
              onClick={() => handleReserve(hotel.roomType)}
            >
              ⚡ Instant Reserve Now
            </button>

            <div className="hd-bc-footer">
              🔒 Safe &amp; Secure Checkout · Free Cancellation up to 24 hrs
            </div>

          </div>
        </div>

      </div>

      {/* Simulated Auth Modal for realistic flow */}
      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '420px', padding: '32px 28px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative', boxSizing: 'border-box' }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔐</span>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: '#111827' }}>Login to Continue</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>MakeMyTrip requires verification before booking. Enter your mobile number to instantly login.</p>
            </div>

            {loginError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center', fontWeight: 600 }}>{loginError}</div>}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>MOBILE NUMBER</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 700, color: '#4b5563', display: 'flex', alignItems: 'center' }}>+91</span>
                    <input type="tel" placeholder="10-digit mobile number" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }} autoFocus required />
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', background: '#eb2026', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(235,32,38,0.3)' }}>GET ONE TIME PASSWORD (OTP)</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>ENTER 6-DIGIT OTP</label>
                    <button type="button" onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: '#eb2026', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Change Number</button>
                  </div>
                  <input type="text" maxLength="6" placeholder="e.g. 123456" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} style={{ width: '100%', border: '2px solid #eb2026', borderRadius: '8px', padding: '12px 14px', fontSize: '18px', fontWeight: 800, letterSpacing: '4px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} autoFocus required />
                  <span style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: '#10b981', marginTop: '8px', fontWeight: 600 }}>✓ Simulated OTP sent! (Use test OTP: 123456)</span>
                </div>
                <button type="submit" style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>VERIFY &amp; CONFIRM BOOKING</button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
