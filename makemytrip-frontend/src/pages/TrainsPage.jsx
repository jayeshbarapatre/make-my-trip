import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import { useWeather } from '../hooks/useWeather'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import '../styles/Hero.css'

export default function TrainsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('trains')
  const [activeChip, setActiveChip] = useState('General')
  const [travelDate, setTravelDate] = useState('2026-05-13')
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
  const { weather } = useWeather('New Delhi')

  const TOOLS = [
    { title: 'PNR status', desc: 'Check ticket confirmation', icon: '🎫', code: 'pnr' },
    { title: 'Live status', desc: 'Track train running info', icon: '📍', code: 'live' },
    { title: 'Train schedule', desc: 'Full route & timings', icon: '🕐', code: 'sched' },
    { title: 'Seat availability', desc: 'Class-wise availability', icon: '💺', code: 'book' }
  ]

  const ROUTES = [
    { from: 'New Delhi', to: 'Mumbai', trains: '32 trains daily' },
    { from: 'Bangalore', to: 'Chennai', trains: '28 trains daily' },
    { from: 'Howrah', to: 'New Delhi', trains: '24 trains daily' },
    { from: 'Mumbai', to: 'Pune', trains: '40 trains daily' },
    { from: 'Chennai', to: 'Bangalore', trains: '28 trains daily' },
    { from: 'Delhi', to: 'Lucknow', trains: '22 trains daily' }
  ]

  const TRAINS = [
    {
      name: 'Rajdhani Express',
      number: '12952 · Western Railway',
      days: 'M T W T F S S',
      depTime: '16:55',
      depCode: 'NDLS',
      duration: '15h 35m',
      midType: 'Non-stop AC',
      arrTime: '08:30',
      arrCode: 'BCT',
      classes: [
        { code: '3A', status: 'AVL 42', isAvail: true },
        { code: '2A', status: 'AVL 18', isAvail: true },
        { code: '1A', status: 'AVL 6', isAvail: true }
      ],
      price: '2,485'
    },
    {
      name: 'Mumbai Tejas Express',
      number: '22120 · Central Railway',
      days: 'M · W · F · ·',
      depTime: '15:40',
      depCode: 'NDLS',
      duration: '16h 50m',
      midType: '2 stops',
      arrTime: '08:30',
      arrCode: 'CSMT',
      classes: [
        { code: 'EC', status: 'WL 12', isAvail: false },
        { code: 'CC', status: 'AVL 86', isAvail: true }
      ],
      price: '1,890'
    },
    {
      name: 'Mumbai Duronto',
      number: '12260 · Western Railway',
      days: 'M · W · F · S',
      depTime: '23:00',
      depCode: 'NZM',
      duration: '15h 50m',
      midType: 'Non-stop',
      arrTime: '14:50',
      arrCode: 'BCT',
      classes: [
        { code: 'SL', status: 'AVL 124', isAvail: true },
        { code: '3A', status: 'AVL 24', isAvail: true },
        { code: '2A', status: 'WL 5', isAvail: false }
      ],
      price: '685'
    },
    {
      name: 'August Kranti Rajdhani',
      number: '12954 · Western Railway',
      days: 'M T W T F S S',
      depTime: '17:20',
      depCode: 'NZM',
      duration: '16h 40m',
      midType: '2 stops',
      arrTime: '10:00',
      arrCode: 'BCT',
      classes: [
        { code: '3A', status: 'AVL 38', isAvail: true },
        { code: '2A', status: 'AVL 12', isAvail: true }
      ],
      price: '2,310'
    }
  ]

  const [fromStation, setFromStation] = useState({ name: 'New Delhi', code: 'NDLS', state: 'Delhi, India' })
  const [toStation, setToStation] = useState({ name: 'Mumbai', code: 'CSMT', state: 'Maharashtra, India' })
  const [activePopup, setActivePopup] = useState(null) // 'from' | 'to' | null
  const [searchQuery, setSearchQuery] = useState('')

  const STATIONS = [
    { name: 'New Delhi', code: 'NDLS', state: 'Delhi, India' },
    { name: 'Mumbai Central', code: 'BCT', state: 'Maharashtra, India' },
    { name: 'Mumbai CSMT', code: 'CSMT', state: 'Maharashtra, India' },
    { name: 'Surat', code: 'ST', state: 'Gujarat, India' },
    { name: 'Vadodara Junction', code: 'BRC', state: 'Gujarat, India' },
    { name: 'Ahmedabad Junction', code: 'ADI', state: 'Gujarat, India' },
    { name: 'Pune Junction', code: 'PUNE', state: 'Maharashtra, India' },
    { name: 'Bengaluru City', code: 'SBC', state: 'Karnataka, India' },
    { name: 'Chennai Central', code: 'MAS', state: 'Tamil Nadu, India' },
    { name: 'Howrah Junction', code: 'HWH', state: 'West Bengal, India' },
    { name: 'Jaipur Junction', code: 'JP', state: 'Rajasthan, India' },
    { name: 'Lucknow Charbagh', code: 'LKO', state: 'Uttar Pradesh, India' },
    { name: 'Kanpur Central', code: 'CNB', state: 'Uttar Pradesh, India' },
    { name: 'Nagpur Junction', code: 'NGP', state: 'Maharashtra, India' },
    { name: 'Bhopal Junction', code: 'BPL', state: 'Madhya Pradesh, India' },
    { name: 'Patna Junction', code: 'PNBE', state: 'Bihar, India' },
    { name: 'Guwahati', code: 'GHY', state: 'Assam, India' },
    { name: 'Varanasi Junction', code: 'BSB', state: 'Uttar Pradesh, India' },
    { name: 'Secunderabad', code: 'SC', state: 'Telangana, India' },
    { name: 'Agra Cantt', code: 'AGC', state: 'Uttar Pradesh, India' },
    { name: 'Chandigarh', code: 'CDG', state: 'Punjab, India' },
    { name: 'Kochi / Ernakulam', code: 'ERS', state: 'Kerala, India' },
    { name: 'Thiruvananthapuram', code: 'TVC', state: 'Kerala, India' },
    { name: 'Indore Junction', code: 'INDB', state: 'Madhya Pradesh, India' },
    { name: 'Gwalior Junction', code: 'GWL', state: 'Madhya Pradesh, India' },
    { name: 'Jabalpur Junction', code: 'JBP', state: 'Madhya Pradesh, India' },
    { name: 'Jodhpur Junction', code: 'JU', state: 'Rajasthan, India' },
    { name: 'Udaipur City', code: 'UDZ', state: 'Rajasthan, India' },
    { name: 'Bikaner Junction', code: 'BKN', state: 'Rajasthan, India' },
    { name: 'Amritsar Junction', code: 'ASR', state: 'Punjab, India' },
    { name: 'Dehradun', code: 'DDN', state: 'Uttarakhand, India' },
    { name: 'Ranchi Junction', code: 'RNC', state: 'Jharkhand, India' },
    { name: 'Bhubaneswar', code: 'BBS', state: 'Odisha, India' },
    { name: 'Raipur Junction', code: 'R', state: 'Chhattisgarh, India' },
    { name: 'Visakhapatnam', code: 'VSKP', state: 'Andhra Pradesh, India' },
    { name: 'Vijayawada Junction', code: 'BZA', state: 'Andhra Pradesh, India' },
    { name: 'Coimbatore Junction', code: 'CBE', state: 'Tamil Nadu, India' },
    { name: 'Madurai Junction', code: 'MDU', state: 'Tamil Nadu, India' },
    { name: 'Mysuru Junction', code: 'MYS', state: 'Karnataka, India' },
    { name: 'Gorakhpur Junction', code: 'GKP', state: 'Uttar Pradesh, India' }
  ]

  const filteredStations = STATIONS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  const handleSearchTrains = () => {
    navigate('/trains/results', {
      state: {
        fromCity: `${fromStation.name} (${fromStation.code})`,
        toCity: `${toStation.name} (${toStation.code})`,
        travelDate: travelDate,
        quota: activeChip,
        classPref: "All Classes"
      }
    });
  };

  return (
    <div className="homepage-viewport-wrapper">
      
      {/* Hero Backdrop Panel */}
      <header className="phero trains">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Train Tickets</span>
          </div>
          <h1>Book IRCTC train tickets</h1>
          <p style={{ marginBottom: weather ? 10 : 28 }}>Authorised IRCTC partner · Instant Tatkal · Free cancellation protection</p>
          {weather && (
            <div className="live-weather-badge" style={{ marginBottom: 28 }}>
              <span className="live-weather-pulse" />
              <span>New Delhi Weather: {weather.temp}°C {weather.emoji} {weather.desc}</span>
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
                  <span className="tab-icon">{t.icon}</span>
                  <span className="tab-lbl" style={{ whiteSpace: 'pre-line' }}>{t.label}</span>
                  {activeTab === t.id && <div className="tab-bar" />}
                </button>
              ))}
            </div>

            {/* Inputs Grid */}
            <div className="inner-search-grid trains-grid">
              
              {/* FROM STATION FIELD */}
              <div 
                className="inner-search-field" 
                onClick={(e) => { e.stopPropagation(); setActivePopup('from'); setSearchQuery(''); }}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className="inner-field-lbl">From</div>
                <div className="inner-field-val">{fromStation.name} <span className="unit-suffix">{fromStation.code}</span></div>
                <div className="inner-field-sub">{fromStation.state}</div>

                {activePopup === 'from' && (
                  <div className="popup-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, width: '320px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '16px', zIndex: 1000, border: '1px solid #cbd5e1', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>SEARCH ORIGIN STATION</span>
                      <button onClick={() => setActivePopup(null)} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="City or Station" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #008cff', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                      autoFocus
                    />
                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredStations.map((st) => (
                        <div 
                          key={st.code} 
                          onClick={() => { setFromStation(st); setActivePopup(null); }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{st.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{st.state}</div>
                          </div>
                          <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>{st.code}</span>
                        </div>
                      ))}

                      {filteredStations.length === 0 && searchQuery.trim() && (
                        <div 
                          onClick={() => { 
                            setFromStation({ name: searchQuery.trim(), code: searchQuery.trim().substring(0,3).toUpperCase(), state: 'India' });
                            setActivePopup(null);
                          }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eef2ff', border: '1px solid #c7d2fe' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#4f46e5' }}>🚂 Origin: "{searchQuery.trim()}"</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Click to select this custom station</div>
                          </div>
                          <span style={{ background: '#4f46e5', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>CUSTOM</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* TO STATION FIELD */}
              <div 
                className="inner-search-field" 
                onClick={(e) => { e.stopPropagation(); setActivePopup('to'); setSearchQuery(''); }}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <div className="inner-field-lbl">To</div>
                <div className="inner-field-val">{toStation.name} <span className="unit-suffix">{toStation.code}</span></div>
                <div className="inner-field-sub">{toStation.state}</div>

                {activePopup === 'to' && (
                  <div className="popup-dropdown" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, width: '320px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '16px', zIndex: 1000, border: '1px solid #cbd5e1', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>SEARCH DESTINATION STATION</span>
                      <button onClick={() => setActivePopup(null)} style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 800 }}>✕</button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="City or Station" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid #008cff', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }}
                      autoFocus
                    />
                    <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredStations.map((st) => (
                        <div 
                          key={st.code} 
                          onClick={() => { setToStation(st); setActivePopup(null); }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{st.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{st.state}</div>
                          </div>
                          <span style={{ background: '#e2e8f0', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>{st.code}</span>
                        </div>
                      ))}

                      {filteredStations.length === 0 && searchQuery.trim() && (
                        <div 
                          onClick={() => { 
                            setToStation({ name: searchQuery.trim(), code: searchQuery.trim().substring(0,3).toUpperCase(), state: 'India' });
                            setActivePopup(null);
                          }}
                          style={{ padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eef2ff', border: '1px solid #c7d2fe' }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#4f46e5' }}>🚂 Destination: "{searchQuery.trim()}"</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Click to select this custom station</div>
                          </div>
                          <span style={{ background: '#4f46e5', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>CUSTOM</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* TRAVEL DATE FIELD */}
              <div className="inner-search-field" onClick={(e) => { e.stopPropagation(); setShowTravelCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="inner-field-lbl">Travel date</div>
                <div className="inner-field-val">
                  {formatDateDisplay(travelDate).day} <span className="unit-suffix">{formatDateDisplay(travelDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(travelDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showTravelCal}
                  value={travelDate}
                  onChange={(date) => setTravelDate(date)}
                  onClose={() => setShowTravelCal(false)}
                  labelText="Travel date"
                />
              </div>

              {/* CLASS & QUOTA FIELD */}
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Class</div>
                <div className="inner-field-val">3A <span className="unit-suffix">All classes</span></div>
                <div className="inner-field-sub">Quota: {activeChip}</div>
              </div>

              <button className="inner-search-cta" onClick={handleSearchTrains}>
                SEARCH
              </button>
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['General', 'Tatkal', 'Ladies', 'Senior Citizen', 'Premium Tatkal'].map((chip) => (
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

      {/* Quick Tools Section */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Quick tools</h2>
            <p className="inner-sec-subtitle">Everything you need before boarding</p>
          </div>
        </div>

        <div className="trains-quick-grid">
          {TOOLS.map((tool, idx) => (
            <div key={tool.title} className="trains-quick-card" data-c={tool.code} data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="trains-quick-ico-box">{tool.icon}</div>
              <div className="trains-quick-details">
                <h4>{tool.title}</h4>
                <p>{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Train Search Results Stack Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Trains from New Delhi to Mumbai</h2>
            <p className="inner-sec-subtitle">Sunday, 18 May 2026 · 12 trains found</p>
          </div>
        </div>

        <div className="trains-results-stack">
          {TRAINS.map((train, idx) => (
            <div key={train.number} className="train-result-row" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="train-row-identity">
                <strong>{train.name}</strong>
                <small>{train.number}</small>
                <span className="train-row-days">{train.days}</span>
              </div>

              <div className="train-row-timeline">
                <div className="train-timeline-node">
                  <strong>{train.depTime}</strong>
                  <small>{train.depCode}</small>
                </div>
                <div className="train-timeline-midline">
                  <em>{train.duration}</em>
                  <div className="train-timeline-bar" />
                  <em>{train.midType}</em>
                </div>
                <div className="train-timeline-node">
                  <strong>{train.arrTime}</strong>
                  <small>{train.arrCode}</small>
                </div>
              </div>

              <div className="train-row-classes">
                {train.classes.map((cls) => (
                  <div key={cls.code} className={`train-class-pill ${cls.isAvail ? 'avail' : 'wl'}`}>
                    <span>{cls.code}</span>
                    <strong>{cls.status}</strong>
                  </div>
                ))}
              </div>

              <div className="train-row-action">
                <span className="price">₹ {train.price}</span>
                <button onClick={handleSearchTrains}>BOOK</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Train Routes Section */}
      <section className="inner-page-section" style={{ paddingTop: 0 }}>
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Popular train routes</h2>
            <p className="inner-sec-subtitle">India's most booked journeys</p>
          </div>
        </div>

        <div className="trains-routes-grid">
          {ROUTES.map((route, idx) => (
            <div key={`${route.from}-${route.to}`} className="train-route-card" data-aos="zoom-in" data-aos-delay={idx * 100}>
              <div>
                <strong>{route.from} → {route.to}</strong>
                <small>{route.trains}</small>
              </div>
              <span className="arrow-icon">→</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
