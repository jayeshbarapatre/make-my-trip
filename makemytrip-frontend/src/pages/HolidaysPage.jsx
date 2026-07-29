import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import { useWeather } from '../hooks/useWeather'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'
import { photo } from '../utils/images'

export default function HolidaysPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('holidays')
  const [activeChip, setActiveChip] = useState('India')
  const [departDate, setDepartDate] = useState('2026-05-20')
  const [showDepartCal, setShowDepartCal] = useState(false)
  const { weather } = useWeather('Kerala')

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return { day: 'Select', monthYear: 'Date', weekday: 'Click to select' }
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return { day: 'Select', monthYear: 'Date', weekday: 'Click to select' }
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    return {
      day: String(d.getDate()),
      monthYear: `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      weekday: weekdays[d.getDay()]
    }
  }


  const THEMES = [
    { title: 'Honeymoon', desc: '284 packages', icon: '💕' },
    { title: 'Family', desc: '512 packages', icon: '👨‍👩‍👧' },
    { title: 'Adventure', desc: '196 packages', icon: '🏔' },
    { title: 'Beach', desc: '340 packages', icon: '🏖' },
    { title: 'Heritage', desc: '158 packages', icon: '👑' },
    { title: 'Wellness', desc: '92 packages', icon: '🧘' }
  ]

  const PACKAGES = [
    {
      title: 'Kerala Backwaters',
      sub: 'Munnar · Alleppey · Kochi',
      badge: 'BESTSELLER',
      inclusions: ['✈ Flights', '🏨 4N hotel', '🚐 Transfers'],
      price: '24,999',
      duration: 'per person · 5D 4N',
      img: photo('dest-kerala')
    },
    {
      title: 'Royal Rajasthan',
      sub: 'Jaipur · Udaipur · Jodhpur',
      badge: 'RAJASTHAN',
      inclusions: ['✈ Flights', '🏨 6N stay', '🎭 Sightseeing'],
      price: '32,499',
      duration: 'per person · 7D 6N',
      img: photo('dest-jaipur')
    },
    {
      title: 'Goa Getaway',
      sub: 'North + South Goa',
      badge: 'BEACHES',
      inclusions: ['✈ Flights', '🏨 3N beach hotel', '🍽 Breakfast'],
      price: '14,499',
      duration: 'per person · 4D 3N',
      img: photo('dest-goa')
    },
    {
      title: 'Spiti Valley Circuit',
      sub: 'Manali · Kaza · Chandratal',
      badge: 'HIMALAYAS',
      inclusions: ['🚐 Road trip', '🏨 7N camps', '🧗 Activities'],
      price: '28,999',
      duration: 'per person · 8D 7N',
      img: photo('dest-rishikesh')
    },
    {
      title: 'Andaman Escape',
      sub: 'Port Blair · Havelock · Neil',
      badge: 'ISLANDS',
      inclusions: ['✈ Flights', '🏨 5N resort', '🤿 Scuba dive'],
      price: '38,499',
      duration: 'per person · 6D 5N',
      img: photo('dest-shimla')
    },
    {
      title: 'Himachal Highlights',
      sub: 'Shimla · Manali · Dharamsala',
      badge: 'HILL STATION',
      inclusions: ['🚐 Volvo + cab', '🏨 5N stay', '🍽 Meals'],
      price: '19,999',
      duration: 'per person · 6D 5N',
      img: photo('dest-manali')
    }
  ]

  const INTL = [
    { title: 'Maldives', desc: '5N · Overwater villas', price: '78,999', img: photo('dest-maldives') },
    { title: 'Bali', desc: '6N · Beaches + spa', price: '54,499', img: photo('dest-bali') },
    { title: 'Thailand', desc: '5N · Bangkok + Phuket', price: '32,999', img: photo('dest-thailand') },
    { title: 'Europe', desc: '9N · 4 countries', price: '1,49,999', img: photo('dest-dubai') }
  ]

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
      <header className="phero holidays">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Holiday Packages</span>
          </div>
          <h1>Trips planned, perfectly.</h1>
          <p style={{ marginBottom: weather ? 10 : 28 }}>Flights + stays + sightseeing — one bundle, one price, zero hassle</p>
          {weather && (
            <div className="live-weather-badge" style={{ marginBottom: 28 }}>
              <span className="live-weather-pulse" />
              <span>Kerala Weather: {weather.temp}°C {weather.emoji} {weather.desc}</span>
            </div>
          )}

          {/* Search Card */}
          <div className="inner-search-bcard">
            
            {/* Service navigation tab strip inside search box */}
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
            <div className="inner-search-grid holidays-grid">
              <div className="inner-search-field">
                <div className="inner-field-lbl">From</div>
                <div className="inner-field-val">New Delhi</div>
                <div className="inner-field-sub">DEL, India</div>
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">Destination</div>
                <div className="inner-field-val">Kerala</div>
                <div className="inner-field-sub">India · Backwaters</div>
              </div>
              <div className="inner-search-field" style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => setShowDepartCal(p => !p)}>
                <div className="inner-field-lbl">Departure</div>
                <div className="inner-field-val">
                  {formatDateDisplay(departDate).day}{' '}
                  <span className="unit-suffix">{formatDateDisplay(departDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(departDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showDepartCal}
                  value={departDate}
                  onChange={v => { setDepartDate(v); setShowDepartCal(false) }}
                  onClose={() => setShowDepartCal(false)}
                  labelText="Departure"
                />
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Travellers</div>
                <div className="inner-field-val">2 <span className="unit-suffix">Adults</span></div>
                <div className="inner-field-sub">Add children</div>
              </div>
              <button className="inner-search-cta" onClick={() => alert('Searching Holidays...!')}>
                SEARCH
              </button>
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['India', 'International', 'Honeymoon', 'Family', 'Adventure'].map((chip) => (
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

      {/* Pick Your Travel Theme Section */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Pick your travel theme</h2>
            <p className="inner-sec-subtitle">Curated for every kind of traveller</p>
          </div>
        </div>

        <div className="holidays-themes-grid">
          {THEMES.map((theme, idx) => (
            <div key={theme.title} className="holiday-theme-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="holiday-theme-ico">{theme.icon}</div>
              <h4>{theme.title}</h4>
              <p>{theme.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Holiday Packages in India */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Top holiday packages in India</h2>
            <p className="inner-sec-subtitle">All-inclusive · Best price guarantee</p>
          </div>
          <span className="inner-sec-all-link" onClick={() => alert('Loading India packages...')}>All packages →</span>
        </div>

        <div className="holidays-pkgs-grid">
          {PACKAGES.map((pkg, idx) => (
            <div key={pkg.title} className="holiday-pkg-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="holiday-pkg-header" style={{ backgroundImage: `url(${pkg.img})` }}>
                <span className="holiday-pkg-badge">{pkg.badge}</span>
                <div className="holiday-pkg-title-box">
                  <h4>{pkg.title}</h4>
                  <small>{pkg.sub}</small>
                </div>
              </div>
              <div className="holiday-pkg-body">
                <div className="holiday-pkg-inclusions">
                  {pkg.inclusions.map((inc) => (
                    <span key={inc}>{inc}</span>
                  ))}
                </div>
                <div className="holiday-pkg-meta-row">
                  <div className="holiday-pkg-price">
                    ₹{pkg.price}
                    <small>{pkg.duration}</small>
                  </div>
                  <button className="holiday-pkg-action-btn" onClick={() => alert(`Viewing itinerary for ${pkg.title}`)}>
                    VIEW
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* International Getaways Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">International getaways</h2>
            <p className="inner-sec-subtitle">Visa &amp; flights included</p>
          </div>
        </div>

        <div className="holidays-intl-grid">
          {INTL.map((item, idx) => (
            <div key={item.title} className="holiday-intl-card" data-aos="zoom-in" data-aos-delay={idx * 100}>
              <div className="holiday-intl-bg" style={{ backgroundImage: `url(${item.img})` }} />
              <div className="holiday-intl-info">
                <h4>{item.title}</h4>
                <small>{item.desc}</small>
                <div className="price-tag">From ₹{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
