import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import { useWeather } from '../hooks/useWeather'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'

export default function BusesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('buses')
  const [activeChip, setActiveChip] = useState('All Buses')
  const [travelDate, setTravelDate] = useState('2026-05-15')
  const [showTravelCal, setShowTravelCal] = useState(false)

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

  // Fetch live weather data for Bengaluru!
  const { weather } = useWeather('Bengaluru')

  const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&h=400&q=80`

  const BUS_OPERATORS = [
    {
      name: 'IntrCity SmartBus',
      type: 'A/C Sleeper (2+1) · Premium Multi-Axle',
      depTime: '21:00',
      arrTime: '06:15',
      duration: '9h 15m',
      price: '849',
      oldPrice: '1,200',
      seats: '14 Seats Left',
      rating: '4.8 (1,450 reviews)',
      features: '⚡ Charger · 🥛 Water ·  blankets · Live Tracking',
      img: img('1544620347-c4fd4a3d5957')
    },
    {
      name: 'Zingbus Premium',
      type: 'A/C Seater/Sleeper · Scania Multi-Axle Volvo',
      depTime: '22:30',
      arrTime: '07:45',
      duration: '9h 15m',
      price: '699',
      oldPrice: '999',
      seats: '22 Seats Left',
      rating: '4.7 (890 reviews)',
      features: '🥛 Water · 🛌 Pillow · Safe & sanitized ride',
      img: img('1570125909232-eb9637b8826e')
    },
    {
      name: 'KSRTC Ambaari Dream Class',
      type: 'Multi-Axle Sleeper (2+1) · Govt. undertaking',
      depTime: '20:15',
      arrTime: '05:30',
      duration: '9h 15m',
      price: '1,150',
      oldPrice: '1,400',
      seats: '4 Seats Left',
      rating: '4.9 (3,210 reviews)',
      features: '🛌 Premium bedding · On-Time Guarantee',
      img: img('1561361513-2d000a50f0db')
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
      <header className="phero buses">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Bus Tickets</span>
          </div>
          <h1>Online Bus Tickets Booking</h1>
          <p style={{ marginBottom: weather ? 10 : 28 }}>Over 26 Lakh+ Bus Routes &amp; Best Operators Across India</p>
          {weather && (
            <div className="live-weather-badge" style={{ marginBottom: 28 }}>
              <span className="live-weather-pulse" />
              <span>Bengaluru Destination Weather: {weather.temp}°C {weather.emoji} {weather.desc}</span>
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
                <div className="inner-field-lbl">From</div>
                <div className="inner-field-val">Chennai</div>
                <div className="inner-field-sub">Tamil Nadu, India</div>
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">To</div>
                <div className="inner-field-val">Bengaluru</div>
                <div className="inner-field-sub">Karnataka, India</div>
              </div>
              <div className="inner-search-field" onClick={(e) => { e.stopPropagation(); setShowTravelCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="inner-field-lbl">Travel Date</div>
                <div className="inner-field-val">
                  {formatDateDisplay(travelDate).day} <span className="unit-suffix">{formatDateDisplay(travelDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(travelDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showTravelCal}
                  value={travelDate}
                  onChange={(date) => setTravelDate(date)}
                  onClose={() => setShowTravelCal(false)}
                  labelText="Travel Date"
                />
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Seat Type</div>
                <div className="inner-field-val">Sleeper <span className="unit-suffix">Class</span></div>
                <div className="inner-field-sub">AC Preferred</div>
              </div>
              <button className="inner-search-cta" onClick={() => alert('Searching Buses...!')}>
                SEARCH
              </button>
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['All Buses', 'AC Sleeper', 'Volvo / Scania', 'Govt. Undertakings', 'Express Direct'].map((chip) => (
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

      {/* Available Bus Classes */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Popular bus operators from Chennai to Bengaluru</h2>
            <p className="inner-sec-subtitle">All-inclusive low-cost ticket fares · Free reschedule options</p>
          </div>
        </div>

        <div className="cabs-list-stack">
          {BUS_OPERATORS.map((bus, idx) => (
            <div key={bus.name} className="cab-result-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="cab-card-img" style={{ backgroundImage: `url(${bus.img})` }} />
              <div className="cab-card-body">
                <div className="cab-badge-row">
                  <span className="cab-icon">🚌</span>
                  <span className="cab-rating">★ {bus.rating}</span>
                </div>
                <h3>{bus.name}</h3>
                <p className="cab-type">{bus.type}</p>
                <p className="cab-desc" style={{ color: 'hsl(var(--su))', fontWeight: 600 }}>{bus.features}</p>
                <p className="cab-desc" style={{ marginTop: 6 }}>⏱️ Timings: {bus.depTime} - {bus.arrTime} ({bus.duration})</p>
              </div>
              <div className="cab-card-price-action">
                <div className="price-box">
                  <span className="old-price">₹{bus.oldPrice}</span>
                  <span className="price">₹{bus.price}</span>
                  <small style={{ color: 'hsl(var(--er))' }}>{bus.seats}</small>
                </div>
                <button onClick={() => alert(`Initiating seat selection for ${bus.name}`)}>
                  SELECT SEAT
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
