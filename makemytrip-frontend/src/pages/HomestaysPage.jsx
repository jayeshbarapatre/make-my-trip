import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import { useWeather } from '../hooks/useWeather'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'

export default function HomestaysPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('villas')
  const [activeChip, setActiveChip] = useState('Entire home')
  const [checkInDate, setCheckInDate] = useState('2026-05-20')
  const [checkOutDate, setCheckOutDate] = useState('2026-05-23')
  const [showCheckInCal, setShowCheckInCal] = useState(false)
  const [showCheckOutCal, setShowCheckOutCal] = useState(false)
  const { weather } = useWeather('Coorg')

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

  const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=400&q=80`

  const HOMESTAYS = [
    {
      title: 'The Plantation House',
      loc: 'Coorg · 3BR villa · Sleeps 8',
      price: '6,499',
      rating: '4.9',
      badge: 'SUPERHOST',
      img: img('1502672260266-1c1ef2d93688')
    },
    {
      title: 'Riverside Cottage',
      loc: 'Rishikesh · 2BR · Sleeps 4',
      price: '3,899',
      rating: '4.7',
      badge: 'NEW',
      img: img('1580587771525-78b9dba3b914')
    },
    {
      title: 'Heritage Haveli',
      loc: 'Jodhpur · 5BR · Sleeps 12',
      price: '14,999',
      rating: '4.8',
      badge: 'LUXURY',
      img: img('1520250497591-112f2f40a3f4')
    },
    {
      title: 'Sea Breeze Villa',
      loc: 'North Goa · 4BR · Pool',
      price: '11,499',
      rating: '4.9',
      badge: 'BEACHFRONT',
      img: img('1512917774080-9991f1c4c750')
    },
    {
      title: 'Island Treehouse',
      loc: 'Andaman · 1BR · Ocean view',
      price: '8,199',
      rating: '4.9',
      badge: 'UNIQUE',
      img: img('1506905925346-21bda4d32df4')
    },
    {
      title: 'Pine View Lodge',
      loc: 'Kasol · 3BR · Sleeps 6',
      price: '4,799',
      rating: '4.6',
      badge: 'MOUNTAIN',
      img: img('1464822759023-fed622ff2c3b')
    }
  ]

  const WHY = [
    { icon: '🏡', title: 'Entire spaces', desc: 'Private homes, no shared corridors' },
    { icon: '🤝', title: 'Local hosts', desc: 'Insider tips, home-cooked meals' },
    { icon: '✅', title: 'Verified properties', desc: 'Every listing inspected and reviewed' },
    { icon: '💸', title: 'Better value', desc: '30% cheaper than equivalent hotels' }
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
      <header className="phero homestays">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Homestays &amp; Villas</span>
          </div>
          <h1>Live like a local. Stay like family.</h1>
          <p style={{ marginBottom: weather ? 10 : 28 }}>Handpicked homes and villas in 1,000+ Indian destinations · Hosted by people, not chains</p>
          {weather && (
            <div className="live-weather-badge" style={{ marginBottom: 28 }}>
              <span className="live-weather-pulse" />
              <span>Coorg Weather: {weather.temp}°C {weather.emoji} {weather.desc}</span>
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
            <div className="inner-search-grid homestays-grid">
              <div className="inner-search-field">
                <div className="inner-field-lbl">Where to?</div>
                <div className="inner-field-val">Coorg</div>
                <div className="inner-field-sub">Karnataka, India</div>
              </div>
              <div className="inner-search-field" style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => { setShowCheckInCal(p => !p); setShowCheckOutCal(false) }}>
                <div className="inner-field-lbl">Check-in</div>
                <div className="inner-field-val">
                  {formatDateDisplay(checkInDate).day}{' '}
                  <span className="unit-suffix">{formatDateDisplay(checkInDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(checkInDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showCheckInCal}
                  value={checkInDate}
                  onChange={v => { setCheckInDate(v); setShowCheckInCal(false) }}
                  onClose={() => setShowCheckInCal(false)}
                  labelText="Check-in"
                />
              </div>
              <div className="inner-search-field" style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => { setShowCheckOutCal(p => !p); setShowCheckInCal(false) }}>
                <div className="inner-field-lbl">Check-out</div>
                <div className="inner-field-val">
                  {formatDateDisplay(checkOutDate).day}{' '}
                  <span className="unit-suffix">{formatDateDisplay(checkOutDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(checkOutDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showCheckOutCal}
                  value={checkOutDate}
                  onChange={v => { setCheckOutDate(v); setShowCheckOutCal(false) }}
                  onClose={() => setShowCheckOutCal(false)}
                  labelText="Check-out"
                />
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Guests</div>
                <div className="inner-field-val">4 <span className="unit-suffix">Adults</span></div>
                <div className="inner-field-sub">Family-friendly</div>
              </div>
              <button className="inner-search-cta" onClick={() => alert('Searching Homestays & Villas...!')}>
                SEARCH
              </button>
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['Entire home', 'Pet friendly', 'Pool', 'Plantation views', 'Workation ready'].map((chip) => (
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

      {/* Featured Homestays Section */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Featured homestays</h2>
            <p className="inner-sec-subtitle">Trending homes our travellers love</p>
          </div>
          <span className="inner-sec-all-link" onClick={() => alert('Loading homestays...')}>View all →</span>
        </div>

        <div className="homestays-feat-grid">
          {HOMESTAYS.map((hs, idx) => (
            <div key={hs.title} className="hs-feat-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="hs-feat-img-box" style={{ backgroundImage: `url(${hs.img})` }}>
                <span className="hs-feat-badge">{hs.badge}</span>
                <span className="hs-feat-heart">♡</span>
              </div>
              <div className="hs-feat-body">
                <h4>{hs.title}</h4>
                <div className="hs-feat-loc">{hs.loc}</div>
                <div className="hs-feat-meta">
                  <div className="price">₹{hs.price} <small>/night</small></div>
                  <div className="hs-feat-rating">★ {hs.rating}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Book Homestay Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <h2 className="inner-sec-title">Why book a homestay?</h2>
        </div>

        <div className="homestays-why-grid">
          {WHY.map((w, idx) => (
            <div key={w.title} className="hs-why-card" data-aos="zoom-in" data-aos-delay={idx * 100}>
              <div className="hs-why-ico">{w.icon}</div>
              <h4>{w.title}</h4>
              <p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Become a Host Banner Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="homestays-host-banner" data-aos="fade-up">
          <div className="host-banner-left">
            <h2>List your home. <span>Earn with MMT.</span></h2>
            <p>Already running a homestay or have a spare property? Reach 50M+ travellers, set your own rates, and get paid securely — with zero listing fees.</p>
            <button onClick={() => alert('Navigating to Become a Host onboarding flow...')}>Become a host</button>
          </div>
          <div className="host-banner-right">🔑</div>
        </div>
      </section>

    </div>
  )
}
