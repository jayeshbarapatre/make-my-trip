import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { flightService } from '../services/flightService'
import { searchDummyFlights } from '../data/dummyFlights'
import FlightLoader from '../components/Atoms/FlightLoader'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import '../styles/FlightResults.css'

// ── Airline meta ──────────────────────────────────────────────
const AIRLINE_COLOR = {
  'IndiGo':           'var(--clr-indigo)',
  'Air India':        'var(--clr-airindia)',
  'Vistara':          'var(--clr-vistara)',
  'SpiceJet':         'var(--clr-spicejet)',
  'Akasa Air':        'var(--clr-akasa)',
  'Air India Express':'var(--clr-aiexpress)',
}
const AIRLINE_CODE = {
  'IndiGo':'6E','Air India':'AI','Vistara':'UK',
  'SpiceJet':'SG','Akasa Air':'QP','Air India Express':'IX',
}

// ── City → IATA ───────────────────────────────────────────────
const IATA = {
  'new delhi':'DEL','delhi':'DEL','bengaluru':'BLR','bangalore':'BLR',
  'mumbai':'BOM','chennai':'MAA','hyderabad':'HYD','kolkata':'CCU',
  'goa':'GOI','pune':'PNQ','ahmedabad':'AMD','jaipur':'JAI',
}
const getCode = (city='') => IATA[city.toLowerCase().trim()] || city.slice(0,3).toUpperCase()

// ── Helpers ───────────────────────────────────────────────────
const fmtTime = (iso) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
const fmtDuration = (m) => `${Math.floor(m/60)}h${m%60?` ${m%60}m`:''}`
const fmtPrice    = (p) => '₹' + Number(p).toLocaleString('en-IN')
const fmtDate     = (s) => {
  if (!s) return ''
  const d = new Date(s+'T00:00:00')
  return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'2-digit'})
}

// ── Promo banners ─────────────────────────────────────────────
const PROMOS = [
  {after:3, type:'hdfc',     logo:'HDFC', title:'HDFC Exclusive Offer — Extra 10% off',     subtitle:'Up to ₹1,500 on Domestic Flights. Valid on HDFC Credit & Debit Cards.', cta:'ACTIVATE'  },
  {after:8, type:'deals'},
  {after:13,type:'cashback', logo:'₹',    title:'Get up to 25% OFF* on Domestic Flights',   subtitle:'Use code MMTDOM25. Valid on VISA & Mastercard.',                         cta:'VIEW OFFER'},
  {after:18,type:'cashback', logo:'💳',   title:'Book & Win! ₹500 Cashback',                subtitle:'Limited time offer — Book any domestic flight today!',                   cta:'EXPLORE'   },
]

// ── City list for autocomplete ───────────────────────────────
const CITIES_LIST = [
  { city: 'New Delhi',    code: 'DEL', airport: 'Indira Gandhi Intl Airport' },
  { city: 'Bengaluru',    code: 'BLR', airport: 'Kempegowda Intl Airport' },
  { city: 'Mumbai',       code: 'BOM', airport: 'Chhatrapati Shivaji Maharaj Intl Airport' },
  { city: 'Chennai',      code: 'MAA', airport: 'Chennai Intl Airport' },
  { city: 'Kolkata',      code: 'CCU', airport: 'Netaji Subhash Chandra Bose Intl Airport' },
  { city: 'Hyderabad',    code: 'HYD', airport: 'Rajiv Gandhi Intl Airport' },
  { city: 'Pune',         code: 'PNQ', airport: 'Pune Airport' },
  { city: 'Ahmedabad',    code: 'AMD', airport: 'Sardar Vallabhbhai Patel Intl Airport' },
  { city: 'Goa',          code: 'GOI', airport: 'Dabolim Airport' },
  { city: 'Jaipur',       code: 'JAI', airport: 'Jaipur Intl Airport' },
  { city: 'Kochi',        code: 'COK', airport: 'Cochin Intl Airport' },
  { city: 'Lucknow',      code: 'LKO', airport: 'Chaudhary Charan Singh Intl Airport' },
  { city: 'Chandigarh',   code: 'IXC', airport: 'Chandigarh Intl Airport' },
  { city: 'Patna',        code: 'PAT', airport: 'Lok Nayak Jayaprakash Airport' },
  { city: 'Bhopal',       code: 'BHO', airport: 'Raja Bhoj Airport' },
  { city: 'Nagpur',       code: 'NAG', airport: 'Dr. Babasaheb Ambedkar Intl Airport' },
  { city: 'Indore',       code: 'IDR', airport: 'Devi Ahilya Bai Holkar Airport' },
  { city: 'Srinagar',     code: 'SXR', airport: 'Sheikh ul-Alam Intl Airport' },
  { city: 'Leh',          code: 'IXL', airport: 'Kushok Bakula Rimpochee Airport' },
  { city: 'Varanasi',     code: 'VNS', airport: 'Lal Bahadur Shastri Airport' },
]

// ─────────────────────────────────────────────────────────────
export default function SearchResultsPage() {
  const [params]  = useSearchParams()
  const navigate  = useNavigate()
  const [sortBy, setSortBy]             = useState('cheapest')
  const [filterStops, setFilterStops]   = useState([])
  const [filterAirlines, setFilterAirlines] = useState([])

  const [tripType,     setTripType]     = useState(params.get('type') || 'one-way')
  const [showTripDrop, setShowTripDrop] = useState(false)
  const [fromVal,      setFromVal]      = useState(params.get('from') || 'New Delhi')
  const [toVal,        setToVal]        = useState(params.get('to')   || 'Bengaluru')
  const [fromOpen,     setFromOpen]     = useState(false)
  const [toOpen,       setToOpen]       = useState(false)
  const [dateVal,      setDateVal]      = useState(params.get('date') || '')
  const [showCal,      setShowCal]      = useState(false)

  const fromRef = useRef(null)
  const toRef   = useRef(null)
  const tripRef = useRef(null)
  const calRef  = useRef(null)

  const { user, verifyOtpLogin } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [loginError, setLoginError] = useState('')

  const criteria = {
    from:        params.get('from')       || 'New Delhi',
    to:          params.get('to')         || 'Bengaluru',
    date:        params.get('date')       || null,
    passengers:  params.get('passengers') || '1',
    travelClass: params.get('class')      || 'Economy',
  }

  // Auto-sync search criteria for the booking details wizard
  useState(() => {
    try {
      const totalCount = parseInt(criteria.passengers, 10) || 1
      const savedTravellers = {
        adults: totalCount,
        children: 0,
        infants: 0,
        class: criteria.travelClass || 'Economy'
      }
      localStorage.setItem('travellers_flight', JSON.stringify(savedTravellers))
    } catch (e) {
      console.error(e)
    }
  })

  const handleSelectFlight = (flightId) => {
    if (!user) {
      alert("Please login to continue booking")
      setSelectedFlight(flightId)
      setShowLoginModal(true)
      return
    }
    navigate(`/booking/${flightId}`)
  }

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
      if (selectedFlight) {
        navigate(`/booking/${selectedFlight}`)
      }
    } catch (err) {
      setLoginError(err.message || 'Verification failed. Try 123456.')
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['flights', criteria],
    queryFn:  () => flightService.search(criteria),
    enabled:  !!(criteria.from && criteria.to),
  })

  const apiFlights   = data?.data || []
  const dummyFlights = useMemo(() => searchDummyFlights(criteria), [criteria.from, criteria.to])
  const allFlights   = apiFlights.length > 0 ? apiFlights : dummyFlights

  const allAirlines = useMemo(() => [...new Set(allFlights.map(f=>f.airline))], [allFlights])

  const filteredSorted = useMemo(() => {
    let r = [...allFlights]
    if (filterStops.length)    r = r.filter(f => filterStops.some(s => s===2 ? f.stops>=2 : f.stops===s))
    if (filterAirlines.length) r = r.filter(f => filterAirlines.includes(f.airline))
    switch (sortBy) {
      case 'cheapest': r.sort((a,b)=>a.price-b.price); break
      case 'fastest':  r.sort((a,b)=>a.duration-b.duration); break
      case 'earliest': r.sort((a,b)=>new Date(a.departure)-new Date(b.departure)); break
      case 'latest':   r.sort((a,b)=>new Date(b.departure)-new Date(a.departure)); break
    }
    return r
  }, [allFlights, filterStops, filterAirlines, sortBy])

  const toggleStop    = (s) => setFilterStops(p    => p.includes(s)?p.filter(x=>x!==s):[...p,s])
  const toggleAirline = (a) => setFilterAirlines(p => p.includes(a)?p.filter(x=>x!==a):[...p,a])
  const clearFilters  = ()  => { setFilterStops([]); setFilterAirlines([]) }

  useEffect(() => {
    function onOutside(e) {
      if (fromRef.current && !fromRef.current.contains(e.target)) setFromOpen(false)
      if (toRef.current   && !toRef.current.contains(e.target))   setToOpen(false)
      if (tripRef.current && !tripRef.current.contains(e.target)) setShowTripDrop(false)
      if (calRef.current  && !calRef.current.contains(e.target))  setShowCal(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const fromSugg = useMemo(() => {
    if (!fromVal.trim()) return CITIES_LIST.slice(0, 6)
    const q = fromVal.toLowerCase()
    return CITIES_LIST.filter(c =>
      c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [fromVal])

  const toSugg = useMemo(() => {
    if (!toVal.trim()) return CITIES_LIST.slice(0, 6)
    const q = toVal.toLowerCase()
    return CITIES_LIST.filter(c =>
      c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [toVal])

  function swapCities() {
    const tmp = fromVal; setFromVal(toVal); setToVal(tmp)
  }

  function handleNewSearch() {
    const p = new URLSearchParams()
    p.set('from',       fromVal)
    p.set('to',         toVal)
    p.set('type',       tripType)
    p.set('passengers', criteria.passengers)
    p.set('class',      criteria.travelClass)
    if (dateVal) p.set('date', dateVal)
    navigate({ search: p.toString() })
  }

  const sortMeta = useMemo(() => {
    if (!allFlights.length) return {}
    const cheapest = Math.min(...allFlights.map(f=>f.price))
    const fastest  = allFlights.reduce((a,b)=>a.duration<b.duration?a:b)
    const earliest = allFlights.reduce((a,b)=>new Date(a.departure)<new Date(b.departure)?a:b)
    const latest   = allFlights.reduce((a,b)=>new Date(a.departure)>new Date(b.departure)?a:b)
    return {
      cheapest: fmtPrice(cheapest),
      fastest:  fmtDuration(fastest.duration),
      earliest: fmtTime(earliest.departure),
      latest:   fmtTime(latest.departure),
    }
  }, [allFlights])

  if (isLoading) return <FlightLoader />

  const fromCode   = getCode(criteria.from)
  const toCode     = getCode(criteria.to)
  const hasFilters = filterStops.length > 0 || filterAirlines.length > 0

  return (
    <div className="fr-page">

      {/* Compact search bar */}
      <div className="fr-search-bar-wrapper">
        <div className="fr-search-inner">

          {/* ── Trip type dropdown ── */}
          <div className="fr-trip-type-wrapper" ref={tripRef}>
            <div className="fr-trip-type" onClick={() => setShowTripDrop(p => !p)}>
              {tripType === 'one-way' ? 'ONE WAY' : tripType === 'round-trip' ? 'ROUND TRIP' : 'MULTI CITY'}
              <span className="fr-trip-arrow">▼</span>
            </div>
            {showTripDrop && (
              <div className="fr-trip-dropdown">
                {[
                  { id: 'one-way',    label: 'One Way' },
                  { id: 'round-trip', label: 'Round Trip' },
                  { id: 'multi-city', label: 'Multi City' },
                ].map(t => (
                  <div
                    key={t.id}
                    className={`fr-trip-option${tripType === t.id ? ' fr-trip-option-active' : ''}`}
                    onClick={() => { setTripType(t.id); setShowTripDrop(false) }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── From city ── */}
          <div className="fr-search-field fr-city-field" ref={fromRef}>
            <span className="fr-search-label">From</span>
            <input
              className="fr-field-input"
              value={fromVal}
              onChange={e => { setFromVal(e.target.value); setFromOpen(true) }}
              onFocus={() => setFromOpen(true)}
              placeholder="City or Airport"
              autoComplete="off"
            />
            <span className="fr-search-sub">{getCode(fromVal)}, India</span>
            {fromOpen && fromSugg.length > 0 && (
              <div className="fr-city-dropdown">
                {fromSugg.map(c => (
                  <div
                    key={c.code}
                    className="fr-city-option"
                    onMouseDown={() => { setFromVal(c.city); setFromOpen(false) }}
                  >
                    <div className="fr-city-left">
                      <span className="fr-city-name">{c.city}</span>
                      <span className="fr-city-apt">{c.airport}</span>
                    </div>
                    <span className="fr-city-badge">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="fr-swap-btn" onClick={swapCities} aria-label="Swap cities">⇄</button>

          {/* ── To city ── */}
          <div className="fr-search-field fr-city-field" ref={toRef}>
            <span className="fr-search-label">To</span>
            <input
              className="fr-field-input"
              value={toVal}
              onChange={e => { setToVal(e.target.value); setToOpen(true) }}
              onFocus={() => setToOpen(true)}
              placeholder="City or Airport"
              autoComplete="off"
            />
            <span className="fr-search-sub">{getCode(toVal)}, India</span>
            {toOpen && toSugg.length > 0 && (
              <div className="fr-city-dropdown">
                {toSugg.map(c => (
                  <div
                    key={c.code}
                    className="fr-city-option"
                    onMouseDown={() => { setToVal(c.city); setToOpen(false) }}
                  >
                    <div className="fr-city-left">
                      <span className="fr-city-name">{c.city}</span>
                      <span className="fr-city-apt">{c.airport}</span>
                    </div>
                    <span className="fr-city-badge">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Departure date ── */}
          <div className="fr-search-field fr-date-field" ref={calRef} style={{ position: 'relative' }}
            onClick={() => setShowCal(p => !p)}>
            <span className="fr-search-label">Departure</span>
            <span className="fr-search-value">
              {dateVal ? (() => {
                const d = new Date(dateVal + 'T00:00:00')
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                return `${d.getDate()} ${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
              })() : 'Select Date'}
            </span>
            <span className="fr-search-sub">
              {dateVal ? new Date(dateVal + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' }) : 'Tap to pick'}
            </span>
            <CustomCalendarPicker
              isOpen={showCal}
              value={dateVal}
              onChange={v => { setDateVal(v); setShowCal(false) }}
              onClose={() => setShowCal(false)}
              labelText="Departure"
            />
          </div>

          {/* ── Travellers ── */}
          <div className="fr-search-field">
            <span className="fr-search-label">Travellers &amp; Class</span>
            <span className="fr-search-value">
              {criteria.passengers} Traveller{criteria.passengers > 1 ? 's' : ''}
            </span>
            <span className="fr-search-sub">{criteria.travelClass}</span>
          </div>

          <button className="fr-search-btn" onClick={handleNewSearch}>SEARCH</button>
        </div>
      </div>

      {/* Route heading (stays on dark-blue bar) */}
      <div className="fr-route-section">
        <div className="fr-route-inner">
          <h1 className="fr-route-title">Flights from {criteria.from} to {criteria.to}</h1>
          <p className="fr-route-meta">
            {criteria.passengers} Traveller(s) · {criteria.travelClass}
            {criteria.date && ` · ${fmtDate(criteria.date)}`}
          </p>
        </div>
      </div>

      {/* Sidebar + main */}
      <div className="fr-layout">

        {/* ── Sidebar ────────────────────────────────── */}
        <aside className="fr-sidebar" aria-label="Filters">

          {hasFilters && (
            <div className="fr-filter-section">
              <div className="fr-filter-title">
                Applied Filters
                <button className="fr-clear-all" onClick={clearFilters}>CLEAR ALL</button>
              </div>
              <div className="fr-applied-chips">
                {filterStops.map(s => (
                  <span key={s} className="fr-chip" onClick={() => toggleStop(s)}>
                    {s===0?'Non Stop':s===1?'1 Stop':'2+ Stops'}
                    <span className="fr-chip-x">×</span>
                  </span>
                ))}
                {filterAirlines.map(a => (
                  <span key={a} className="fr-chip" onClick={() => toggleAirline(a)}>
                    {a}<span className="fr-chip-x">×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="fr-filter-section">
            <div className="fr-filter-title">Popular Filters</div>
            <div className="fr-filter-body">
              {[{label:'Non Stop',value:0},{label:'1 Stop',value:1},{label:'2+ Stops',value:2}].map(({label,value})=>{
                const count = allFlights.filter(f=>value===2?f.stops>=2:f.stops===value).length
                if (!count) return null
                return (
                  <label key={value} className="fr-checkbox-item">
                    <input type="checkbox" checked={filterStops.includes(value)} onChange={()=>toggleStop(value)} />
                    <span className="fr-checkbox-label">{label}</span>
                    <span className="fr-checkbox-count">({count})</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="fr-filter-section">
            <div className="fr-filter-title">Travel Hacks</div>
            <div className="fr-travel-hacks">
              <div className="fr-hack-item">
                <span className="fr-hack-icon">✈</span>
                <div>
                  <div className="fr-hack-text">Try Nearby Airports</div>
                  <span className="fr-hack-badge">SAVE ₹2,000+</span>
                </div>
              </div>
              <div className="fr-hack-item">
                <span className="fr-hack-icon">📅</span>
                <div>
                  <div className="fr-hack-text">Flexible Dates</div>
                  <span className="fr-hack-badge">VIEW OPTIONS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-filter-section">
            <div className="fr-filter-title">Airlines</div>
            <div className="fr-filter-body">
              {allAirlines.map(airline => {
                const af       = allFlights.filter(f=>f.airline===airline)
                const minPrice = Math.min(...af.map(f=>f.price))
                const color    = AIRLINE_COLOR[airline] || 'var(--clr-text-secondary)'
                const code     = AIRLINE_CODE[airline]  || airline.slice(0,2).toUpperCase()
                return (
                  <label key={airline} className="fr-airline-filter-item">
                    <input type="checkbox" checked={filterAirlines.includes(airline)} onChange={()=>toggleAirline(airline)} />
                    <div className="fr-airline-mini-logo" style={{background:color}}>{code}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="fr-airline-filter-name">{airline}</div>
                      <div className="fr-airline-filter-price">{fmtPrice(minPrice)}</div>
                    </div>
                    <span className="fr-checkbox-count">({af.length})</span>
                  </label>
                )
              })}
            </div>
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────── */}
        <main className="fr-main">
          <div className="fr-results-header">
            <span className="fr-results-count">
              Showing <strong>{filteredSorted.length}</strong> of {allFlights.length} flights
            </span>
          </div>

          {/* Sort tabs */}
          <div className="fr-sort-bar" role="tablist">
            {[
              {key:'cheapest',label:'Cheapest'},
              {key:'fastest', label:'Fastest'},
              {key:'earliest',label:'Earliest'},
              {key:'latest',  label:'Latest'},
            ].map(({key,label}) => (
              <button
                key={key}
                role="tab"
                aria-selected={sortBy===key}
                className={`fr-sort-tab${sortBy===key?' active':''}`}
                onClick={() => setSortBy(key)}
              >
                <span>{label}</span>
                {sortMeta[key] && <span className="fr-sort-value">{sortMeta[key]}</span>}
              </button>
            ))}
          </div>

          {/* Flight cards */}
          <div className="fr-flights-list">
            {filteredSorted.length === 0 ? (
              <div className="fr-no-flights">
                No flights match your current filters.
                <br />
                <button onClick={clearFilters}>Clear All Filters</button>
              </div>
            ) : filteredSorted.map((flight, idx) => {
              const color = AIRLINE_COLOR[flight.airline] || 'var(--clr-text-secondary)'
              const code  = AIRLINE_CODE[flight.airline]  || flight.airline.slice(0,2).toUpperCase()
              const promo = PROMOS.find(p => p.after === idx)
              return (
                <div key={flight.id}>
                  {promo && <PromoBanner banner={promo} />}
                  <div
                    className="fc-card"
                    onClick={() => handleSelectFlight(flight.id)}
                  >
                    <div className="fc-main-row">
                      {/* Airline */}
                      <div className="fc-airline-col">
                        <div className="fc-logo-box" style={{background:color}}>{code}</div>
                        <div>
                          <div className="fc-airline-name">{flight.airline}</div>
                          <div className="fc-flight-num">
                            {flight.flightNumber}
                            {flight.isLive && (
                              <span className="fc-live-pulse-badge" title="Real-time flight data sourced from OpenSky Network">
                                <span className="fc-pulse-dot" /> LIVE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Route & times */}
                      <div className="fc-times-col">
                        <div className="fc-time-block">
                          <span className="fc-time">{fmtTime(flight.departure)}</span>
                          <span className="fc-city-code">{fromCode}</span>
                        </div>
                        <div className="fc-route-info">
                          <span className="fc-duration">{fmtDuration(flight.duration)}</span>
                          <div className="fc-line-wrap">
                            <div className="fc-dot" />
                            <div className="fc-line" />
                            <span className="fc-plane-icon" aria-hidden>✈</span>
                            <div className="fc-line" />
                            <div className="fc-dot" />
                          </div>
                          <span className={`fc-stops-badge ${flight.stops===0?'stops-nonstop':flight.stops===1?'stops-one':'stops-two'}`}>
                            {flight.stops===0?'Non stop':`${flight.stops} Stop${flight.stops>1?'s':''}`}
                          </span>
                        </div>
                        <div className="fc-time-block">
                          <span className="fc-time">{fmtTime(flight.arrival)}</span>
                          <span className="fc-city-code">{toCode}</span>
                        </div>
                      </div>

                      {flight.seats <= 9 && (
                        <div className="fc-seats-col">
                          <span className="fc-seats-text">{flight.seats} Seats<br />left!</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="fc-price-col">
                        <span className="fc-per-adult">Per Adult</span>
                        <span className="fc-price">{fmtPrice(flight.price)}</span>
                        <button
                          className="fc-view-btn"
                          onClick={e => { e.stopPropagation(); handleSelectFlight(flight.id) }}
                        >
                          View Prices
                        </button>
                      </div>
                    </div>

                    <div className="fc-footer-row">
                      <span className={`fc-tag ${flight.refundable?'fc-tag-refund':'fc-tag-nonrefund'}`}>
                        {flight.refundable?'✓ Refundable':'✗ Non-Refundable'}
                      </span>
                      <span className="fc-tag fc-tag-baggage">{flight.baggage||'15 Kg'}</span>
                      <span className="fc-tag fc-tag-class">{flight.class||'Economy'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>

      {showLoginModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '420px',
            padding: '32px 28px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f3f4f6',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔐</span>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: '#111827' }}>
                Login to Continue
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                MakeMyTrip requires verification before booking. Enter your mobile number to instantly login.
              </p>
            </div>

            {loginError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center', fontWeight: 600 }}>
                {loginError}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    MOBILE NUMBER
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 700, color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{ width: '100%', background: 'var(--clr-primary, #ef4444)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                >
                  GET ONE TIME PASSWORD (OTP)
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                      ENTER 6-DIGIT OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--clr-primary, #ef4444)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ width: '100%', border: '2px solid var(--clr-primary, #ef4444)', borderRadius: '8px', padding: '12px 14px', fontSize: '18px', fontWeight: 800, letterSpacing: '4px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                    autoFocus
                    required
                  />
                  <span style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: '#10b981', marginTop: '8px', fontWeight: 600 }}>
                    ✓ Simulated OTP sent! (Use test OTP: 123456)
                  </span>
                </div>
                <button
                  type="submit"
                  style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  VERIFY &amp; RESUME BOOKING
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PromoBanner({ banner }) {
  if (banner.type === 'deals') {
    return (
      <div className="fr-hot-deals-wrapper">
        <div className="fr-hot-deals-top">
          <span className="fr-hot-deals-icon" aria-hidden>🔥</span>
          <span className="fr-hot-deals-title">Hot Deals</span>
          <span className="fr-hot-deals-sub">Use these codes for extra savings</span>
        </div>
        <div className="fr-coupons-row">
          {['FLYNOW','SAVE15','INDIGO20','MMTFLASH','HDFC500','NEWUSER'].map(c => (
            <div key={c} className="fr-coupon">{c}</div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="fr-promo-wrapper">
      <div className={`fr-promo-banner ${banner.type==='hdfc'?'fr-promo-hdfc':'fr-promo-cashback'}`}>
        <div className="fr-promo-logo">{banner.logo}</div>
        <div className="fr-promo-content">
          <p className="fr-promo-title">{banner.title}</p>
          <p className="fr-promo-subtitle">{banner.subtitle}</p>
        </div>
        <button className="fr-promo-action">{banner.cta}</button>
      </div>
    </div>
  )
}
