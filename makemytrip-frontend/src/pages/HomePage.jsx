

import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { SERVICE_TABS } from '../data/homepageData'
import { CITIES } from '../data/cities'
import { flightService } from '../services/flightService'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import { todayLocal, toLocalDateStr } from '../utils/date'

import { useTranslation } from '../hooks/useTranslation'

import '../styles/HomePage.css'
import '../styles/Hero.css'
import { photo } from '../utils/images'

const TRIP_TYPES = [
  { id: 'oneway',    label: 'One-way' },
  { id: 'roundtrip', label: 'Round-trip' },
  { id: 'multicity', label: 'Multi-city' },
]

const FARES = ['Regular', 'Student', 'Armed Forces', 'Senior Citizen', 'Doctors & Nurses']

const OFFERS = [
  { type: 'flight',  tag: 'FLIGHTS',  title: 'Flat 25% off domestic flights',  desc: 'Save up to ₹3,000 on bookings made with HDFC credit cards. Code: MMTHDFC',          cta: 'Book Now', image: photo('flight-airplane') },
  { type: 'hotel',   tag: 'HOTELS',   title: 'Hotels at ₹999 per night',        desc: 'Verified 3-star+ stays across 80 Indian cities. Free cancellation included.',        cta: 'View Deals', image: photo('hotel-luxury-exterior') },
  { type: 'luxury',  tag: 'LUXURY',   title: 'Premium escapes, up to 40% off',  desc: 'Curated 5-star resorts in Maldives, Bali, and the Andamans for your dream getaway.', cta: 'Explore', image: photo('hotel-rooftop') },
  { type: 'beach',   tag: 'PACKAGES', title: 'Goa long weekend bundle',          desc: 'Flights + hotel + airport transfer from ₹14,499 per person. 3N / 4D.',              cta: 'Book Now', image: photo('dest-goa') },
  { type: 'cab',     tag: 'CABS',     title: 'Flat ₹200 off airport cabs',       desc: 'Reliable airport transfers in 60+ cities. Pay only when you ride.',                  cta: 'Book Cab', image: photo('cab-taxi') },
]

const CATEGORIES = [
  { key: 'flights',  icon: '✈',  title: 'Flights',  desc: 'Lowest fares across 500+ airlines, with Price Lock and free cancellation options.' },
  { key: 'hotels',   icon: '🏨', title: 'Hotels',   desc: 'Pay-at-hotel options, verified reviews, and 2 lakh+ properties worldwide.' },
  { key: 'holidays', icon: '🏝', title: 'Holidays', desc: 'End-to-end packages with flights, stays, sightseeing, and dedicated trip planners.' },
  { key: 'cabs',     icon: '🚕', title: 'Cabs',     desc: 'Airport transfers, outstation, and hourly rentals — at transparent flat fares.' },
]

const PARTNERS = [
  { cls: 'hp-p-ai', name: 'Air India' },
  { cls: 'hp-p-6e', name: 'IndiGo' },
  { cls: 'hp-p-uk', name: 'Vistara' },
  { cls: 'hp-p-sg', name: 'SpiceJet' },
  { cls: 'hp-p-tj', name: 'Taj Hotels' },
  { cls: 'hp-p-mt', name: 'Marriott' },
  { cls: 'hp-p-ob', name: 'Oberoi' },
  { cls: 'hp-p-tg', name: 'Treebo' },
]

const DESTINATIONS = [
  { cls: 'hp-d-goa',       name: 'Goa',       desc: 'Beach destinations · 4 nights', price: '₹12,499' },
  { cls: 'hp-d-manali',    name: 'Manali',     desc: 'Hill stations · 5 nights',      price: '₹9,999' },
  { cls: 'hp-d-jaipur',    name: 'Jaipur',     desc: 'Heritage & culture · 3 nights', price: '₹8,499' },
  { cls: 'hp-d-kerala',    name: 'Kerala',     desc: 'Backwaters · 6 nights',         price: '₹16,999' },
  { cls: 'hp-d-udaipur',   name: 'Udaipur',    desc: 'Lakes & palaces · 3 nights',    price: '₹11,299' },
  { cls: 'hp-d-ladakh',    name: 'Ladakh',     desc: 'Adventure · 7 nights',          price: '₹24,999' },
  { cls: 'hp-d-rishikesh', name: 'Rishikesh',  desc: 'Yoga & wellness · 2 nights',    price: '₹6,999' },
  { cls: 'hp-d-andaman',   name: 'Andaman',    desc: 'Islands · 5 nights',            price: '₹19,499' },
]

const PICKS = [
  { cls: 'hp-pick-1', eyebrow: "EDITOR'S PICK", title: 'Spice route through Kerala',  desc: '10-day curated journey through tea plantations, backwaters, and coastal towns.', from: '₹42,999' },
  { cls: 'hp-pick-2', eyebrow: 'NEW',            title: 'Northeast escapes',            desc: 'Tawang & Shillong · 6N' },
  { cls: 'hp-pick-3', eyebrow: 'WELLNESS',       title: 'Yoga retreats',                desc: 'Rishikesh & Pondicherry' },
  { cls: 'hp-pick-4', eyebrow: 'LUXURY',         title: 'Royal Rajasthan',              desc: 'Heritage palace stays' },
  { cls: 'hp-pick-5', eyebrow: 'ADVENTURE',      title: 'Himalayan treks',              desc: 'Beginner to expert routes' },
]

export default function HomePage() {
  const { t } = useTranslation()
  const [activeTab,  setActiveTab]  = useState('flights')
  const [tripType,   setTripType]   = useState('oneway')
  const [activeFare, setActiveFare] = useState('Regular')

  // Autocomplete & Search state variables
  const [fromQuery, setFromQuery] = useState('')
  const [fromCity, setFromCity] = useState(null)
  const [debouncedFromQuery, setDebouncedFromQuery] = useState('')
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [fromActiveIdx, setFromActiveIdx] = useState(-1)
  const [fromError, setFromError] = useState('')

  const [toQuery, setToQuery] = useState('')
  const [toCity, setToCity] = useState(null)
  const [debouncedToQuery, setDebouncedToQuery] = useState('')
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [toActiveIdx, setToActiveIdx] = useState(-1)
  const [toError, setToError] = useState('')

  // Traveler states
  const [travellers, setTravellers] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    class: 'Economy'
  })
  const [showTravellerDropdown, setShowTravellerDropdown] = useState(false)

  // Date and UI controls
  const [departDate, setDepartDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [returnDate, setReturnDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const year = tomorrow.getFullYear()
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [showDepartCal, setShowDepartCal] = useState(false)
  const [showReturnCal, setShowReturnCal] = useState(false)
  const [phone,      setPhone]      = useState('')

  // Results & Loading controls
  const [_loading, setLoading] = useState(false)
  const [_searched, setSearched] = useState(false)
  const [_flights, setFlights] = useState([])

  const fromRef = useRef(null)
  const toRef = useRef(null)
  const travellerRef = useRef(null)

  // Recent searches list
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('recentSearches_flights')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFromQuery(fromQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [fromQuery])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedToQuery(toQuery)
    }, 300)
    return () => clearTimeout(handler)
  }, [toQuery])

  // Autocomplete filtering
  const fromSuggestions = useMemo(() => {
    if (!debouncedFromQuery || debouncedFromQuery.trim().length < 1) return []
    const q = debouncedFromQuery.toLowerCase().trim()
    return CITIES.filter(c =>
      c.city.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [debouncedFromQuery])

  const toSuggestions = useMemo(() => {
    if (!debouncedToQuery || debouncedToQuery.trim().length < 1) return []
    const q = debouncedToQuery.toLowerCase().trim()
    return CITIES.filter(c =>
      c.city.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    ).slice(0, 5)
  }, [debouncedToQuery])

  // Click outside to close overlays
  useEffect(() => {
    function handleClickOutside(e) {
      if (fromRef.current && !fromRef.current.contains(e.target)) setShowFromSuggestions(false)
      if (toRef.current && !toRef.current.contains(e.target)) setShowToSuggestions(false)
      if (travellerRef.current && !travellerRef.current.contains(e.target)) setShowTravellerDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-adjust return date when departure date changes
  useEffect(() => {
    if (tripType === 'roundtrip' && departDate && returnDate) {
      const departDateObj = new Date(departDate)
      const returnDateObj = new Date(returnDate)
      if (returnDateObj <= departDateObj) {
        const nextDay = new Date(departDate)
        nextDay.setDate(nextDay.getDate() + 1)
        setReturnDate(toLocalDateStr(nextDay))
      }
    }
  }, [departDate, tripType])

  // Initialize AOS On-Scroll Animations
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic',
      offset: 80,
    })
  }, [])

  const selectFromCity = (c) => {
    setFromQuery(c.city)
    setFromCity(c)
    setFromError('')
    setShowFromSuggestions(false)
    setFromActiveIdx(-1)
  }

  const selectToCity = (c) => {
    setToQuery(c.city)
    setToCity(c)
    setToError('')
    setShowToSuggestions(false)
    setToActiveIdx(-1)
  }

  const handleFromKeyDown = (e) => {
    if (!showFromSuggestions || fromSuggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFromActiveIdx(i => Math.min(i + 1, fromSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFromActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && fromActiveIdx >= 0) {
      e.preventDefault()
      selectFromCity(fromSuggestions[fromActiveIdx])
    } else if (e.key === 'Escape') {
      setShowFromSuggestions(false)
    }
  }

  const handleToKeyDown = (e) => {
    if (!showToSuggestions || toSuggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setToActiveIdx(i => Math.min(i + 1, toSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setToActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && toActiveIdx >= 0) {
      e.preventDefault()
      selectToCity(toSuggestions[toActiveIdx])
    } else if (e.key === 'Escape') {
      setShowToSuggestions(false)
    }
  }

  const handleTravellerChange = (type, action) => {
    setTravellers(prev => {
      const current = prev[type]
      if (action === 'dec') {
        if (type === 'adults' && current <= 1) return prev
        if (current <= 0) return prev
        const nextVal = current - 1
        if (type === 'adults' && prev.infants > nextVal) {
          alert("Each infant must be accompanied by at least one adult.")
          return prev
        }
        return { ...prev, [type]: nextVal }
      } else {
        if (type === 'adults' && current >= 9) return prev
        if (current >= 6) return prev
        const nextVal = current + 1
        if (type === 'infants' && nextVal > prev.adults) {
          alert("You cannot add more infants than the total number of accompanying adults.")
          return prev
        }
        return { ...prev, [type]: nextVal }
      }
    })
  }

  // Helper to format date into Day, Month Name, Year and Weekday
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return { day: 'Select', monthYear: 'Date', weekday: 'Click to select' };
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return { day: 'Select', monthYear: 'Date', weekday: 'Click to select' };
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(date.getTime())) return { day: 'Select', monthYear: 'Date', weekday: 'Click to select' };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    const yearShort = String(date.getFullYear()).slice(-2);
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdays[date.getDay()];
    return {
      day: String(date.getDate()),
      monthYear: `${monthName} '${yearShort}`,
      weekday
    };
  };

  const _dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { _user }  = useSelector(s => s.auth)

  const triggerSearch = async (fromVal, toVal, dateVal) => {
    setLoading(true)
    setSearched(true)
    setFlights([])
    try {
      await new Promise(r => setTimeout(r, 600))
      const res = await flightService.search({
        from: fromVal,
        to: toVal,
        date: dateVal
      })
      // Save recent search
      const filtered = recentSearches.filter(item => 
        !(item.from.toLowerCase() === fromVal.toLowerCase() && 
          item.to.toLowerCase() === toVal.toLowerCase())
      )
      const updated = [{ from: fromVal, to: toVal, date: dateVal }, ...filtered].slice(0, 3)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches_flights', JSON.stringify(updated))

      setFlights(res?.data || res?.flights || res || [])
    } catch (err) {
      console.error(err)
      setFlights([])
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    if (e) e.preventDefault()
    let hasError = false

    if (!fromQuery.trim()) {
      setFromError('Please enter a departure city')
      hasError = true
    }
    if (!toQuery.trim()) {
      setToError('Please enter a destination city')
      hasError = true
    }
    if (hasError) return

    try {
      if (activeTab === 'flights') {
        localStorage.setItem('travellers_flight', JSON.stringify(travellers))
      } else if (activeTab === 'buses') {
        localStorage.setItem('travellers_bus', JSON.stringify(travellers))
      }
    } catch (err) {
      console.error(err)
    }

    const passengersCount = travellers.adults + travellers.children;
    const fromVal = fromCity?.city || fromQuery
    const toVal = toCity?.city || toQuery
    const dateVal = departDate || todayLocal()

    if (activeTab === 'buses') {
      let url = `/buses/results?from=${fromVal}&to=${toVal}&date=${dateVal}&passengers=${passengersCount}`
      navigate(url)
    } else {
      let url = `/flights/results?from=${fromVal}&to=${toVal}&date=${dateVal}&passengers=${passengersCount}&class=${travellers.class || 'Economy'}&type=${tripType}`
      if (tripType === 'roundtrip' && returnDate) {
        url += `&returnDate=${returnDate}`
      }
      navigate(url)
    }
  }


  return (
    <div className="hp-root">

      {/* ── Hero + Booking widget ───────────────────────────────── */}
      <header className="hp-hero">
        <div className="hp-plane">✈</div>
        <div className="hp-wrap hp-hero-inner">
          <div className="hp-eyebrow">
            <span className="hp-dot-gold"></span>
            Summer sale · Up to 25% off domestic flights
          </div>
          <h1>{t('plan_title')}<span>{t('unforgettable')}</span>{t('trip')}</h1>
          <p className="hp-hero-sub">
            {t('hero_sub')}
          </p>

          <div className="hp-booker">
            {/* Premium service navigation tab strip matching image2 */}
            <div className="service-tabs" style={{ marginBottom: 20 }}>
              {SERVICE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`service-tab${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'hotels') navigate('/hotels')
                    if (tab.id === 'villas') navigate('/homestays')
                    if (tab.id === 'trains') navigate('/trains')
                    if (tab.id === 'holidays') navigate('/holidays')
                    if (tab.id === 'cabs') navigate('/cabs')
                    if (tab.id === 'buses') navigate('/buses')
                    if (tab.id === 'cruise') navigate('/cruise')
                    if (tab.id === 'forex') navigate('/forex')
                    if (tab.id === 'insurance') navigate('/insurance')
                  }}
                >
                  {tab.isNew && <span className="tab-new">new</span>}
                  <span className="tab-icon"><TabIcon id={tab.id} size={26} /></span>
                  <span className="tab-lbl" style={{ whiteSpace: 'pre-line' }}>{t(tab.id) || tab.label}</span>
                  {activeTab === tab.id && <div className="tab-bar" />}
                </button>
              ))}
            </div>

            <div className="hp-booker-body">
              {activeTab === 'flights' && (
                <div className="hp-trip-row">
                  {TRIP_TYPES.map(tt => (
                    <button
                      key={tt.id}
                      type="button"
                      className={`hp-trip-btn${tripType === tt.id ? ' hp-trip-on' : ''}`}
                      onClick={() => setTripType(tt.id)}
                    >
                      <span className="hp-radio-dot"></span>
                      {tt.label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSearch}>
                <div className="hp-grid">
                  {/* From Field */}
                  <div className="hp-field hp-field-wrap" ref={fromRef} style={{ position: 'relative' }}>
                    <small>{t('from')}</small>
                    <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
                      <input
                        value={fromQuery}
                        onChange={e => {
                          setFromQuery(e.target.value)
                          setFromCity(null)
                          setFromError('')
                          setShowFromSuggestions(true)
                          setFromActiveIdx(-1)
                        }}
                        onKeyDown={handleFromKeyDown}
                        onFocus={() => setShowFromSuggestions(true)}
                        placeholder="Enter city"
                      />
                      {fromQuery && (
                        <button
                          type="button"
                          className="hp-input-clear"
                          onClick={() => {
                            setFromQuery('')
                            setFromCity(null)
                            setFromError('')
                            setShowFromSuggestions(false)
                            setFromActiveIdx(-1)
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#999',
                            padding: '4px 8px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {fromError && <div style={{ color: 'hsl(var(--er))', fontSize: '12px', marginTop: '4px' }}>{fromError}</div>}
                    <div className="hp-sub">Departure city</div>

                    {showFromSuggestions && fromSuggestions.length > 0 && (
                      <div className="hp-autocomplete-dropdown">
                        {fromSuggestions.map((c, idx) => (
                          <div
                            key={c.code}
                            className={`hp-suggestion-item${fromActiveIdx === idx ? ' active' : ''}`}
                            onClick={() => selectFromCity(c)}
                          >
                            <div className="hp-suggestion-left">
                              <span className="hp-suggestion-city">{c.city}</span>
                              <span className="hp-suggestion-country">{c.airport || c.region || c.country}</span>
                            </div>
                            <span className="hp-suggestion-code">{c.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* To Field */}
                  <div className="hp-field hp-field-wrap" ref={toRef} style={{ position: 'relative' }}>
                    <small>{t('to')}</small>
                    <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
                      <input
                        value={toQuery}
                        onChange={e => {
                          setToQuery(e.target.value)
                          setToCity(null)
                          setToError('')
                          setShowToSuggestions(true)
                          setToActiveIdx(-1)
                        }}
                        onKeyDown={handleToKeyDown}
                        onFocus={() => setShowToSuggestions(true)}
                        placeholder="Enter city"
                      />
                      {toQuery && (
                        <button
                          type="button"
                          className="hp-input-clear"
                          onClick={() => {
                            setToQuery('')
                            setToCity(null)
                            setToError('')
                            setShowToSuggestions(false)
                            setToActiveIdx(-1)
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#999',
                            padding: '4px 8px'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {toError && <div style={{ color: 'hsl(var(--er))', fontSize: '12px', marginTop: '4px' }}>{toError}</div>}
                    <div className="hp-sub">Arrival city</div>

                    {showToSuggestions && toSuggestions.length > 0 && (
                      <div className="hp-autocomplete-dropdown">
                        {toSuggestions.map((c, idx) => (
                          <div
                            key={c.code}
                            className={`hp-suggestion-item${toActiveIdx === idx ? ' active' : ''}`}
                            onClick={() => selectToCity(c)}
                          >
                            <div className="hp-suggestion-left">
                              <span className="hp-suggestion-city">{c.city}</span>
                              <span className="hp-suggestion-country">{c.airport || c.region || c.country}</span>
                            </div>
                            <span className="hp-suggestion-code">{c.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Departure Field */}
                  <div className="hp-field clickable" onClick={(e) => { e.stopPropagation(); setShowDepartCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                    <small>{t('departure')}</small>
                    <div className="hp-field-big" style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0' }}>
                      {formatDateDisplay(departDate).day} <span className="hp-unit" style={{ fontSize: '14px', fontWeight: 600 }}>{formatDateDisplay(departDate).monthYear}</span>
                    </div>
                    <div className="hp-sub">{formatDateDisplay(departDate).weekday}</div>
                    <CustomCalendarPicker
                      isOpen={showDepartCal}
                      value={departDate}
                      onChange={(date) => {
                        const today = new Date()
                        today.setHours(0,0,0,0)
                        if (new Date(date) < today) {
                          alert("Departure date cannot be in the past. Please select a valid date.")
                          return
                        }
                        setDepartDate(date)
                      }}
                      onClose={() => setShowDepartCal(false)}
                      labelText="Departure"
                    />
                  </div>

                  {/* Return Field - only for flights roundtrip */}
                  {activeTab === 'flights' && (
                    <div className="hp-field clickable" style={{ position: 'relative', cursor: 'pointer' }}>
                      <small>{t('return')}</small>
                      {tripType === 'roundtrip' ? (
                        <div onClick={(e) => { e.stopPropagation(); setShowReturnCal(true); }}>
                          <div className="hp-field-big" style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0' }}>
                            {formatDateDisplay(returnDate).day} <span className="hp-unit" style={{ fontSize: '14px', fontWeight: 600 }}>{formatDateDisplay(returnDate).monthYear}</span>
                          </div>
                          <div className="hp-sub">{formatDateDisplay(returnDate).weekday}</div>
                          <CustomCalendarPicker
                            isOpen={showReturnCal}
                            value={returnDate}
                            onChange={(date) => {
                              if (new Date(date) < new Date(departDate)) {
                                alert("Return date cannot be earlier than departure date.")
                                return
                              }
                              setReturnDate(date)
                            }}
                            onClose={() => setShowReturnCal(false)}
                            labelText="Return"
                          />
                        </div>
                      ) : (
                        <div className="hp-tap-hint" onClick={() => setTripType('roundtrip')} style={{ marginTop: '10px', fontSize: '12px', color: 'hsl(var(--p))', fontWeight: 600 }}>
                          Tap to add for bigger discounts
                        </div>
                      )}
                    </div>
                  )}

                  {/* Travellers Field */}
                  <div className="hp-field clickable" ref={travellerRef} onClick={() => setShowTravellerDropdown(true)} style={{ position: 'relative', cursor: 'pointer' }}>
                    <small>{activeTab === 'buses' ? t('passengers') : t('travellers')}</small>
                    <div className="hp-field-big">
                      {travellers.adults + travellers.children + travellers.infants} <span className="hp-unit">Passengers</span>
                    </div>
                    <div className="hp-sub">{activeTab === 'flights' ? travellers.class : 'All ages'}</div>

                    {showTravellerDropdown && (
                      <div className="hp-traveller-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="hp-traveller-row">
                          <div className="hp-traveller-label-col">
                            <span className="hp-traveller-label">Adults</span>
                            <span className="hp-traveller-sub">12 yrs &amp; above</span>
                          </div>
                          <div className="hp-counter-group">
                            <button type="button" className="hp-counter-btn" disabled={travellers.adults <= 1} onClick={() => handleTravellerChange('adults', 'dec')}>-</button>
                            <span className="hp-counter-val">{travellers.adults}</span>
                            <button type="button" className="hp-counter-btn" disabled={travellers.adults >= 9} onClick={() => handleTravellerChange('adults', 'inc')}>+</button>
                          </div>
                        </div>

                        <div className="hp-traveller-row">
                          <div className="hp-traveller-label-col">
                            <span className="hp-traveller-label">Children</span>
                            <span className="hp-traveller-sub">2 - 12 yrs</span>
                          </div>
                          <div className="hp-counter-group">
                            <button type="button" className="hp-counter-btn" disabled={travellers.children <= 0} onClick={() => handleTravellerChange('children', 'dec')}>-</button>
                            <span className="hp-counter-val">{travellers.children}</span>
                            <button type="button" className="hp-counter-btn" disabled={travellers.children >= 6} onClick={() => handleTravellerChange('children', 'inc')}>+</button>
                          </div>
                        </div>

                        <div className="hp-traveller-row">
                          <div className="hp-traveller-label-col">
                            <span className="hp-traveller-label">Infants</span>
                            <span className="hp-traveller-sub">Below 2 yrs</span>
                          </div>
                          <div className="hp-counter-group">
                            <button type="button" className="hp-counter-btn" disabled={travellers.infants <= 0} onClick={() => handleTravellerChange('infants', 'dec')}>-</button>
                            <span className="hp-counter-val">{travellers.infants}</span>
                            <button type="button" className="hp-counter-btn" disabled={travellers.infants >= 6} onClick={() => handleTravellerChange('infants', 'inc')}>+</button>
                          </div>
                        </div>

                        {activeTab === 'flights' && (
                          <div className="hp-class-selector">
                            <div className="hp-class-title">Choose Travel Class</div>
                            <div className="hp-class-chips">
                              {['Economy', 'Premium Economy', 'Business'].map(cl => (
                                <button
                                  key={cl}
                                  type="button"
                                  className={`hp-class-chip${travellers.class === cl ? ' active' : ''}`}
                                  onClick={() => setTravellers(prev => ({ ...prev, class: cl }))}
                                >
                                  {cl}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button type="button" className="hp-traveller-apply-btn" onClick={() => setShowTravellerDropdown(false)}>
                          APPLY
                        </button>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg rounded-full px-12 h-full">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2"/>
                      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                    </svg>
                    {t('search')}
                  </button>
                </div>

                {/* Recent Searches Row */}
                {recentSearches.length > 0 && (
                  <div className="hp-recent-row">
                    <span className="hp-recent-label">{t('recent_searches')}</span>
                    {recentSearches.map((item, idx) => (
                      <button
                        key={`${item.from}-${item.to}-${idx}`}
                        type="button"
                        className="hp-recent-chip"
                        onClick={() => {
                          setFromQuery(item.from)
                          setToQuery(item.to)
                          setDepartDate(item.date)
                          triggerSearch(item.from, item.to, item.date)
                        }}
                      >
                        {item.from} → {item.to} ({item.date})
                      </button>
                    ))}
                  </div>
                )}

                <div className="hp-fare-row">
                  <span className="hp-fare-lbl">{t('special_fares')}</span>
                  {FARES.map(f => (
                    <button
                      key={f}
                      type="button"
                      className={`hp-chip${activeFare === f ? ' hp-chip-on' : ''}`}
                      onClick={() => setActiveFare(f)}
                    >
                      <span className="hp-chip-dot">{activeFare === f ? '✓' : ''}</span>
                      {f}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          </div>
        </div>
      </header>




      {/* ── Offers ─────────────────────────────────────────────── */}
      <section className="hp-section">
        <div className="hp-wrap">
          <div className="hp-sec-head" data-aos="fade-up">
            <div>
              <h2>Offers &amp; deals</h2>
              <div className="hp-sec-sub">Limited-time savings curated for you</div>
            </div>
            <div className="hp-offers-controls">
              <a href="#offers" className="hp-see-all">View all offers →</a>
              <div className="hp-offer-nav">
                <button className="hp-offer-nav-btn hp-offer-prev" aria-label="Previous offer">
                  <svg className="hp-offer-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button className="hp-offer-nav-btn hp-offer-next" aria-label="Next offer">
                  <svg className="hp-offer-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              nextEl: '.hp-offer-next',
              prevEl: '.hp-offer-prev',
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={true}
            spaceBetween={24}
            breakpoints={{
              320: {
                slidesPerView: 1,
                spaceBetween: 16
              },
              768: {
                slidesPerView: 2.2,
                spaceBetween: 20
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24
              }
            }}
            className="hp-offers-swiper"
          >
            {OFFERS.map((o, idx) => (
              <SwiperSlide key={o.type} className="hp-offer-slide">
                <div className="hp-offer-card" data-aos="fade-up" data-aos-delay={idx * 100}>
                  <div className={`hp-offer-img hp-offer-${o.type}`} style={{ backgroundImage: `url(${o.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <span className="hp-offer-tag">{o.tag}</span>
                  </div>
                  <div className="hp-offer-body">
                    <h3>{o.title}</h3>
                    <p>{o.desc}</p>
                    <button className="hp-offer-btn">{o.cta}</button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────── */}
      <section className="hp-section-0">
        <div className="hp-wrap">
          <div className="hp-sec-head" data-aos="fade-up">
            <div>
              <h2>One app, every journey</h2>
              <div className="hp-sec-sub">Plan, book, and manage your entire trip in a single place</div>
            </div>
          </div>
          <div className="hp-cat-grid">
            {CATEGORIES.map((c, idx) => (
              <div key={c.key} className={`hp-cat-card hp-cat-${c.key}`} data-aos="fade-up" data-aos-delay={idx * 100}>
                <div className="hp-cat-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners ───────────────────────────────────────────── */}
      <section className="hp-section-0">
        <div className="hp-wrap">
          <div className="hp-sec-head" data-aos="fade-up">
            <div>
              <h2>We partner with the best</h2>
              <div className="hp-sec-sub">Trusted by every major airline and global hotel chain</div>
            </div>
          </div>
          <div className="hp-partners-bar" data-aos="fade-up">
            <div className="hp-partners-row">
              {PARTNERS.map(p => (
                <div key={p.name} className={`hp-partner ${p.cls}`}>{p.name}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Destinations ───────────────────────────────────────── */}
      <section className="hp-section-0">
        <div className="hp-wrap">
          <div className="hp-sec-head" data-aos="fade-up">
            <div>
              <h2>Destinations &amp; experiences</h2>
              <div className="hp-sec-sub">Hand-picked places that make for unforgettable trips</div>
            </div>
            <a href="#destinations" className="hp-see-all">All destinations →</a>
          </div>
          <div className="hp-dest-grid">
            {DESTINATIONS.map((d, idx) => (
              <div key={d.name} className="hp-dest-card" data-aos="zoom-in" data-aos-delay={idx * 100}>
                <div className={`hp-dest-img ${d.cls}`}></div>
                <div className="hp-dest-info">
                  <h3>{d.name}</h3>
                  <p>{d.desc}</p>
                  <div className="hp-dest-price">From {d.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top picks ──────────────────────────────────────────── */}
      <section className="hp-section-0">
        <div className="hp-wrap">
          <div className="hp-sec-head" data-aos="fade-up">
            <div>
              <h2>Top picks for May</h2>
              <div className="hp-sec-sub">Curated travel deals from our editors</div>
            </div>
            <a href="#picks" className="hp-see-all">See more →</a>
          </div>
          <div className="hp-picks-grid">
            {PICKS.map((p, idx) => (
              <div key={p.cls} className={`hp-pick ${p.cls}`} data-aos="fade-up" data-aos-delay={idx * 100}>
                <div className="hp-pick-content">
                  <span className="hp-pick-eyebrow">{p.eyebrow}</span>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  {p.from && (
                    <div className="hp-pick-from">From <b>{p.from}</b> per person</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── App banner ─────────────────────────────────────────── */}
      <section className="hp-section-0">
        <div className="hp-wrap">
          <div className="hp-app-banner" data-aos="fade-up">
            <div className="hp-app-text">
              <h2>The whole trip in your <span>pocket.</span></h2>
              <p>Download the MakeMyTrip app for exclusive in-app deals, faster check-in, and 24×7 trip support — wherever you go.</p>
              <div className="hp-app-input">
                <span className="hp-app-cc">
                  <span className="hp-flag" style={{ width: 20, height: 14 }}></span>
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                <button type="button">Send link</button>
              </div>
              <div className="hp-app-stores">
                <a href="#appstore" className="hp-app-store">
                  <span className="hp-glyph"></span>
                  <div><small>Download on the</small><strong>App Store</strong></div>
                </a>
                <a href="#playstore" className="hp-app-store">
                  <span className="hp-glyph">▶</span>
                  <div><small>Get it on</small><strong>Google Play</strong></div>
                </a>
              </div>
            </div>

            <div className="hp-phone-wrap">
              <div className="hp-phone">
                <div className="hp-phone-screen">
                  <div className="hp-phone-notch"></div>
                  <h4>Good evening</h4>
                  <h2>Where to next?</h2>
                  <div className="hp-phone-card">
                    <small>Trending</small>
                    <strong>Goa · ₹4,775</strong>
                  </div>
                  <div className="hp-phone-card">
                    <small>Last searched</small>
                    <strong>DEL → BLR · 14 May</strong>
                  </div>
                  <div className="hp-phone-cta">SEARCH FLIGHTS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
