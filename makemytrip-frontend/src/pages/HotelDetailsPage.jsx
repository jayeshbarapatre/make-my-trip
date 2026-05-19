import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Thumbs, FreeMode, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'
import { UDAIPUR_HOTELS } from '../data/udaipurHotelsData'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import { getHotelDetails, getHotelImages } from '../services/hotelService'
import '../styles/HotelDetailsPage.css'

export default function HotelDetailsPage() {
  const { hotelId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, verifyOtpLogin } = useAuth()

  const [hotel, setHotel] = useState(location.state?.hotel || null)
  const [loading, setLoading] = useState(!location.state?.hotel)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hotel) {
      const fetchHotel = async () => {
        try {
          const res = await getHotelDetails(hotelId)
          if (res.data) {
            const h = res.data
            setHotel({
              ...h,
              id: h.id,
              locality: h.location || h.city,
              distance: '2.0 km from City Center',
              ratingLabel: h.rating >= 4.5 ? 'Excellent' : h.rating >= 4 ? 'Very Good' : 'Good',
              strike: h.price + 1000,
              taxes: h.price * 0.18,
              roomType: 'Deluxe Room',
              amenities: h.amenities || ['Free WiFi'],
              review: h.description || "A wonderful stay.",
              longStay: [],
              seed: [1, 2, 3],
              photos: 10,
              starHost: h.rating >= 4.5,
              coupleFriendly: true,
              promo: ""
            })
          } else {
            setError('Hotel not found')
          }
        } catch (err) {
          setError('Failed to fetch hotel details')
        } finally {
          setLoading(false)
        }
      }
      fetchHotel()
    }
  }, [hotel, hotelId])

  // Default fallback images - Premium hotel & resort images
  const defaultImages = [
    "https://img.magnific.com/free-photo/type-entertainment-complex-popular-resort-with-pools-water-parks-turkey-with-more-than-5-million-visitors-year-amara-dolce-vita-luxury-hotel-resort-tekirova-kemer_146671-18728.jpg?t=st=1778935083~exp=1778938683~hmac=7b8e0626544072b26e1c40a5b3b5ae8c7d77fdf9fae896ec96b3dc0502fc0351&w=1480",
    "https://img.magnific.com/free-photo/luxury-bedroom-suite-resort-high-rise-hotel-with-working-table_105762-1783.jpg?t=st=1778935083~exp=1778938683~hmac=3f5b7eb394b655c514ed8af2957c171530e80386fe51066426b6ce7e9e55b7d0&w=1480",
    "https://img.magnific.com/free-photo/luxury-bedroom-hotel_1150-10836.jpg?t=st=1778935084~exp=1778938684~hmac=b810e6c87cd4298a850694f782168a06c8d413dc16aab711714d77885a86b4a2&w=1480",
    "https://img.magnific.com/free-photo/luxury-hotel-reception-hall-lounge-restaurant-with-high-ceiling_105762-1771.jpg?t=st=1778935084~exp=1778938684~hmac=6bf3675e0b9f89f95101f6675bba50150c6a32414c94d8817133864bd64813c8&w=1480",
    "https://img.magnific.com/free-photo/swimming-pool-beach-luxury-hotel-type-entertainment-complex-amara-dolce-vita-luxury-hotel-resort-tekirova-kemer-turkey_146671-18726.jpg?t=st=1778935086~exp=1778938686~hmac=cf50ee0edb9e352a73e8126c8ed45e4d0fe578c3a8395e4543c90b2db9f97c84&w=1480",
    "https://img.magnific.com/free-photo/modern-luxury-hotel-office-reception-lounge-with-meeting-room_105762-1772.jpg?t=st=1778935089~exp=1778938689~hmac=9d7d16c1b9def537b3fed69c45704f8624ec5287c44e31f6383bad25bbffcccf&w=1480",
    "https://img.magnific.com/free-photo/hammocks-with-palm-trees_1203-201.jpg?t=st=1778935088~exp=1778938688~hmac=be57b2409d9ab0997bdb2f954f31ea26105a09d40f3f7fbf21e6fa0136aa1e84&w=1480",
    "https://img.magnific.com/free-photo/swimming-pool_74190-1977.jpg?t=st=1778935090~exp=1778938690~hmac=9c4da861cec76645494c3baa649eb14147ec8008fcdb92867494402351857fcb&w=1480",
    "https://img.magnific.com/free-photo/umbrella-chair-around-swimming-pool_1203-2419.jpg?t=st=1778935092~exp=1778938692~hmac=b87dddf2f8d860b2ff3b3b62924f34d1b88aae42c643a90d5891765ba865cf60&w=1480",
    "https://img.magnific.com/free-photo/swimming-pool-beach-luxury-hotel-outdoor-pools-spa-amara-dolce-vita-luxury-hotel-resort-tekirova-kemer-turkey_146671-18751.jpg?t=st=1778935095~exp=1778938695~hmac=e85d2284b91c3153ca9738de003f30d9a07859cf90a21f239e332afc44b1c59a&w=1480",
    "https://img.magnific.com/free-photo/modern-studio-apartment-design-with-bedroom-living-space_1262-12375.jpg?t=st=1778935096~exp=1778938696~hmac=ec96a98077215981b04521eef19dbbeee4e37aaedd8b697433a8a445729f71a1&w=1480",
  ];

  const [images, setImages] = useState(defaultImages)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const [thumbsSwiper, setThumbsSwiper] = useState(null)

  useEffect(() => {
    if (hotel?.id) {
      const fetchImages = async () => {
        setImagesLoading(true)
        try {
          const res = await getHotelImages(hotel.id)
          if (res.data?.images?.length) {
            setImages(res.data.images)
          } else if (hotel.images?.length) {
            setImages(hotel.images)
          }
        } catch (err) {
          if (hotel.images?.length) {
            setImages(hotel.images)
          }
        } finally {
          setImagesLoading(false)
        }
      }
      fetchImages()
    }
  }, [hotel?.id])

  // Default dates: today and tomorrow (not hardcoded stale dates)
  const today     = new Date()
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const fmt = (d) => d.toISOString().slice(0, 10)

  const [checkIn,  setCheckIn]  = useState(location.state?.checkIn  || fmt(today))
  const [checkOut, setCheckOut] = useState(location.state?.checkOut || fmt(tomorrow))
  const [showCheckInCal, setShowCheckInCal] = useState(false)
  const [showCheckOutCal, setShowCheckOutCal] = useState(false)

  // Parse guests parameter - extract object from JSON string or use structured data
  const parseGuestsObj = (g) => {
    if (!g) return { adults: 2, rooms: 1 }
    if (typeof g === 'string') {
      try {
        return JSON.parse(g)
      } catch {
        return { adults: 2, rooms: 1 }
      }
    }
    return g
  }
  const guestsObj = parseGuestsObj(location.state?.guests)
  const buildGuestsDisplay = (obj) => {
    let display = `${obj.adults} Adults`;
    if (obj.children && obj.children > 0) {
      display += ` · ${obj.children} ${obj.children === 1 ? 'Child' : 'Children'}`;
    }
    display += `, ${obj.rooms} Room${obj.rooms !== 1 ? 's' : ''}`;
    return display;
  };
  const guestsDisplay = buildGuestsDisplay(guestsObj)
  const [guests, setGuests] = useState(guestsDisplay)
  const [bookEntireHotel, setBookEntireHotel] = useState(false)

  // Calculate nights dynamically from check-in and check-out
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1
    const checkInDate = new Date(checkIn + 'T00:00:00')
    const checkOutDate = new Date(checkOut + 'T00:00:00')
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
    return Math.max(nights, 1) // Minimum 1 night
  }

  const nights = calculateNights()
  const rooms = bookEntireHotel ? 10 : (guestsObj.rooms || 1)
  const basePriceForStay = hotel 
    ? (bookEntireHotel ? Math.round(hotel.price * 4.5 * nights) : hotel.price * nights * (guestsObj.rooms || 1))
    : 0
  // Taxes = 18% of base price (GST standard rate)
  const taxesForStay = Math.round(basePriceForStay * 0.18)
  const totalForStay = basePriceForStay + taxesForStay

  // Auth Modal State for realistic booking simulation
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loginError, setLoginError] = useState('');

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
  const [selectedRoomName, setSelectedRoomName] = useState('')

  // Auto-slide: 5-second rotation
  useEffect(() => {
    if (images.length === 0) return
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
    const isEntire = roomName === "Entire Property Takeover (All Rooms)" || bookEntireHotel;
    navigate('/hotels/review', {
      state: {
        hotel,
        roomName: roomName || (isEntire ? 'Entire Property Takeover (All Rooms)' : hotel.roomType || 'Deluxe Room'),
        checkIn,
        checkOut,
        guests: isEntire ? 'Entire Property Takeover' : guestsDisplay,
        guestsObj: isEntire ? { adults: 20, rooms: 10 } : guestsObj,
        bookEntireHotel: isEntire
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
      const res = await authService.sendMobileOtp(mobilePhone)
      if (res && (res.data || res.message)) {
        setOtpSent(true)
      } else {
        setLoginError('Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setLoginError(err.message || 'Failed to send OTP. Please try again.')
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
      handleReserve(selectedRoomName || hotel.roomType)
    } catch (err) {
      setLoginError(err.message || 'Verification failed. Try 123456.')
    }
  }

  return (
    <div className="hotel-details-wrapper">
      {loading && <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>}
      {error && <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>}
      {!loading && !error && hotel && (
        <>
      {/* Breadcrumbs */}
      <div className="hd-breadcrumb">
        <span style={{ cursor: 'pointer', color: 'hsl(var(--p))', fontWeight: 600 }} onClick={() => navigate('/hotels')}>Hotels</span>
        <span>›</span>
        <span style={{ cursor: 'pointer', color: 'hsl(var(--p))', fontWeight: 600 }} onClick={() => navigate(`/hotels/results?city=${hotel.city}`)}>{hotel.city} Stays</span>
        <span>›</span>
        <span style={{ color: 'hsl(var(--bc))', fontWeight: 700 }}>{hotel.name}</span>
      </div>

      {/* Header Info */}
      <div className="hd-header">
        <div className="hd-title-area">
          <div className="hd-badge-row">
            <span className="hd-star-badge">⭐ {hotel.rating.toFixed(1)} {hotel.ratingLabel}</span>
            {hotel.starHost && <span className="hd-luxe-tag">★ MMT Luxe Selection</span>}
            {hotel.coupleFriendly && <span style={{ background: 'hsl(var(--su) / 0.08)', color: 'hsl(var(--su))', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '4px' }}>✓ Couple Friendly</span>}
          </div>
          <h1 className="hd-name">{hotel.name}</h1>
          <div className="hd-location">📍 {hotel.locality}, {hotel.city} · <span style={{ color: 'hsl(var(--p))', fontWeight: 600 }}>{hotel.distance}</span></div>
        </div>

        <div className="hd-action-row">
          <button className="hd-btn-secondary" onClick={() => showNotify('Wishlist', 'Hotel added to your wishlist successfully!', 'success')}>
            ❤️ Wishlist
          </button>
          <button className="hd-btn-secondary" onClick={() => showNotify('Shared', 'Hotel link copied to clipboard!', 'success')}>
            🔗 Share
          </button>
        </div>
      </div>

      {/* ── Image Gallery Slider with SwiperJS ── */}
      <div className="hd-gallery-container" style={{ position: 'relative' }}>
        {imagesLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            zIndex: 10
          }}>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Loading images...</div>
          </div>
        )}
        {/* Main Slider */}
        <Swiper
          modules={[Navigation, Thumbs, FreeMode, Autoplay]}
          navigation
          loop={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          className="hd-main-swiper"
          onSlideChange={(swiper) => setActiveImgIdx(swiper.realIndex)}
        >
          {images.map((imgUrl, idx) => (
            <SwiperSlide key={idx}>
              <img src={imgUrl} alt={`${hotel.name} - ${idx + 1}`} className="hd-slide-image" />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Thumbnail Slider */}
        <Swiper
          modules={[FreeMode, Navigation, Thumbs]}
          onSwiper={setThumbsSwiper}
          loop={true}
          freeMode={true}
          navigation={false}
          watchSlidesProgress={true}
          slidesPerView="auto"
          spaceBetween={8}
          className="hd-thumbs-swiper"
        >
          {images.map((imgUrl, idx) => (
            <SwiperSlide key={idx} className="hd-thumb-slide">
              <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="hd-thumb-image" />
            </SwiperSlide>
          ))}
        </Swiper>
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
              <div style={{ marginTop: '20px', padding: '16px', background: 'hsl(var(--b2))', borderRadius: '12px', borderLeft: '4px solid hsl(var(--p))' }}>
                <h4 style={{ margin: '0 0 8px', color: 'hsl(var(--bc))', fontSize: '15px', fontWeight: 800 }}>✨ Exclusive Member Benefits</h4>
                <ul style={{ margin: 0, paddingLeft: '18px', color: 'hsl(var(--bc) / 0.65)', fontSize: '14px', lineHeight: 1.6 }}>
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
              
              {/* Book Entire Property Option */}
              <div className="hd-room-card" style={{
                background: 'linear-gradient(135deg, hsl(var(--b1)) 0%, hsl(var(--a) / 0.03) 100%)',
                border: '2px dashed hsl(var(--a) / 0.6)',
                boxShadow: '0 4px 20px rgba(251, 191, 36, 0.05)'
              }}>
                <div className="hd-room-image-side">
                  <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&h=300&q=80" alt="Entire Property Takeover" />
                </div>
                <div className="hd-room-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: 'hsl(var(--a))' }}>👑 Entire Property Takeover (All Rooms)</h4>
                    <span style={{ background: 'hsl(var(--a) / 0.15)', color: 'hsl(var(--a))', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Exclusive Takeover</span>
                  </div>
                  <div className="hd-room-tags">
                    <span className="hd-room-tag">🏰 Private Resort Takeover</span>
                    <span className="hd-room-tag">👥 Accommodates up to 30 Guests</span>
                    <span className="hd-room-tag">🛎️ Exclusive Dedicated Staff</span>
                    <span className="hd-room-tag">🍽️ All Meals &amp; Events Included</span>
                  </div>
                  <span className="hd-room-status" style={{ color: 'hsl(var(--a))', background: 'hsl(var(--a) / 0.1)' }}>✓ Guaranteed Exclusive Access (No other guests)</span>
                </div>
                <div className="hd-room-price-area" style={{ background: 'hsl(var(--a) / 0.02)' }}>
                  <div className="hd-room-sub" style={{ color: 'hsl(var(--a))' }}>Takeover Price / Night</div>
                  <div className="hd-room-price" style={{ color: 'hsl(var(--a))' }}>₹ {(hotel.price * 4.5).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '8px' }}>+ ₹{Math.round((hotel.price * 4.5) * 0.18).toLocaleString('en-IN')} taxes &amp; fees</div>
                  <button 
                    className="btn-primary hd-btn-compact" 
                    style={{ background: 'linear-gradient(135deg, hsl(var(--a)) 0%, hsl(var(--wa)) 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)' }}
                    onClick={() => {
                      setBookEntireHotel(true);
                      handleReserve("Entire Property Takeover (All Rooms)");
                    }}
                  >
                    BOOK TAKEOVER
                  </button>
                </div>
              </div>

              <div className="hd-room-card">
                <div className="hd-room-image-side">
                  <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&h=300&q=80" alt="Luxury Heritage Suite" />
                </div>
                <div className="hd-room-info">
                  <h4>{hotel.roomType || "Luxury Heritage Suite"}</h4>
                  <div className="hd-room-tags">
                    <span className="hd-room-tag">👑 King Size Bed</span>
                    <span className="hd-room-tag">🌅 Lake / City View</span>
                    <span className="hd-room-tag">🛁 Bathtub Included</span>
                  </div>
                  <span className="hd-room-status">✓ Available On Instant Confirmation</span>
                </div>
                <div className="hd-room-price-area">
                  <div className="hd-room-sub">Base Price / Night</div>
                  <div className="hd-room-price">₹ {hotel.price.toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '8px' }}>+ ₹{Math.round(hotel.price * 0.18).toLocaleString('en-IN')} taxes & fees</div>
                  <button className="btn-primary hd-btn-compact" onClick={() => handleReserve(hotel.roomType || "Luxury Heritage Suite")}>
                    BOOK NOW
                  </button>
                </div>
              </div>

              <div className="hd-room-card">
                <div className="hd-room-image-side">
                  <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=400&h=300&q=80" alt="Royal Maharaja Suite" />
                </div>
                <div className="hd-room-info">
                  <h4>Royal Maharaja Suite with Private Terrace</h4>
                  <div className="hd-room-tags">
                    <span className="hd-room-tag">💎 Premium Bedding</span>
                    <span className="hd-room-tag">🏊 Plunge Pool Access</span>
                    <span className="hd-room-tag">🥂 Complimentary Wine</span>
                  </div>
                  <span className="hd-room-status few">⚡ Only 2 Rooms Left</span>
                </div>
                <div className="hd-room-price-area">
                  <div className="hd-room-sub">Base Price / Night</div>
                  <div className="hd-room-price">₹ {(hotel.price + 3200).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '8px' }}>+ ₹{Math.round((hotel.price + 3200) * 0.18).toLocaleString('en-IN')} taxes & fees</div>
                  <button className="btn-primary hd-btn-compact" onClick={() => handleReserve("Royal Maharaja Suite with Private Terrace")}>
                    BOOK NOW
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
                  <span style={{ background: 'hsl(var(--bc))', color: 'hsl(var(--wa))', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '13px' }}>
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
                  <span style={{ background: 'hsl(var(--bc))', color: 'hsl(var(--wa))', padding: '4px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '13px' }}>
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
              {/* Book Entire Hotel Option Switch */}
              <div style={{
                background: 'linear-gradient(135deg, hsl(var(--a) / 0.12) 0%, hsl(var(--p) / 0.04) 100%)',
                border: '1px solid hsl(var(--a) / 0.3)',
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🏢</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: 'hsl(var(--bc))' }}>Book Entire Hotel</div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)' }}>Exclusive resort takeover</div>
                  </div>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={bookEntireHotel}
                    onChange={(e) => setBookEntireHotel(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: bookEntireHotel ? 'hsl(var(--a))' : 'hsl(var(--b3))',
                    transition: '.3s ease',
                    borderRadius: '34px',
                    boxShadow: bookEntireHotel ? '0 0 8px hsl(var(--a) / 0.4)' : 'none'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px', width: '18px',
                      left: bookEntireHotel ? '25px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      transition: '.3s ease',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>

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

              <div className="hd-input-box" style={{ opacity: bookEntireHotel ? 0.7 : 1 }}>
                <label>Guests &amp; Rooms</label>
                <input 
                  type="text" 
                  className="hd-input-field" 
                  value={bookEntireHotel ? 'Entire Hotel (10 Rooms, All Guests)' : guests} 
                  onChange={(e) => setGuests(e.target.value)} 
                  disabled={bookEntireHotel}
                  style={{ cursor: bookEntireHotel ? 'not-allowed' : 'text' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'hsl(var(--bc) / 0.65)', marginBottom: '8px' }}>
                {bookEntireHotel ? (
                  <>
                    <span>🏢 Resort Takeover Rate × {nights} Night{nights !== 1 ? 's' : ''}</span>
                    <span>₹ {basePriceForStay.toLocaleString("en-IN")}</span>
                  </>
                ) : (
                  <>
                    <span>₹ {hotel.price.toLocaleString("en-IN")} × {nights} night{nights !== 1 ? 's' : ''} × {rooms} room{rooms !== 1 ? 's' : ''}</span>
                    <span>₹ {basePriceForStay.toLocaleString("en-IN")}</span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'hsl(var(--bc) / 0.65)', marginBottom: '16px' }}>
                <span>Taxes &amp; Service fees</span>
                <span>₹ {taxesForStay.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--b3))', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 900, color: 'hsl(var(--bc))' }}>
                <span>Total Billed</span>
                <span>₹ {totalForStay.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button 
              className="hd-btn-primary btn-primary" 
              style={{ padding: '16px', fontSize: '18px', width: '100%', borderRadius: '16px' }}
              onClick={() => handleReserve(bookEntireHotel ? 'Entire Property Takeover (All Rooms)' : hotel.roomType)}
            >
              ⚡ Instant Reserve Now
            </button>

              <div className="hd-bc-footer">
                <div className="hd-trust-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <span>Safe & Secure Checkout · Free Cancellation up to 24 hrs</span>
                </div>
              </div>

          </div>
        </div>

      </div>

      {/* Simulated Auth Modal for realistic flow */}
      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '90%', maxWidth: '420px', padding: '32px 28px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative', boxSizing: 'border-box' }}>
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'hsl(var(--b2))', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔐</span>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'hsl(var(--bc) / 0.9)' }}>Login to Continue</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--bc) / 0.6)' }}>MakeMyTrip requires verification before booking. Enter your mobile number to instantly login.</p>
            </div>

            {loginError && <div style={{ background: 'hsl(var(--er) / 0.08)', color: 'hsl(var(--er) / 0.7)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center', fontWeight: 600 }}>{loginError}</div>}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.65)', marginBottom: '6px' }}>MOBILE NUMBER</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ background: 'hsl(var(--b2))', border: '1px solid hsl(var(--b3))', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc) / 0.7)', display: 'flex', alignItems: 'center' }}>+91</span>
                    <input type="tel" placeholder="10-digit mobile number" maxLength={10} value={mobilePhone} onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobilePhone(val);
                    }} maxLength="10" inputMode="numeric" style={{ flex: 1, border: '1px solid hsl(var(--b3))', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }} autoFocus required />
                  </div>
                </div>
                <button type="submit" style={{ width: '100%', background: 'hsl(var(--er))', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(235,32,38,0.3)' }}>GET ONE TIME PASSWORD (OTP)</button>
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
                <button type="submit" style={{ width: '100%', background: 'hsl(var(--su))', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>VERIFY &amp; CONFIRM BOOKING</button>
              </form>
            )}
          </div>
        </div>
      )}
        </>
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
  )
}
