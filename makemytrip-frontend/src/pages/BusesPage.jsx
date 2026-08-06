import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import { useWeather } from '../hooks/useWeather'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import { todayLocal } from '../utils/date'
import '../styles/Hero.css'
import { photo } from '../utils/images'
import SearchButton from '../components/Common/SearchButton'

export default function BusesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('buses')
  const [activeChip, setActiveChip] = useState('All Buses')
  const [travelDate, setTravelDate] = useState(() => todayLocal())
  const [showTravelCal, setShowTravelCal] = useState(false)
  const [fromCity, setFromCity] = useState({ name: 'Chennai', state: 'Tamil Nadu, India' })
  const [toCity, setToCity] = useState({ name: 'Bengaluru', state: 'Karnataka, India' })
  const [activePopup, setActivePopup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const CITIES = [
    { name: 'Chennai', state: 'Tamil Nadu, India' },
    { name: 'Bengaluru', state: 'Karnataka, India' },
    { name: 'Mumbai', state: 'Maharashtra, India' },
    { name: 'Delhi', state: 'Delhi, India' },
    { name: 'Hyderabad', state: 'Telangana, India' },
    { name: 'Pune', state: 'Maharashtra, India' },
    { name: 'Ahmedabad', state: 'Gujarat, India' },
    { name: 'Kolkata', state: 'West Bengal, India' },
    { name: 'Jaipur', state: 'Rajasthan, India' },
    { name: 'Surat', state: 'Gujarat, India' },
    { name: 'Lucknow', state: 'Uttar Pradesh, India' },
    { name: 'Kanpur', state: 'Uttar Pradesh, India' },
    { name: 'Nagpur', state: 'Maharashtra, India' },
    { name: 'Indore', state: 'Madhya Pradesh, India' },
    { name: 'Thane', state: 'Maharashtra, India' },
    { name: 'Bhopal', state: 'Madhya Pradesh, India' },
    { name: 'Visakhapatnam', state: 'Andhra Pradesh, India' },
    { name: 'Pimpri-Chinchwad', state: 'Maharashtra, India' },
    { name: 'Patna', state: 'Bihar, India' },
    { name: 'Vadodara', state: 'Gujarat, India' }
  ]

  const filteredCities = CITIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      img: photo('bus-luxury')
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
      img: photo('bus-volvo')
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
      img: photo('bus-interior')
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

  const handleSearchBuses = () => {
    navigate('/buses/results', {
      state: {
        fromCity: fromCity.name,
        toCity: toCity.name,
        travelDate: travelDate
      }
    })
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
              
              {/* FROM CITY FIELD */}
              <div 
                className="inner-search-field" 
                onClick={(e) => { e.stopPropagation(); setActivePopup('from'); setSearchQuery(''); }}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className="inner-field-lbl">From</div>
                <div className="inner-field-val">{fromCity.name}</div>
                <div className="inner-field-sub">{fromCity.state}</div>

                {activePopup === 'from' && (
                  <div className="popup-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, width: '320px', background: 'hsl(var(--b1))', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '16px', zIndex: 1000, border: '1px solid hsl(var(--b3))', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--bc))' }}>SEARCH ORIGIN CITY</span>
                      <button onClick={() => setActivePopup(null)} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 800, color: 'hsl(var(--bc))' }}>✕</button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="City Name" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid hsl(var(--p))', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', color: 'hsl(var(--bc))', background: 'transparent' }}
                      autoFocus
                    />
                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredCities.map((ct) => (
                        <div 
                          key={ct.name} 
                          onClick={() => { setFromCity(ct); setActivePopup(null); }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--b2))' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{ct.name}</div>
                            <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>{ct.state}</div>
                          </div>
                        </div>
                      ))}

                      {filteredCities.length === 0 && searchQuery.trim() && (
                        <div 
                          onClick={() => { 
                            setFromCity({ name: searchQuery.trim(), state: 'India' });
                            setActivePopup(null);
                          }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--p) / 0.06)', border: '1px solid hsl(var(--p) / 0.2)' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--p))' }}>🚌 Origin: "{searchQuery.trim()}"</div>
                            <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Click to select this custom city</div>
                          </div>
                          <span style={{ background: 'hsl(var(--p))', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>CUSTOM</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* TO CITY FIELD */}
              <div 
                className="inner-search-field" 
                onClick={(e) => { e.stopPropagation(); setActivePopup('to'); setSearchQuery(''); }}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className="inner-field-lbl">To</div>
                <div className="inner-field-val">{toCity.name}</div>
                <div className="inner-field-sub">{toCity.state}</div>

                {activePopup === 'to' && (
                  <div className="popup-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, width: '320px', background: 'hsl(var(--b1))', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '16px', zIndex: 1000, border: '1px solid hsl(var(--b3))', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--bc))' }}>SEARCH DESTINATION CITY</span>
                      <button onClick={() => setActivePopup(null)} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 800, color: 'hsl(var(--bc))' }}>✕</button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="City Name" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid hsl(var(--p))', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', color: 'hsl(var(--bc))', background: 'transparent' }}
                      autoFocus
                    />
                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredCities.map((ct) => (
                        <div 
                          key={ct.name} 
                          onClick={() => { setToCity(ct); setActivePopup(null); }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--b2))' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{ct.name}</div>
                            <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>{ct.state}</div>
                          </div>
                        </div>
                      ))}

                      {filteredCities.length === 0 && searchQuery.trim() && (
                        <div 
                          onClick={() => { 
                            setToCity({ name: searchQuery.trim(), state: 'India' });
                            setActivePopup(null);
                          }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--p) / 0.06)', border: '1px solid hsl(var(--p) / 0.2)' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--p))' }}>🚌 Destination: "{searchQuery.trim()}"</div>
                            <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Click to select this custom city</div>
                          </div>
                          <span style={{ background: 'hsl(var(--p))', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>CUSTOM</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
              <SearchButton onClick={handleSearchBuses} />
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
                <button onClick={handleSearchBuses}>
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
