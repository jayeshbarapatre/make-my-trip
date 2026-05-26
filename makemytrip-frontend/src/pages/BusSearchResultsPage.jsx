import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { busService } from '../services/busService'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import { CITIES } from '../data/cities'
import '../styles/TrainResults.css' // Reuse train results styling for consistency

const fmtTime = (val) => {
  if (!val) return 'N/A'
  if (typeof val === 'object' && val.time) return val.time
  if (typeof val === 'string' && val.match(/^\d{1,2}:\d{2}/)) return val
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fmtDuration = (m) => {
  if (!m) return 'N/A'
  if (typeof m === 'string') return m
  const hours = Math.floor(m / 60)
  const mins = m % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

const fmtPrice = (p) => '₹' + Number(p).toLocaleString('en-IN')

const fmtDate = (s) => {
  if (!s) return ''
  const [year, month, day] = s.split('-')
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })
}

const fmtDateDisplay = (dateStr) => {
  if (!dateStr) return { formatted: 'Select Date', weekday: 'Tap to pick' }
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return { formatted: 'Invalid Date', weekday: '' }
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  if (isNaN(d.getTime())) return { formatted: 'Invalid Date', weekday: '' }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const formatted = `${d.getDate()} ${months[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long' })
  return { formatted, weekday }
}

const getCode = (city = '') => {
  const IATA = {
    'new delhi': 'DEL', 'delhi': 'DEL', 'bengaluru': 'BLR', 'bangalore': 'BLR',
    'mumbai': 'BOM', 'chennai': 'MAA', 'hyderabad': 'HYD', 'kolkata': 'CCU',
    'goa': 'GOI', 'pune': 'PNQ', 'ahmedabad': 'AMD', 'jaipur': 'JAI',
  }
  return IATA[city.toLowerCase().trim()] || city.slice(0, 3).toUpperCase()
}

export default function BusSearchResultsPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [sortBy, setSortBy] = useState('cheapest')
  const [filterBusTypes, setFilterBusTypes] = useState([])
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 5000 })
  const [filterDepartureWindow, setFilterDepartureWindow] = useState([])

  const [fromVal, setFromVal] = useState(location.state?.fromCity || params.get('from') || 'Chennai')
  const [toVal, setToVal] = useState(location.state?.toCity || params.get('to') || 'Bengaluru')
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const [dateVal, setDateVal] = useState(() => {
    if (location.state?.travelDate) return location.state.travelDate
    const fromUrl = params.get('date')
    if (fromUrl) return fromUrl
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.toISOString().split('T')[0]
  })
  const [showCal, setShowCal] = useState(false)
  const [passengers, setPassengers] = useState(parseInt(params.get('passengers') || '1', 10))
  const [showTravDrop, setShowTravDrop] = useState(false)

  const fromRef = useRef(null)
  const toRef = useRef(null)
  const calRef = useRef(null)
  const travRef = useRef(null)

  const { user, verifyOtpLogin } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [showCustomAlert, setShowCustomAlert] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  const criteria = {
    from: fromVal,
    to: toVal,
    date: dateVal,
    passengers: passengers,
  }

  useEffect(() => {
    try {
      const totalCount = parseInt(criteria.passengers, 10) || 1
      const savedTravellers = { count: totalCount }
      localStorage.setItem('travellers_bus', JSON.stringify(savedTravellers))
    } catch (e) {
      console.error(e)
    }
  }, [criteria.passengers])

  const handleSelectBus = (bus) => {
    if (!user) {
      setAlertMsg("Please login to continue booking")
      setShowCustomAlert(true)
      setSelectedBus(bus)
      return
    }
    navigate(`/buses/booking/${bus.id}`, { state: { bus, searchDate: criteria.date } })
  }

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
      if (selectedBus) {
        navigate(`/buses/booking/${selectedBus.id}`, { state: { bus: selectedBus } })
      }
    } catch (err) {
      setLoginError(err.message || 'Verification failed. Try 123456.')
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['buses', criteria.from, criteria.to, criteria.date],
    queryFn: () => {
      return busService.search({
        from: criteria.from,
        to: criteria.to,
        date: criteria.date
      })
    },
  })

  // data.data is the API response body. The actual buses array is in data.data.data
  let apiBuses = data?.data?.data || []
  if (!Array.isArray(apiBuses)) {
    apiBuses = []
  }
  
  if (apiBuses.length === 0) {
    // Inject predefined fallback buses if none from API
    apiBuses = [
      {
        id: 'b1',
        operator: 'SRS Travels',
        type: 'AC Sleeper (2+1)',
        departureTime: '21:30',
        arrivalTime: '06:00',
        durationMinutes: 510,
        price: 1250,
        seatsAvailable: 15,
        amenities: ['Water Bottle', 'Blanket', 'Charging Point'],
        departure: { city: criteria.from || 'Chennai' },
        arrival: { city: criteria.to || 'Bengaluru' },
        from: criteria.from || 'Chennai',
        to: criteria.to || 'Bengaluru'
      },
      {
        id: 'b2',
        operator: 'VRL Travels',
        type: 'Volvo Multi-Axle I-Shift A/C Semi Sleeper',
        departureTime: '22:45',
        arrivalTime: '05:30',
        durationMinutes: 405,
        price: 950,
        seatsAvailable: 4,
        amenities: ['Reading Light', 'Charging Point'],
        departure: { city: criteria.from || 'Chennai' },
        arrival: { city: criteria.to || 'Bengaluru' },
        from: criteria.from || 'Chennai',
        to: criteria.to || 'Bengaluru'
      },
      {
        id: 'b3',
        operator: 'KSRTC (Airavat)',
        type: 'AC',
        departureTime: '10:00',
        arrivalTime: '17:30',
        durationMinutes: 450,
        price: 780,
        seatsAvailable: 32,
        amenities: ['Live Tracking', 'Water Bottle'],
        departure: { city: criteria.from || 'Chennai' },
        arrival: { city: criteria.to || 'Bengaluru' },
        from: criteria.from || 'Chennai',
        to: criteria.to || 'Bengaluru'
      }
    ]
  }

  const parsedBuses = apiBuses.map(b => {
    try {
      return {
        ...b,
        departure: typeof b.departure === 'string' ? JSON.parse(b.departure) : b.departure,
        arrival: typeof b.arrival === 'string' ? JSON.parse(b.arrival) : b.arrival,
        amenities: b.amenities || [],
      }
    } catch (e) {
      console.error('Error parsing bus:', b, e)
      return b
    }
  })

  const allBuses = parsedBuses.filter(b => {
    const fromCityStr = (b?.departure?.city || b?.from || '').toLowerCase()
    const toCityStr = (b?.arrival?.city || b?.to || '').toLowerCase()
    return fromCityStr.includes((criteria.from || '').toLowerCase()) && 
           toCityStr.includes((criteria.to || '').toLowerCase())
  }).length > 0 ?
    parsedBuses.filter(b => {
      const fromCityStr = (b?.departure?.city || b?.from || '').toLowerCase()
      const toCityStr = (b?.arrival?.city || b?.to || '').toLowerCase()
      return fromCityStr.includes((criteria.from || '').toLowerCase()) && 
             toCityStr.includes((criteria.to || '').toLowerCase())
    }) :
    parsedBuses

  const filteredSorted = useMemo(() => {
    let r = [...allBuses]

    if (filterBusTypes.length) {
      r = r.filter(b => filterBusTypes.includes(b.type || 'AC'))
    }

    if (filterPriceRange.min > 0 || filterPriceRange.max < 5000) {
      r = r.filter(b => b.price >= filterPriceRange.min && b.price <= filterPriceRange.max)
    }

    if (filterDepartureWindow.length) {
      r = r.filter(b => {
        const depHour = parseInt((b.departureTime || '00:00').split(':')[0])
        return filterDepartureWindow.some(window => {
          if (window === '6am-12pm') return depHour >= 6 && depHour < 12
          if (window === '12pm-6pm') return depHour >= 12 && depHour < 18
          if (window === '6pm-12am') return depHour >= 18 && depHour < 24
          if (window === '12am-6am') return depHour >= 0 && depHour < 6
          return false
        })
      })
    }

    switch (sortBy) {
      case 'cheapest':
        r.sort((a, b) => a.price - b.price)
        break
      case 'earliest':
        r.sort((a, b) => {
          const aTime = parseInt((a.departureTime || '00:00').split(':')[0])
          const bTime = parseInt((b.departureTime || '00:00').split(':')[0])
          return aTime - bTime
        })
        break
      case 'latest':
        r.sort((a, b) => {
          const aTime = parseInt((a.departureTime || '00:00').split(':')[0])
          const bTime = parseInt((b.departureTime || '00:00').split(':')[0])
          return bTime - aTime
        })
        break
      case 'duration':
        r.sort((a, b) => (a.durationMinutes || 0) - (b.durationMinutes || 0))
        break
      default:
        break
    }
    return r
  }, [allBuses, filterBusTypes, filterPriceRange, filterDepartureWindow, sortBy])

  const toggleBusType = (type) => {
    setFilterBusTypes(p => p.includes(type) ? p.filter(x => x !== type) : [...p, type])
  }

  const toggleDepartureWindow = (window) => {
    setFilterDepartureWindow(p => p.includes(window) ? p.filter(x => x !== window) : [...p, window])
  }

  const clearFilters = () => {
    setFilterBusTypes([])
    setFilterPriceRange({ min: 0, max: 5000 })
    setFilterDepartureWindow([])
  }

  useEffect(() => {
    function onOutside(e) {
      if (fromRef.current && !fromRef.current.contains(e.target)) setFromOpen(false)
      if (toRef.current && !toRef.current.contains(e.target)) setToOpen(false)
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false)
      if (travRef.current && !travRef.current.contains(e.target)) setShowTravDrop(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const fromSugg = useMemo(() => {
    if (!fromVal.trim()) return CITIES.slice(0, 6)
    const q = fromVal.toLowerCase()
    return CITIES.filter(c =>
      c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [fromVal])

  const toSugg = useMemo(() => {
    if (!toVal.trim()) return CITIES.slice(0, 6)
    const q = toVal.toLowerCase()
    return CITIES.filter(c =>
      c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [toVal])

  function swapCities() {
    const tmp = fromVal
    setFromVal(toVal)
    setToVal(tmp)
  }

  function handleNewSearch() {
    const p = new URLSearchParams()
    p.set('from', fromVal)
    p.set('to', toVal)
    p.set('passengers', String(passengers))
    if (dateVal) p.set('date', dateVal)
    navigate({ search: p.toString() })
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="flex items-center justify-center gap-4">
          <i className="fas fa-spinner fa-spin text-xl"></i>
          <span>Loading buses...</span>
        </div>
      </div>
    )
  }

  const fromCode = getCode(criteria.from)
  const toCode = getCode(criteria.to)
  const hasFilters = filterBusTypes.length > 0 || filterDepartureWindow.length > 0

  return (
    <div className="tr-page">
      {/* Route Section */}
      <div className="tr-route-section">
        <div className="tr-route-inner">
          <h1 className="tr-route-title">Buses from {criteria.from} to {criteria.to}</h1>
          <p className="tr-route-meta">
            {criteria.passengers} Passenger(s)
            {criteria.date && ` · ${fmtDate(criteria.date)}`}
          </p>
        </div>
      </div>

      <div className="tr-search-bar-wrapper">
        <div className="tr-search-inner">
          <div className="tr-search-field" ref={fromRef}>
            <span className="tr-search-label">From</span>
            <input
              className="tr-field-input"
              value={fromVal}
              onChange={e => { setFromVal(e.target.value); setFromOpen(true) }}
              onFocus={() => setFromOpen(true)}
              placeholder="City"
              autoComplete="off"
            />
            <span className="tr-search-sub">{getCode(fromVal)}</span>
            {fromOpen && fromSugg.length > 0 && (
              <div className="tr-city-dropdown">
                {fromSugg.map(c => (
                  <div
                    key={c.code}
                    className="tr-city-option"
                    onMouseDown={() => { setFromVal(c.city); setFromOpen(false) }}
                  >
                    <span className="tr-city-name">{c.city}</span>
                    <span className="tr-city-badge">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="tr-swap-btn" onClick={swapCities}>⇄</button>

          <div className="tr-search-field" ref={toRef}>
            <span className="tr-search-label">To</span>
            <input
              className="tr-field-input"
              value={toVal}
              onChange={e => { setToVal(e.target.value); setToOpen(true) }}
              onFocus={() => setToOpen(true)}
              placeholder="City"
              autoComplete="off"
            />
            <span className="tr-search-sub">{getCode(toVal)}</span>
            {toOpen && toSugg.length > 0 && (
              <div className="tr-city-dropdown">
                {toSugg.map(c => (
                  <div
                    key={c.code}
                    className="tr-city-option"
                    onMouseDown={() => { setToVal(c.city); setToOpen(false) }}
                  >
                    <span className="tr-city-name">{c.city}</span>
                    <span className="tr-city-badge">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tr-search-field" ref={calRef} onClick={() => setShowCal(p => !p)}>
            <span className="tr-search-label">Date</span>
            <span className="tr-search-value">{fmtDateDisplay(dateVal).formatted}</span>
            <span className="tr-search-sub">{fmtDateDisplay(dateVal).weekday}</span>
            <CustomCalendarPicker
              isOpen={showCal}
              value={dateVal}
              onChange={v => { setDateVal(v); setShowCal(false) }}
              onClose={() => setShowCal(false)}
              labelText="Travel Date"
            />
          </div>

          <div className="tr-search-field" ref={travRef} onClick={() => setShowTravDrop(p => !p)}>
            <span className="tr-search-label">Passengers</span>
            <span className="tr-search-value">{passengers}</span>
            <span className="tr-search-sub">Passenger{passengers > 1 ? 's' : ''}</span>
            {showTravDrop && (
              <div className="tr-trip-dropdown" onMouseDown={e => e.stopPropagation()}>
                <div style={{ padding: '10px 16px 6px', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Passengers</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px 12px' }}>
                  <button className="tr-swap-btn" style={{border: '1px solid #ccc', borderRadius: '4px'}} onClick={e => { e.stopPropagation(); setPassengers(p => Math.max(1, p - 1)) }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: 'center' }}>{passengers}</span>
                  <button className="tr-swap-btn" style={{border: '1px solid #ccc', borderRadius: '4px'}} onClick={e => { e.stopPropagation(); setPassengers(p => Math.min(50, p + 1)) }}>+</button>
                </div>
              </div>
            )}
          </div>

          <button className="tr-search-btn" onClick={handleNewSearch}>SEARCH</button>
        </div>
      </div>


      <div className="tr-layout">
        <aside className="tr-sidebar">
          {hasFilters && (
            <div className="tr-filter-section">
              <div className="tr-filter-title">
                Applied Filters
                <button className="tr-clear-all" onClick={clearFilters}>CLEAR ALL</button>
              </div>
              <div className="tr-applied-chips">
                {filterBusTypes.map(t => (
                  <span key={t} className="tr-chip" onClick={() => toggleBusType(t)}>
                    {t}<span className="tr-chip-x">×</span>
                  </span>
                ))}
                {filterDepartureWindow.map(w => (
                  <span key={w} className="tr-chip" onClick={() => toggleDepartureWindow(w)}>
                    {w}<span className="tr-chip-x">×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="tr-filter-section">
            <div className="tr-filter-title">Bus Type</div>
            <div className="tr-filter-body">
              {['AC', 'Non-AC', 'Sleeper', 'Luxury'].map(type => {
                const count = allBuses.filter(b => (b.type || 'AC') === type).length
                if (!count) return null
                return (
                  <label key={type} className="tr-checkbox-item">
                    <input type="checkbox" checked={filterBusTypes.includes(type)} onChange={() => toggleBusType(type)} />
                    <span className="tr-checkbox-label">{type}</span>
                    <span className="tr-checkbox-count">({count})</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="tr-filter-section">
            <div className="tr-filter-title">Departure Window</div>
            <div className="tr-filter-body">
              {['6am-12pm', '12pm-6pm', '6pm-12am', '12am-6am'].map(window => {
                const count = allBuses.filter(b => {
                  const hour = parseInt((b.departureTime || '00:00').split(':')[0])
                  if (window === '6am-12pm') return hour >= 6 && hour < 12
                  if (window === '12pm-6pm') return hour >= 12 && hour < 18
                  if (window === '6pm-12am') return hour >= 18 && hour < 24
                  if (window === '12am-6am') return hour >= 0 && hour < 6
                  return false
                }).length
                if (!count) return null
                return (
                  <label key={window} className="tr-checkbox-item">
                    <input type="checkbox" checked={filterDepartureWindow.includes(window)} onChange={() => toggleDepartureWindow(window)} />
                    <span className="tr-checkbox-label">{window}</span>
                    <span className="tr-checkbox-count">({count})</span>
                  </label>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="tr-main">
          <div className="tr-results-header">
            <span className="tr-results-count">
              Showing <strong>{filteredSorted.length}</strong> of {allBuses.length} buses
            </span>
          </div>

          <div className="tr-sort-bar">
            {[
              { key: 'cheapest', label: 'Cheapest' },
              { key: 'earliest', label: 'Earliest' },
              { key: 'latest', label: 'Latest' },
              { key: 'duration', label: 'Duration' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`tr-sort-tab${sortBy === key ? ' active' : ''}`}
                onClick={() => setSortBy(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="tr-trains-list">
            {filteredSorted.length === 0 ? (
              <div className="tr-no-trains">
                No buses match your current filters.
                <br />
                <button onClick={clearFilters} style={{ background: 'hsl(var(--p))', color: 'hsl(var(--pc))', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Clear All Filters</button>
              </div>
            ) : filteredSorted.map((bus) => (
              <div key={bus.id} className="tc-card" onClick={() => handleSelectBus(bus)}>
                <div className="tc-main-row">
                  <div className="tc-train-col">
                    <div className="tc-icon-box">🚌</div>
                    <div>
                      <div className="tc-train-name">{bus.operator}</div>
                      <div className="tc-train-num">{bus.type || 'AC'}</div>
                    </div>
                  </div>

                  <div className="tc-times-col">
                    <div className="tc-time-block">
                      <span className="tc-time">{fmtTime(bus.departureTime)}</span>
                      <span className="tc-station-code">{bus.from}</span>
                    </div>
                    <div className="tc-route-info">
                      <span className="tc-duration">{fmtDuration(bus.durationMinutes)}</span>
                      <div className="tc-line-wrap">
                        <div className="tc-dot" />
                        <div className="tc-line" />
                        <div className="tc-dot" />
                      </div>
                      <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>Direct</span>
                    </div>
                    <div className="tc-time-block">
                      <span className="tc-time">{fmtTime(bus.arrivalTime)}</span>
                      <span className="tc-station-code">{bus.to}</span>
                    </div>
                  </div>
                </div>

                <div className="tc-action-row">
                  <div className="tc-action-info">
                    {bus.seatsAvailable && bus.seatsAvailable <= 10 ? <strong style={{color: 'hsl(var(--wa))'}}>{bus.seatsAvailable} Seats left!</strong> : <strong>{bus.seatsAvailable || 30} Seats available</strong>}
                    <br />
                    <span style={{fontSize: '18px', fontWeight: 'bold', color: 'hsl(var(--p))', marginTop: '8px', display: 'inline-block'}}>{fmtPrice(bus.price)}</span>
                  </div>
                  <button className="tc-book-btn" onClick={(e) => { e.stopPropagation(); handleSelectBus(bus) }}>
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {showLoginModal && (
        <div className="custom-modal-overlay">
          <div className="custom-login-card">
            <button className="custom-modal-close" onClick={() => setShowLoginModal(false)}>✕</button>

            <div className="custom-login-header">
              <span className="custom-login-icon">🔐</span>
              <h3>Login to Continue</h3>
              <p>Enter your mobile number to instantly login.</p>
            </div>

            {loginError && <div className="custom-login-error">{loginError}</div>}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="custom-input-group">
                  <label>MOBILE NUMBER</label>
                  <div className="custom-phone-input">
                    <span className="custom-country-code">+91</span>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobilePhone}
                      maxLength={10}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="custom-login-btn">GET OTP</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div className="custom-input-group">
                  <div className="custom-otp-header">
                    <label>ENTER 6-DIGIT OTP</label>
                    <button type="button" onClick={() => setOtpSent(false)}>Change Number</button>
                  </div>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="custom-otp-input"
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" className="custom-verify-btn">VERIFY & RESUME BOOKING</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showCustomAlert && (
        <div className="custom-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="custom-alert-card">
            <div className="custom-alert-icon">⚠️</div>
            <h3 className="custom-alert-title">Authentication Required</h3>
            <p className="custom-alert-msg">{alertMsg}</p>
            <div className="custom-alert-actions">
              <button
                className="custom-alert-btn-cancel"
                onClick={() => setShowCustomAlert(false)}
              >
                CANCEL
              </button>
              <button
                className="custom-alert-btn-confirm"
                onClick={() => {
                  setShowCustomAlert(false)
                  setShowLoginModal(true)
                }}
              >
                LOGIN NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
