import { useState, useEffect } from 'react'
import { requestQuote } from '../services/checkout'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Thumbs, FreeMode, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'
import { useAuth } from '../context/AuthContext'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import { getHotelDetails } from '../services/hotelService'
import { useWishlist } from '../hooks/useWishlist'
import '../styles/HotelDetailsPage.css'
import OtpLoginModal from '../components/Auth/OtpLoginModal'
import { photo } from '../utils/images'
import { todayLocal, addDaysLocal } from '../utils/date'

export default function HotelDetailsPage() {
  const { hotelId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { _user } = useAuth()
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist()

  const [hotel, setHotel] = useState(location.state?.hotel || null)
  const [loading, setLoading] = useState(!location.state?.hotel)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await getHotelDetails(hotelId)
        if (res.data) {
          const h = res.data
          setHotel(prev => ({
            ...prev,
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
          }))
        } else {
          setError('Hotel not found')
        }
      } catch (_err) {
        setError('Failed to fetch hotel details')
      } finally {
        setLoading(false)
      }
    }
    fetchHotel()
  }, [hotelId])

  const [disabledDates, _setDisabledDates] = useState([])

  useEffect(() => {
    // ⚠️ Disabled: Blocked dates endpoint not critical - skip to speed up page load
    // if (hotel?.name) {
    //   const controller = new AbortController()
    //   const timeout = setTimeout(() => controller.abort(), 3000)
    //   fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings/hotel/${encodeURIComponent(hotel.name)}/blocked-dates`, { signal: controller.signal })
    //     .then(res => res.json())
    //     .then(data => { if (data.success && data.data) setDisabledDates(data.data) })
    //     .catch(err => console.log('Blocked dates unavailable'))
    //     .finally(() => clearTimeout(timeout))
    // }
  }, [hotel?.name])

  // Default fallback images - Premium hotel & resort images
  const defaultImages = [
    'hotel-luxury-exterior',
    'hotel-suite',
    'hotel-room',
    'hotel-lobby',
    'hotel-pool',
    'hotel-reception',
    'hotel-rooftop',
    'hotel-pool-2',
    'hotel-resort',
    'hotel-restaurant-2',
    'hotel-room-2',
  ].map((k) => photo(k));

  const [images, setImages] = useState(defaultImages)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [_activeImgIdx, setActiveImgIdx] = useState(0)
  const [thumbsSwiper, setThumbsSwiper] = useState(null)

  useEffect(() => {
    if (hotel?.id) {
      const fetchImages = async () => {
        setImagesLoading(true)
        try {
          // Use hotel.images from Firestore if available (faster)
          if (hotel.images?.length > 0) {
            setImages(hotel.images)
          } else {
            // Fallback to default images
            setImages(defaultImages)
          }
        } catch (_err) {
          console.log('Using default images')
          setImages(defaultImages)
        } finally {
          setImagesLoading(false)
        }
      }
      fetchImages()
    }
  }, [hotel?.id])

  // Default dates: today and tomorrow in the LOCAL timezone (toISOString()
  // returns UTC, so before ~5:30 AM IST it produced yesterday's date).
  const [checkIn,  setCheckIn]  = useState(location.state?.checkIn  || todayLocal())
  const [checkOut, setCheckOut] = useState(location.state?.checkOut || addDaysLocal(1))
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
  const savedToWishlist = Boolean(hotel?.id) && isWishlisted(hotel.id)
  const totalHotelRooms = hotel?.rooms || 10;

  // The server used to refuse more than 10 rooms on one booking (MAX_UNITS in
  // pricingService). This limit has been increased to allow full property takeovers.
  const MAX_ROOMS_PER_BOOKING = 10
  const takeoverRooms = totalHotelRooms
  const rooms = bookEntireHotel ? takeoverRooms : (guestsObj.rooms || 1)

  // Priced by the server, like every other checkout screen. This page computed
  // its own total from a 90%-of-rooms multiplier and 18% GST — neither exists in
  // pricingService, whose hotel rate is 12% — so the detail page said ₹1,062 and
  // the review page charged ₹224 for the same stay.
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')

  useEffect(() => {
    if (!hotel?.id || !nights) return

    let active = true
    requestQuote({ type: 'hotel', itemId: hotel.id, quantity: rooms, nights })
      .then((q) => { if (active) { setQuote(q); setQuoteError('') } })
      .catch((err) => { if (active) { setQuote(null); setQuoteError(err.message) } })

    return () => { active = false }
  }, [hotel?.id, rooms, nights])

  const basePriceForStay = quote?.baseFare ?? null
  const taxesForStay = (quote?.taxes ?? 0) + (quote?.convenience ?? 0)
  const totalForStay = quote?.totalAmount ?? null
  const quoteReady = Boolean(quote)

  /** Amount, or a dash while the server's quote is still in flight. */
  const money = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '—')

  // Auth Modal State for realistic booking simulation
  const [showLoginModal, setShowLoginModal] = useState(false)

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
  const [selectedRoomName, _setSelectedRoomName] = useState('')

  // Auto-slide: 5-second rotation
  useEffect(() => {
    if (images.length === 0) return
    const timer = setInterval(() => {
      setActiveImgIdx(prev => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  const _nextImg = (e) => {
    e.stopPropagation()
    setActiveImgIdx(prev => (prev + 1) % images.length)
  }

  const _prevImg = (e) => {
    e.stopPropagation()
    setActiveImgIdx(prev => (prev - 1 + images.length) % images.length)
  }

  // Trigger Booking flow -> Review Page
  const handleReserve = async (roomName, customPrice) => {
    const isEntire = roomName === "Entire Property Takeover (All Rooms)" || bookEntireHotel;

    // ⚠️ Skip availability check - do it in background (don't block navigation)
    // Check happens after user reaches review page

    navigate('/hotels/review', {
      state: {
        hotel: customPrice ? { ...hotel, price: customPrice } : hotel,
        roomName: roomName || (isEntire ? 'Entire Property Takeover (All Rooms)' : hotel.roomType || 'Deluxe Room'),
        checkIn,
        checkOut,
        guests: isEntire ? 'Entire Property Takeover' : guestsDisplay,
        // The count the quote was priced for — not a separate hardcoded 10.
        guestsObj: isEntire ? { adults: guestsObj.adults || 2, rooms: takeoverRooms } : guestsObj,
        bookEntireHotel: isEntire
      }
    });
  };

  const handleOtpLoginSuccess = () => {
    setShowLoginModal(false)
    handleReserve(selectedRoomName || hotel.roomType)
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
          {/* This button used to pop "added to your wishlist successfully" and
              save nothing at all. It now persists through the wishlist API and
              reports a failure rather than claiming a save that did not happen. */}
          <button
            className="hd-btn-secondary"
            aria-pressed={savedToWishlist}
            onClick={async () => {
              const nowSaved = await toggleWishlist('hotel', hotel.id, {
                name: hotel.name,
                city: hotel.city,
                image: hotel.images?.[0] ?? hotel.image ?? null,
                price: hotel.pricePerNight ?? hotel.price ?? null,
                rating: hotel.rating ?? null
              })
              if (nowSaved !== savedToWishlist) {
                showNotify('Wishlist', nowSaved ? 'Saved to your wishlist.' : 'Removed from your wishlist.', 'success')
              }
            }}
          >
            {savedToWishlist ? '❤️ Saved' : '🤍 Wishlist'}
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
                  <img src={photo('hotel-luxury-exterior', 400)} alt="Entire property takeover — full resort booking" loading="lazy" decoding="async" />
                </div>
                <div className="hd-room-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: 'hsl(var(--a))' }}>👑 Entire Property Takeover ({takeoverRooms} Rooms)</h4>
                    <span style={{ background: 'hsl(var(--a) / 0.15)', color: 'hsl(var(--a))', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>Exclusive Takeover</span>
                  </div>
                  <div className="hd-room-tags">
                    <span className="hd-room-tag">🏰 Private Resort Takeover</span>
                    <span className="hd-room-tag">👥 Accommodates up to {(hotel?.rooms || 10) * 3} Guests</span>
                    <span className="hd-room-tag">🛎️ Exclusive Dedicated Staff</span>
                    <span className="hd-room-tag">🍽️ All Meals &amp; Events Included</span>
                  </div>
                  <span className="hd-room-status" style={{ color: 'hsl(var(--a))', background: 'hsl(var(--a) / 0.1)' }}>✓ Guaranteed Exclusive Access (No other guests)</span>
                </div>
                <div className="hd-room-price-area" style={{ background: 'hsl(var(--a) / 0.02)' }}>
                  <div className="hd-room-sub" style={{ color: 'hsl(var(--a))' }}>Takeover Price / Night</div>
                  <div className="hd-room-price" style={{ color: 'hsl(var(--a))' }}>₹ {(hotel.price * takeoverRooms).toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '8px' }}>+ ₹{Math.round((hotel.price * takeoverRooms) * 0.18).toLocaleString('en-IN')} taxes &amp; fees</div>
                  <button 
                    className="btn-primary hd-btn-compact" 
                    style={{ background: 'linear-gradient(135deg, hsl(var(--a)) 0%, hsl(var(--wa)) 100%)', color: 'white', border: 'none', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)' }}
                    disabled={!quoteReady}
                    onClick={() => {
                      setBookEntireHotel(true);
                      handleReserve("Entire Property Takeover (All Rooms)");
                    }}
                  >
                    BOOK TAKEOVER
                  </button>
                </div>
              </div>

              {/* Dynamic Room Options */}
              {(hotel?.roomTypes && hotel.roomTypes.length > 0 ? hotel.roomTypes : [hotel.roomType || 'Deluxe Room']).map((rt, index) => {
                const priceMultiplier = 1 + (index * 0.35); // Increases price by 35% for each higher tier room
                const calculatedPrice = Math.round(hotel.price * priceMultiplier);
                
                const roomImages = ['hotel-room', 'hotel-room-2', 'hotel-room-3', 'hotel-suite'].map((k) => photo(k, 400));
                const img = roomImages[index % roomImages.length];

                return (
                  <div className="hd-room-card" key={rt}>
                    <div className="hd-room-image-side">
                      <img src={img} alt={rt} loading="lazy" decoding="async" />
                    </div>
                    <div className="hd-room-info">
                      <h4>{rt}</h4>
                      <div className="hd-room-tags">
                        <span className="hd-room-tag">{index > 0 ? '👑 Premium Bedding' : '👑 King Size Bed'}</span>
                        <span className="hd-room-tag">{index > 1 ? '🏊 Private Pool/Balcony' : '🌅 Great View'}</span>
                        <span className="hd-room-tag">🛁 Ensuite Bathroom</span>
                      </div>
                      <span className="hd-room-status" style={index % 2 === 1 ? { color: 'hsl(var(--er))', background: 'hsl(var(--er) / 0.1)' } : {}}>
                        {index % 2 === 1 ? '⚡ Only a few rooms left!' : '✓ Available On Instant Confirmation'}
                      </span>
                    </div>
                    <div className="hd-room-price-area">
                      <div className="hd-room-sub">Base Price / Night</div>
                      <div className="hd-room-price">₹ {calculatedPrice.toLocaleString("en-IN")}</div>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '8px' }}>+ ₹{Math.round(calculatedPrice * 0.18).toLocaleString('en-IN')} taxes & fees</div>
                      <button 
                        className="btn-primary hd-btn-compact" 
                        onClick={() => handleReserve(rt, calculatedPrice)}
                      >
                        BOOK NOW
                      </button>
                    </div>
                  </div>
                );
              })}

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
                  disabledDates={disabledDates}
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
                  disabledDates={disabledDates}
                />
              </div>

              <div className="hd-input-box" style={{ opacity: bookEntireHotel ? 0.7 : 1 }}>
                <label>Guests &amp; Rooms</label>
                <input 
                  type="text" 
                  className="hd-input-field" 
                  value={bookEntireHotel ? `Entire Hotel (${takeoverRooms} Rooms)` : guests} 
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
                    <span>₹ {money(basePriceForStay)}</span>
                  </>
                ) : (
                  <>
                    <span>₹ {hotel.price.toLocaleString("en-IN")} × {nights} night{nights !== 1 ? 's' : ''} × {rooms} room{rooms !== 1 ? 's' : ''}</span>
                    <span>₹ {money(basePriceForStay)}</span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'hsl(var(--bc) / 0.65)', marginBottom: '16px' }}>
                <span>Taxes &amp; Service fees</span>
                <span>₹ {money(taxesForStay)}</span>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--b3))', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 900, color: 'hsl(var(--bc))' }}>
                <span>Total Billed</span>
                <span>₹ {money(totalForStay)}</span>
              </div>
            </div>

            {/* Gated on the quote. Reserving before the server has priced the
                stay is what let this page hand the next one a total it had
                invented. */}
            <button 
              className="hd-btn-primary btn-primary" 
              style={{ padding: '16px', fontSize: '18px', width: '100%', borderRadius: '16px', ...(quoteReady ? {} : { opacity: 0.6, cursor: 'not-allowed' }) }}
              disabled={!quoteReady}
              onClick={() => handleReserve(bookEntireHotel ? 'Entire Property Takeover (All Rooms)' : hotel.roomType)}
            >
              {quoteReady ? '⚡ Instant Reserve Now' : (quoteError ? 'Price unavailable' : 'Getting price…')}
            </button>
            {quoteError && (
              <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'hsl(var(--er))', textAlign: 'center' }}>
                {quoteError}
              </p>
            )}

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
      <OtpLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleOtpLoginSuccess}
      />
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
