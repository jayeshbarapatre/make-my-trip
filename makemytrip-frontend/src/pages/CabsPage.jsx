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

export default function CabsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('cabs')
  const [activeChip, setActiveChip] = useState('Outstation One-Way')
  const [departDate, setDepartDate] = useState(() => todayLocal())
  const [showDepartCal, setShowDepartCal] = useState(false)
  const [fromCity, setFromCity] = useState({ name: 'Delhi', state: 'Delhi, India' })
  const [toCity, setToCity] = useState({ name: 'Jaipur', state: 'Rajasthan, India' })
  const [activePopup, setActivePopup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const CITIES = [
    { name: 'Delhi', state: 'Delhi, India' },
    { name: 'Jaipur', state: 'Rajasthan, India' },
    { name: 'Agra', state: 'Uttar Pradesh, India' },
    { name: 'Chandigarh', state: 'Punjab, India' },
    { name: 'Dehradun', state: 'Uttarakhand, India' },
    { name: 'Mumbai', state: 'Maharashtra, India' },
    { name: 'Pune', state: 'Maharashtra, India' },
    { name: 'Lonavala', state: 'Maharashtra, India' },
    { name: 'Bengaluru', state: 'Karnataka, India' },
    { name: 'Mysuru', state: 'Karnataka, India' },
    { name: 'Chennai', state: 'Tamil Nadu, India' },
    { name: 'Pondicherry', state: 'Puducherry, India' },
    { name: 'Hyderabad', state: 'Telangana, India' },
    { name: 'Ahmedabad', state: 'Gujarat, India' },
    { name: 'Udaipur', state: 'Rajasthan, India' }
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

  // Fetch live weather data for our cab destination: Jaipur!
  const { weather } = useWeather('Jaipur')


  const CARS = [
    {
      name: 'Dzire, Etios',
      type: 'Sedan · AC · 4 Seats',
      desc: 'Spacious boot, comfortable ride',
      price: '2,850',
      old: '3,400',
      rating: '4.8 (140 ratings)',
      icon: '🚗',
      img: photo('cab-sedan')
    },
    {
      name: 'Ertiga, Lodgy',
      type: 'SUV · AC · 6 Seats',
      desc: 'Perfect for group travel & extra luggage',
      price: '4,150',
      old: '4,900',
      rating: '4.9 (210 ratings)',
      icon: '🚙',
      img: photo('cab-suv')
    },
    {
      name: 'Innova Crysta',
      type: 'Premium SUV · AC · 6 Seats',
      desc: 'Top-tier luxury and comfort',
      price: '5,800',
      old: '6,600',
      rating: '4.95 (380 ratings)',
      icon: '👑',
      img: photo('cab-interior')
    }
  ]

  const WHY = [
    { icon: '🛡️', title: 'Clean & Sanitized Cabs', desc: 'Disinfected interiors, verified chauffeurs' },
    { icon: '🏷️', title: 'No Hidden Charges', desc: 'Tolls, state permit, and taxes included' },
    { icon: '⏱️', title: 'On-Time Guarantee', desc: 'Cab arrives 15 mins early or next ride is free' },
    { icon: '⭐', title: 'Top-Rated Chauffeurs', desc: 'Highly professional, local route experts' }
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

  const handleSearchCabs = () => {
    navigate('/cabs/results', {
      state: {
        fromCity: fromCity.name,
        toCity: toCity.name,
        departDate: departDate
      }
    })
  }

  return (
    <div className="homepage-viewport-wrapper">
      
      {/* Hero Backdrop Panel */}
      <header className="phero cabs">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Cabs Booking</span>
          </div>
          <h1>Online Cab Booking</h1>
          <p style={{ marginBottom: weather ? 10 : 28 }}>Intercity outstations · Airport transfers · Local hourly rentals</p>
          {weather && (
            <div className="live-weather-badge" style={{ marginBottom: 28 }}>
              <span className="live-weather-pulse" />
              <span>Jaipur Destination Weather: {weather.temp}°C {weather.emoji} {weather.desc}</span>
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
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--p))' }}>🚕 Origin: "{searchQuery.trim()}"</div>
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
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--p))' }}>🚕 Destination: "{searchQuery.trim()}"</div>
                            <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Click to select this custom city</div>
                          </div>
                          <span style={{ background: 'hsl(var(--p))', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>CUSTOM</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                <div className="inner-field-lbl">Departure Time</div>
                <div className="inner-field-val">10:00 <span className="unit-suffix">AM</span></div>
                <div className="inner-field-sub">Morning departure</div>
              </div>
              <SearchButton onClick={handleSearchCabs} />
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['Outstation One-Way', 'Outstation Round Trip', 'Airport Transfers', 'Hourly Rentals'].map((chip) => (
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

      {/* Available Cab Categories */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Available cab classes from Delhi to Jaipur</h2>
            <p className="inner-sec-subtitle">All-inclusive fares · Tolls &amp; taxes included</p>
          </div>
        </div>

        <div className="cabs-list-stack">
          {CARS.map((car, idx) => (
            <div key={car.name} className="cab-result-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="cab-card-img" style={{ backgroundImage: `url(${car.img})` }} />
              <div className="cab-card-body">
                <div className="cab-badge-row">
                  <span className="cab-icon">{car.icon}</span>
                  <span className="cab-rating">★ {car.rating}</span>
                </div>
                <h3>{car.name}</h3>
                <p className="cab-type">{car.type}</p>
                <p className="cab-desc">{car.desc}</p>
              </div>
              <div className="cab-card-price-action">
                <div className="price-box">
                  <span className="old-price">₹{car.old}</span>
                  <span className="price">₹{car.price}</span>
                  <small>Free cancellation</small>
                </div>
                <button onClick={handleSearchCabs}>
                  BOOK CAB
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Book Cab with MMT Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <h2 className="inner-sec-title">Why book a cab with TripOra?</h2>
        </div>

        <div className="cabs-why-grid">
          {WHY.map((w, idx) => (
            <div key={w.title} className="cab-why-card" data-aos="zoom-in" data-aos-delay={idx * 100}>
              <div className="cab-why-ico">{w.icon}</div>
              <h4>{w.title}</h4>
              <p>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
