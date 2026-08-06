import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import { CITIES as AUTOCOMPLETE_CITIES } from '../data/cities'
import { UDAIPUR_HOTELS } from '../data/udaipurHotelsData'
import { useWeather } from '../hooks/useWeather'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import { todayLocal, addDaysLocal } from '../utils/date'
import '../styles/Hero.css' // Navigation and topbar imports
import '../styles/HomePage.css' // Dynamic style imports
import { photo } from '../utils/images'
import SearchButton from '../components/Common/SearchButton'
import { searchHotels } from '../services/hotelService'

// Generates highly realistic stays for any input city
const generateHotelsForCity = (cityName) => {
  if (cityName.toLowerCase().trim() === 'udaipur') return UDAIPUR_HOTELS
  
  const imgUrls = [
    photo('hotel-luxury-exterior'),
    photo('hotel-room'),
    photo('hotel-pool'),
    photo('hotel-lobby'),
    photo('hotel-restaurant')
  ]

  const hotelNames = [
    `The Grand Palace ${cityName}`,
    `${cityName} Marina Resort`,
    `Aravalli Hills Retreat ${cityName}`,
    `Seaside Gateway ${cityName}`,
    `Heritage Villa ${cityName}`
  ]

  const localities = [
    'Downtown', 'Near Beach Road', 'Lakeside View', 'City Center', 'Old Haveli Street'
  ]

  return hotelNames.map((name, i) => ({
    id: `hotel-${cityName.toLowerCase().trim()}-${i}`,
    name,
    locality: localities[i % localities.length],
    rating: (4.2 + (i % 8) * 0.1).toFixed(1),
    ratingLabel: 'Excellent',
    reviews: 50 + (i * 37) % 200,
    price: 2500 + (i * 1250) % 8000,
    taxes: 250 + (i * 150) % 800,
    img: imgUrls[i % imgUrls.length]
  }))
}

export default function HotelsPage() {
  const navigate = useNavigate()
  // Computed once per mount rather than on every render: reading the clock
  // during render makes the value change between renders of the same screen.
  const [TODAY] = useState(() => todayLocal())
  const [TOMORROW] = useState(() => addDaysLocal(1))

  const [activeTab, setActiveTab] = useState('hotels')
  const [activeChip, setActiveChip] = useState('Free cancellation')
  const [checkInDate, setCheckInDate] = useState(TODAY)
  const [checkOutDate, setCheckOutDate] = useState(TOMORROW)
  const [showCheckInCal, setShowCheckInCal] = useState(false)
  const [showCheckOutCal, setShowCheckOutCal] = useState(false)
  
  // Autocomplete states
  const [city, setCity] = useState('Udaipur')
  const [debouncedCity, setDebouncedCity] = useState('Udaipur')
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)

  // Guest details state
  const [guests, setGuests] = useState({
    rooms: 1,
    adults: 2,
    children: 0
  })
  const [showGuestDropdown, setShowGuestDropdown] = useState(false)

  // Loading & Result States
  const [_loading, setLoading] = useState(false)
  const [_searched, setSearched] = useState(false)
  const [_hotels, setHotels] = useState([])

  const cityRef = useRef(null)
  const guestRef = useRef(null)

  // Recent hotel searches list
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recentSearches_hotels')
      return saved ? JSON.parse(saved) : [
        { city: 'Udaipur', date: todayLocal() },
        { city: 'Goa', date: '2026-05-15' }
      ]
    } catch {
      return []
    }
  })

  // Debouncing for city input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCity(city)
    }, 300)
    return () => clearTimeout(handler)
  }, [city])

  const citySuggestions = useMemo(() => {
    if (!debouncedCity || debouncedCity.trim().length < 1) return []
    const q = debouncedCity.toLowerCase().trim()
    return AUTOCOMPLETE_CITIES.filter(c =>
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [debouncedCity])

  // Click outside listener to dismiss popup menus
  useEffect(() => {
    function handleClickOutside(e) {
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCitySuggestions(false)
      if (guestRef.current && !guestRef.current.contains(e.target)) setShowGuestDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGuestChange = (type, action) => {
    setGuests(prev => {
      const current = prev[type]
      if (action === 'dec') {
        if (type === 'rooms' && current <= 1) return prev
        if (type === 'adults' && current <= 1) return prev
        if (current <= 0) return prev
        return { ...prev, [type]: current - 1 }
      } else {
        if (type === 'rooms' && current >= 4) return prev
        if (type === 'adults' && current >= 12) return prev
        if (type === 'children' && current >= 6) return prev
        return { ...prev, [type]: current + 1 }
      }
    })
  }

  // Trigger simulated hotel search
  const triggerHotelSearch = async (cityVal) => {
    setLoading(true)
    setSearched(true)
    setHotels([])
    try {
      await new Promise(r => setTimeout(r, 600))
      const results = generateHotelsForCity(cityVal)
      
      // Save recent search
      const filtered = recentSearches.filter(item => item.city.toLowerCase() !== cityVal.toLowerCase())
      const updated = [{ city: cityVal, date: checkInDate }, ...filtered].slice(0, 3)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches_hotels', JSON.stringify(updated))

      setHotels(results)
    } catch (e) {
      console.error(e)
      setHotels([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = () => {
    navigate(`/hotels/results?city=${city}&checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=${JSON.stringify(guests)}`)
  }

  // Helper to format date into Day, Month Name, Year and Weekday
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return { day: 'Select', monthYear: 'Date', weekday: 'Click to select' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { day: 'Select', monthYear: 'Date', weekday: 'Click to select' };
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).substring(2);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdays[date.getDay()];
    return {
      day: String(day),
      monthYear: `${month} '${year}`,
      weekday
    };
  };
  const { weather } = useWeather('Goa')

  // Helper for verified travel imagery

  // These four cards were invented hotels — "The Park Goa", "Taj Vivanta" and
  // friends existed nowhere in the datastore, so there was no detail page to
  // send anyone to and the cards had to stay inert. They are now real
  // properties, which makes each one openable.
  const DEAL_IMAGES = [photo('hotel-resort'), photo('hotel-luxury-exterior'), photo('hotel-pool'), photo('hotel-lobby')]
  const [deals, setDeals] = useState([])
  const [dealsLoading, setDealsLoading] = useState(true)

  useEffect(() => {
    let active = true
    // Asking for exactly four returned the first four alphabetically — four
    // Marriotts, in four cities nobody chose. Pull a wider slice, keep the best
    // rated property per city, and show four different places.
    searchHotels({ limit: 40 })
      .then((body) => {
        if (!active) return
        const list = Array.isArray(body?.data) ? body.data : []
        const bestPerCity = new Map()
        for (const h of list) {
          const key = (h.city || h.location || h.id || '').toLowerCase()
          const held = bestPerCity.get(key)
          if (!held || Number(h.rating || 0) > Number(held.rating || 0)) bestPerCity.set(key, h)
        }
        setDeals(
          [...bestPerCity.values()]
            .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
            .slice(0, 4)
        )
      })
      .catch(() => { if (active) setDeals([]) })
      .finally(() => { if (active) setDealsLoading(false) })
    return () => { active = false }
  }, [])

  const CITIES = [
    { name: 'Goa', count: '3,420 hotels', img: photo('dest-goa') },
    { name: 'Manali', count: '1,890 hotels', img: photo('dest-manali') },
    { name: 'Jaipur', count: '2,710 hotels', img: photo('dest-jaipur') },
    { name: 'Kerala', count: '4,150 hotels', img: photo('dest-kerala') },
    { name: 'Udaipur', count: '1,340 hotels', img: photo('dest-udaipur') },
    { name: 'Ladakh', count: '620 hotels', img: photo('dest-ladakh') }
  ]

  // Each category resolves to the city that best represents it. There is no
  // category filter on the listing endpoint, so a city search is the honest
  // interpretation — it lands the visitor on real inventory rather than a
  // filter the backend cannot apply.
  const CATS = [
    { name: 'Beach resorts', count: '1,240 stays', icon: '🌅', city: 'Goa' },
    { name: 'Hill stations', count: '980 stays', icon: '🏔', city: 'Manali' },
    { name: 'Heritage hotels', count: '420 stays', icon: '👑', city: 'Udaipur' },
    { name: '5-star luxury', count: '610 stays', icon: '💎', city: 'Mumbai' }
  ]

  const openHotel = (hotel) => {
    navigate(`/hotels/detail/${hotel.id}`, {
      state: { hotel, checkIn: checkInDate, checkOut: checkOutDate, guests }
    })
  }

  const openCity = (city) => {
    const params = new URLSearchParams({
      city,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: JSON.stringify(guests)
    })
    navigate(`/hotels/results?${params.toString()}`)
  }

  const handleTabChange = (id) => {
    setActiveTab(id)
    if (id === 'flights') navigate('/')
    if (id === 'hotels') navigate('/hotels')
    if (id === 'villas') navigate('/homestays')
    if (id === 'holidays') navigate('/holidays')
    if (id === 'trains') navigate('/trains')
    if (id === 'buses') navigate('/buses')
    if (id === 'cabs') navigate('/cabs')
    if (id === 'cruise') navigate('/cruise')
    if (id === 'forex') navigate('/forex')
    if (id === 'insurance') navigate('/insurance')
    if (id === 'tours') navigate('/tours')
    if (id === 'visa') navigate('/visa')
  }

  return (
    <div className="homepage-viewport-wrapper">
      
      {/* Hero Backdrop Panel */}
      <header className="phero hotels">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Hotels</span>
          </div>
          <h1>Find your perfect stay</h1>
          <p style={{ marginBottom: weather ? 10 : 28 }}>2 lakh+ properties · Pay at hotel · Free cancellations</p>
          {weather && (
            <div className="live-weather-badge" style={{ marginBottom: 28 }}>
              <span className="live-weather-pulse" />
              <span>Goa Weather: {weather.temp}°C {weather.emoji} {weather.desc}</span>
            </div>
          )}

          {/* Search Card */}
          <div className="inner-search-bcard">
            
            {/* Service navigation tab strip inside the search box */}
            <div className="service-tabs" style={{ marginBottom: 20 }}>
              {SERVICE_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`service-tab${activeTab === t.id ? ' active' : ''}`}
                  onClick={() => handleTabChange(t.id)}
                >
                  {t.isNew && <span className="tab-new">new</span>}
                  <span className="tab-icon"><TabIcon id={t.id} size={26} /></span>
                  <span className="tab-lbl" style={{ whiteSpace: 'pre-line' }}>{t.label}</span>
                  {activeTab === t.id && <div className="tab-bar" />}
                </button>
              ))}
            </div>

            {/* Inputs Grid */}
            <div className="inner-search-grid hotels-grid">
              {/* City input with ref and suggestions */}
              <div className="inner-search-field hp-field-wrap" style={{ cursor: 'text' }} ref={cityRef}>
                <div className="inner-field-lbl">City, hotel, or area</div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value)
                    setShowCitySuggestions(true)
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '18px', fontWeight: 800, color: 'var(--clr-text-primary)', width: '100%', padding: 0 }}
                  placeholder="Enter City"
                />
                <div className="inner-field-sub">
                  {AUTOCOMPLETE_CITIES.find(c => c.city.toLowerCase() === city.toLowerCase())?.region || 'India Area'}
                </div>

                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="hp-autocomplete-dropdown" style={{ left: 0, right: 0 }}>
                    {citySuggestions.map((c) => (
                      <div
                        key={c.code}
                        className="hp-suggestion-item"
                        onClick={() => {
                          setCity(c.city)
                          setShowCitySuggestions(false)
                        }}
                      >
                        <div className="hp-suggestion-left">
                          <span className="hp-suggestion-city">{c.city}</span>
                          <span className="hp-suggestion-country">{c.region || c.country}</span>
                        </div>
                        <span className="hp-suggestion-code">{c.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="inner-search-field" onClick={(e) => { e.stopPropagation(); setShowCheckInCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="inner-field-lbl">Check-in</div>
                <div className="inner-field-val">
                  {formatDateDisplay(checkInDate).day} <span className="unit-suffix">{formatDateDisplay(checkInDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(checkInDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showCheckInCal}
                  value={checkInDate}
                  onChange={(date) => {
                    setCheckInDate(date)
                    if (checkOutDate <= date) {
                      const nextDay = addDaysLocal(1, new Date(date))
                      setCheckOutDate(nextDay)
                    }
                  }}
                  onClose={() => setShowCheckInCal(false)}
                  labelText="Check-in"
                />
              </div>

              <div className="inner-search-field" onClick={(e) => { e.stopPropagation(); setShowCheckOutCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="inner-field-lbl">Check-out</div>
                <div className="inner-field-val">
                  {formatDateDisplay(checkOutDate).day} <span className="unit-suffix">{formatDateDisplay(checkOutDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(checkOutDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showCheckOutCal}
                  value={checkOutDate}
                  onChange={(date) => setCheckOutDate(date)}
                  onClose={() => setShowCheckOutCal(false)}
                  labelText="Check-out"
                />
              </div>

              {/* Rooms & Guests input with Popover */}
              <div className="inner-search-field hp-field-wrap" style={{ cursor: 'pointer', borderRight: 'none' }} ref={guestRef} onClick={() => setShowGuestDropdown(true)}>
                <div className="inner-field-lbl">Rooms &amp; Guests</div>
                <div className="inner-field-val">{guests.rooms} <span className="unit-suffix">Rooms · {guests.adults} Adults</span></div>
                <div className="inner-field-sub">{guests.children > 0 ? `${guests.children} Children` : 'Add children'}</div>

                {showGuestDropdown && (
                  <div className="hp-traveller-dropdown" style={{ left: 'auto', right: 0, width: '300px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="hp-traveller-row">
                      <div className="hp-traveller-label-col">
                        <span className="hp-traveller-label">Rooms</span>
                        <span className="hp-traveller-sub">Max 4 rooms per booking</span>
                      </div>
                      <div className="hp-counter-group">
                        <button type="button" className="hp-counter-btn" disabled={guests.rooms <= 1} onClick={() => handleGuestChange('rooms', 'dec')}>-</button>
                        <span className="hp-counter-val">{guests.rooms}</span>
                        <button type="button" className="hp-counter-btn" disabled={guests.rooms >= 4} onClick={() => handleGuestChange('rooms', 'inc')}>+</button>
                      </div>
                    </div>

                    <div className="hp-traveller-row">
                      <div className="hp-traveller-label-col">
                        <span className="hp-traveller-label">Adults</span>
                        <span className="hp-traveller-sub">12 yrs &amp; above</span>
                      </div>
                      <div className="hp-counter-group">
                        <button type="button" className="hp-counter-btn" disabled={guests.adults <= 1} onClick={() => handleGuestChange('adults', 'dec')}>-</button>
                        <span className="hp-counter-val">{guests.adults}</span>
                        <button type="button" className="hp-counter-btn" disabled={guests.adults >= 12} onClick={() => handleGuestChange('adults', 'inc')}>+</button>
                      </div>
                    </div>

                    <div className="hp-traveller-row">
                      <div className="hp-traveller-label-col">
                        <span className="hp-traveller-label">Children</span>
                        <span className="hp-traveller-sub">2 - 12 yrs</span>
                      </div>
                      <div className="hp-counter-group">
                        <button type="button" className="hp-counter-btn" disabled={guests.children <= 0} onClick={() => handleGuestChange('children', 'dec')}>-</button>
                        <span className="hp-counter-val">{guests.children}</span>
                        <button type="button" className="hp-counter-btn" disabled={guests.children >= 6} onClick={() => handleGuestChange('children', 'inc')}>+</button>
                      </div>
                    </div>

                    <button type="button" className="hp-traveller-apply-btn" onClick={() => setShowGuestDropdown(false)}>
                      APPLY
                    </button>
                  </div>
                )}
              </div>

              <SearchButton onClick={handleSearchSubmit} />
            </div>

            {/* Recent Searches chips row */}
            {recentSearches.length > 0 && (
              <div className="hp-recent-row" style={{ padding: '0 24px', marginBottom: '8px' }}>
                <span className="hp-recent-label">Recent Searches:</span>
                {recentSearches.map((item, idx) => (
                  <button
                    key={`${item.city}-${idx}`}
                    className="hp-recent-chip"
                    onClick={() => {
                      setCity(item.city)
                      triggerHotelSearch(item.city)
                    }}
                  >
                    {item.city} ({item.date})
                  </button>
                ))}
              </div>
            )}

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['Free cancellation', 'Pay at hotel', '4 stars & above', 'Couple friendly'].map((chip) => (
                <button
                  key={chip}
                  className={`inner-chip-btn ${activeChip === chip ? 'active' : ''}`}
                  onClick={() => setActiveChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </div>
      </header>



      {/* Hotel Deals Section */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Top hotel deals this week</h2>
            <p className="inner-sec-subtitle">Limited inventory · Book fast</p>
          </div>
          {/* Pointed at /hotels, the page it is already on. */}
          <span className="inner-sec-all-link" onClick={() => navigate('/hotels/results')}>View all →</span>
        </div>

        <div className="hotels-deals-grid">
          {dealsLoading && (
            <p className="hotels-deal-meta" style={{ padding: '8px 2px' }}>Loading this week’s deals…</p>
          )}

          {!dealsLoading && deals.length === 0 && (
            <p className="hotels-deal-meta" style={{ padding: '8px 2px' }}>
              Deals are unavailable right now. <button type="button" className="btn btn-sm btn-secondary" onClick={() => navigate('/hotels/results')}>Browse all hotels</button>
            </p>
          )}

          {deals.map((hotel, idx) => (
            <div
              key={hotel.id}
              className="hotels-deal-card"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
              role="link"
              tabIndex={0}
              aria-label={`${hotel.name} — view details`}
              style={{ cursor: 'pointer' }}
              onClick={() => openHotel(hotel)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHotel(hotel) }
              }}
            >
              <div className="hotels-deal-img-wrapper" style={{ backgroundImage: `url(${hotel.images?.[0] || DEAL_IMAGES[idx % DEAL_IMAGES.length]})` }} />
              <div className="hotels-deal-body">
                <h4>{hotel.name}</h4>
                <p className="hotels-deal-meta">
                  {[hotel.location || hotel.city, hotel.rating ? `${hotel.rating} ★` : null, hotel.stars ? `${hotel.stars}-star` : null]
                    .filter(Boolean).join(' · ')}
                </p>
                <div className="hotels-deal-price-row">
                  <span className="hotels-deal-price">₹{Number(hotel.price || 0).toLocaleString('en-IN')}</span>
                  <span className="hotels-deal-meta">/night</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Popular destinations</h2>
            <p className="inner-sec-subtitle">Where India is staying this season</p>
          </div>
        </div>

        {/* These went through with the city alone, so the dates and guests the
            visitor had already chosen above were dropped and the results page
            fell back to its own defaults. openCity carries them. */}
        <div className="hotels-cities-grid">
          {CITIES.map((city, idx) => (
            <div
              key={city.name}
              className="hotels-city-card"
              style={{ cursor: 'pointer' }}
              data-aos="zoom-in"
              data-aos-delay={idx * 100}
              role="link"
              tabIndex={0}
              aria-label={`Browse stays in ${city.name}`}
              onClick={() => openCity(city.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCity(city.name) }
              }}
            >
              <div className="hotels-city-bg" style={{ backgroundImage: `url(${city.img})` }} />
              <div className="hotels-city-info">
                <h4>{city.name}</h4>
                <small>{city.count}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by Category Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <h2 className="inner-sec-title">Browse by category</h2>
        </div>

        <div className="hotels-cats-grid">
          {CATS.map((cat, idx) => (
            <div
              key={cat.name}
              className="hotels-cat-card"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
              role="link"
              tabIndex={0}
              aria-label={`${cat.name} — browse stays in ${cat.city}`}
              style={{ cursor: 'pointer' }}
              onClick={() => openCity(cat.city)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCity(cat.city) }
              }}
            >
              <div className="hotels-cat-ico">{cat.icon}</div>
              <div className="hotels-cat-details">
                <h4>{cat.name}</h4>
                <p>{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
