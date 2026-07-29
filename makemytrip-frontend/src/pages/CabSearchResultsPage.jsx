import { useState, useRef, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import { CITIES } from '../data/cities'
import '../styles/TrainResults.css' // We use train results styles for consistency
import { photo } from '../utils/images'

export default function CabSearchResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [fromVal, setFromVal] = useState(location.state?.fromCity || 'New Delhi')
  const [toVal, setToVal] = useState(location.state?.toCity || 'Jaipur')
  const [dateVal, setDateVal] = useState(() => {
    return location.state?.departDate || new Date().toISOString().split('T')[0]
  })

  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const [showCal, setShowCal] = useState(false)

  const fromRef = useRef(null)
  const toRef = useRef(null)
  const calRef = useRef(null)

  useEffect(() => {
    function onOutside(e) {
      if (fromRef.current && !fromRef.current.contains(e.target)) setFromOpen(false)
      if (toRef.current && !toRef.current.contains(e.target)) setToOpen(false)
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const fromSugg = useMemo(() => {
    if (!fromVal.trim()) return CITIES.slice(0, 6)
    const q = fromVal.toLowerCase()
    return CITIES.filter(c => c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 6)
  }, [fromVal])

  const toSugg = useMemo(() => {
    if (!toVal.trim()) return CITIES.slice(0, 6)
    const q = toVal.toLowerCase()
    return CITIES.filter(c => c.city.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 6)
  }, [toVal])

  function swapCities() {
    const tmp = fromVal
    setFromVal(toVal)
    setToVal(tmp)
  }

  function handleNewSearch() {
    // Navigate to update URL or just refetch. Since we don't have a backend, we just update state.
    setFromOpen(false)
    setToOpen(false)
  }

  const [_showLoginModal, _setShowLoginModal] = useState(false)
  const [showCustomAlert, setShowCustomAlert] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')


  const CARS = [
    {
      id: 'c1',
      name: 'Dzire, Etios',
      type: 'Sedan · AC · 4 Seats',
      desc: 'Spacious boot, comfortable ride',
      price: '2,850',
      oldPrice: '3,400',
      rating: '4.8 (140 ratings)',
      icon: '🚗',
      img: photo('cab-sedan')
    },
    {
      id: 'c2',
      name: 'Ertiga, Lodgy',
      type: 'SUV · AC · 6 Seats',
      desc: 'Perfect for group travel & extra luggage',
      price: '4,150',
      oldPrice: '4,900',
      rating: '4.9 (210 ratings)',
      icon: '🚙',
      img: photo('cab-suv-2')
    },
    {
      id: 'c3',
      name: 'Innova Crysta',
      type: 'Premium SUV · AC · 6 Seats',
      desc: 'Top-tier luxury and comfort',
      price: '5,800',
      oldPrice: '6,600',
      rating: '4.95 (380 ratings)',
      icon: '👑',
      img: photo('cab-interior')
    }
  ]

  const handleSelectCab = (car) => {
    if (!user) {
      setAlertMsg("Please login to continue booking")
      setShowCustomAlert(true)
      return
    }
    // Navigate to payment page with cab details
    navigate('/cab/payment', {
      state: {
        cab: {
          id: car.id,
          type: car.name,
          model: car.type,
          rating: car.rating,
          price: parseInt(car.price.replace(/,/g, ''))
        },
        pickupLocation: fromVal,
        dropLocation: toVal,
        distance: '25 km',
        estimatedTime: '45 mins',
        totalAmount: parseInt(car.price.replace(/,/g, '')) + 117,
        baseFare: parseInt(car.price.replace(/,/g, ''))
      }
    })
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

  const fmtDate = (s) => {
    if (!s) return ''
    const [year, month, day] = s.split('-')
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })
  }

  const getCode = (city = '') => {
    const IATA = {
      'new delhi': 'DEL', 'delhi': 'DEL', 'bengaluru': 'BLR', 'bangalore': 'BLR',
      'mumbai': 'BOM', 'chennai': 'MAA', 'hyderabad': 'HYD', 'kolkata': 'CCU',
      'goa': 'GOI', 'pune': 'PNQ', 'ahmedabad': 'AMD', 'jaipur': 'JAI',
    }
    return IATA[city.toLowerCase().trim()] || city.slice(0, 3).toUpperCase()
  }

  const [filterCabTypes, setFilterCabTypes] = useState([])
  const [sortBy, setSortBy] = useState('cheapest')

  const toggleCabType = (type) => {
    setFilterCabTypes(p => p.includes(type) ? p.filter(x => x !== type) : [...p, type])
  }

  const clearFilters = () => {
    setFilterCabTypes([])
  }

  const filteredSortedCabs = useMemo(() => {
    let r = [...CARS]
    if (filterCabTypes.length > 0) {
      r = r.filter(c => filterCabTypes.some(ft => c.type.includes(ft)))
    }
    if (sortBy === 'cheapest') {
      r.sort((a, b) => parseInt(a.price.replace(',', '')) - parseInt(b.price.replace(',', '')))
    } else if (sortBy === 'highest_rated') {
      r.sort((a, b) => parseFloat(b.rating.split(' ')[0]) - parseFloat(a.rating.split(' ')[0]))
    }
    return r
  }, [CARS, filterCabTypes, sortBy])

  const hasFilters = filterCabTypes.length > 0

  return (
    <div className="tr-page">
      <div className="tr-route-section">
        <div className="tr-route-inner">
          <h1 className="tr-route-title">Cabs from {fromVal} to {toVal}</h1>
          <p className="tr-route-meta">
            Outstation One-Way · {fmtDate(dateVal)}
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
                {filterCabTypes.map(t => (
                  <span key={t} className="tr-chip" onClick={() => toggleCabType(t)}>
                    {t}<span className="tr-chip-x">×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="tr-filter-section">
            <div className="tr-filter-title">Cab Type</div>
            <div className="tr-filter-body">
              {['Sedan', 'SUV', 'Premium SUV'].map(type => {
                const count = CARS.filter(c => c.type.includes(type)).length
                if (!count) return null
                return (
                  <label key={type} className="tr-checkbox-item">
                    <input type="checkbox" checked={filterCabTypes.includes(type)} onChange={() => toggleCabType(type)} />
                    <span className="tr-checkbox-label">{type}</span>
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
              Showing <strong>{filteredSortedCabs.length}</strong> of {CARS.length} cabs
            </span>
          </div>

          <div className="tr-sort-bar">
            {[
              { key: 'cheapest', label: 'Cheapest' },
              { key: 'highest_rated', label: 'Highest Rated' },
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
            {filteredSortedCabs.length === 0 ? (
              <div className="tr-no-trains">
                No cabs match your filters.
                <br />
                <button onClick={clearFilters} style={{ background: 'hsl(var(--p))', color: 'hsl(var(--pc))', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Clear All Filters</button>
              </div>
            ) : filteredSortedCabs.map((car) => (
              <div key={car.id} className="tc-card tc-cab-card" onClick={() => handleSelectCab(car)}>
                <div className="tc-cab-img">
                  <img src={car.img} alt={car.name} loading="lazy" decoding="async" onError={(e) => { e.target.src = photo('cab-sedan') }} />
                </div>
                <div className="tc-cab-main-row">
                  <div className="tc-train-col" style={{ flex: 1, width: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{car.icon}</span>
                      <h3 className="tc-train-name" style={{ fontSize: '18px', margin: 0 }}>{car.name}</h3>
                    </div>
                    <span className="tc-train-num" style={{ marginTop: '8px', display: 'block' }}>{car.type}</span>
                    <span style={{ color: 'hsl(var(--su))', fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>{car.desc}</span>
                    <span style={{ fontSize: '12px', color: 'hsl(var(--bc)/0.7)', display: 'block', marginTop: '4px' }}>★ {car.rating}</span>
                  </div>

                  <div className="tc-times-col">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <span style={{ textDecoration: 'line-through', color: 'hsl(var(--er))', fontSize: '14px' }}>₹{car.oldPrice}</span>
                      <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'hsl(var(--p))', lineHeight: 1 }}>₹{car.price}</span>
                      <small style={{ color: 'hsl(var(--bc)/0.6)', marginTop: '4px' }}>Free cancellation</small>
                    </div>
                    <button className="tc-book-btn" onClick={(e) => { e.stopPropagation(); handleSelectCab(car) }}>
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

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
                  navigate('/login')
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
