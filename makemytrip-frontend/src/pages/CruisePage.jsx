import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import { useWeather } from '../hooks/useWeather'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'

export default function CruisePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('cruise')
  const [activeChip, setActiveChip] = useState('All Cruises')
  const [departDate, setDepartDate] = useState('2026-05-22')
  const [showDepartCal, setShowDepartCal] = useState(false)

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

  // Fetch live weather data for Kochi!
  const { weather } = useWeather('Kochi')

  const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=400&q=80`

  const CRUISES = [
    {
      name: 'Cordelia Cruises: Mumbai to Goa Roundtrip',
      type: '3 Nights · Ocean View Cabin · Full Board',
      desc: 'Featuring world-class dining, live theatre, casino, and ocean pools',
      price: '24,500',
      oldPrice: '29,000',
      rating: '4.95 (1,210 ratings)',
      icon: '🚢',
      img: img('1507525428034-b723cf961d3e')
    },
    {
      name: 'Royal Caribbean: Singapore & Penang Getaway',
      type: '4 Nights · Balcony Suite · All Inclusive Luxe',
      desc: 'FlowRider surf simulator, rock climbing, and premium Broadway shows',
      price: '38,900',
      oldPrice: '45,000',
      rating: '4.98 (3,400 ratings)',
      icon: '👑',
      img: img('1544735716-392fe2489ffa')
    }
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
      <header className="phero cruise">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Cruise booking</span>
          </div>
          <h1>Luxury Cruise Booking</h1>
          <p style={{ marginBottom: weather ? 10 : 28 }}>Sail the Oceans in Style - Cordelia, Royal Caribbean, Genting Dream</p>
          {weather && (
            <div className="live-weather-badge" style={{ marginBottom: 28 }}>
              <span className="live-weather-pulse" />
              <span>Kochi Port Weather: {weather.temp}°C {weather.emoji} {weather.desc}</span>
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
            <div className="inner-search-grid cabs-grid">
              <div className="inner-search-field">
                <div className="inner-field-lbl">Port of Departure</div>
                <div className="inner-field-val">Mumbai</div>
                <div className="inner-field-sub">Maharashtra, India</div>
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">Destination Sea</div>
                <div className="inner-field-val">Goa Roundtrip</div>
                <div className="inner-field-sub">Arabian Sea</div>
              </div>
              <div className="inner-search-field" onClick={(e) => { e.stopPropagation(); setShowDepartCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="inner-field-lbl">Departure Date</div>
                <div className="inner-field-val">
                  {formatDateDisplay(departDate).day} <span className="unit-suffix">{formatDateDisplay(departDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(departDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showDepartCal}
                  value={departDate}
                  onChange={(date) => setDepartDate(date)}
                  onClose={() => setShowDepartCal(false)}
                  labelText="Departure Date"
                />
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Cabins / Guests</div>
                <div className="inner-field-val">1 <span className="unit-suffix">Cabin, 2 Pax</span></div>
                <div className="inner-field-sub">Standard Balcony</div>
              </div>
              <button className="inner-search-cta" onClick={() => alert('Searching Cruises...!')}>
                SEARCH
              </button>
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['All Cruises', 'Cordelia Specials', 'Royal Caribbean Luxe', 'Boutique River Cruises', 'Global Sails'].map((chip) => (
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

      {/* Available Cruise Classes */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Premium Luxury Cruises Available</h2>
            <p className="inner-sec-subtitle">Gourmet dining, luxury port cabins, and daily onboard entertainment packages</p>
          </div>
        </div>

        <div className="cabs-list-stack">
          {CRUISES.map((cruise, idx) => (
            <div key={cruise.name} className="cab-result-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="cab-card-img" style={{ backgroundImage: `url(${cruise.img})` }} />
              <div className="cab-card-body">
                <div className="cab-badge-row">
                  <span className="cab-icon">{cruise.icon}</span>
                  <span className="cab-rating">★ {cruise.rating}</span>
                </div>
                <h3>{cruise.name}</h3>
                <p className="cab-type">{cruise.type}</p>
                <p className="cab-desc">{cruise.desc}</p>
              </div>
              <div className="cab-card-price-action">
                <div className="price-box">
                  <span className="old-price">₹{cruise.oldPrice}</span>
                  <span className="price">₹{cruise.price}</span>
                  <small>Cabin Price (excl taxes)</small>
                </div>
                <button onClick={() => alert(`Initiating cabin booking for ${cruise.name}`)}>
                  VIEW CABINS
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
