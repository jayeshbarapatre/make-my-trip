import { useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import { comingSoonToast } from '../utils/comingSoon'
import { useToastContext } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'
import SearchButton from '../components/Common/SearchButton'

export default function VisaPage() {
  const navigate = useNavigate()
  const toast = useToastContext()
  const [activeTab, setActiveTab] = useState('visa')
  const [activeChip, setActiveChip] = useState('All Visas')
  const [travelDate, setTravelDate] = useState('2026-06-01')
  const [showCal, setShowCal] = useState(false)

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

  const VISAS = [
    {
      country: 'United Arab Emirates (Dubai)',
      type: '30 Days Tourist e-Visa · Single Entry',
      processingTime: '24 - 48 Hours Express Processing',
      docs: 'Passport Copy · Passport Size Photo',
      price: '6,800',
      badge: 'POPULAR',
      icon: '🇦🇪'
    },
    {
      country: 'Singapore',
      type: '30 Days Tourist Visa · Multiple Entry',
      processingTime: '3 - 5 Working Days',
      docs: 'Passport · Form 14A · Cover Letter',
      price: '2,400',
      badge: 'RECOMMENDED',
      icon: '🇸🇬'
    },
    {
      country: 'Thailand',
      type: 'e-Visa on Arrival Express Pass',
      processingTime: 'Instant Approval Verification',
      docs: 'Passport · Return Flight · Hotel Voucher',
      price: '1,800',
      badge: 'EXPRESS',
      icon: '🇹🇭'
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
      <header className="phero visa">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Visa Application Services</span>
          </div>
          <ComingSoon vertical="Visa services" blurb="Requirements shown are for reference. Applications cannot be filed here yet." ctaPath="/" ctaLabel="Browse flights" />
          <h1>Seamless e-Visa &amp; Immigration Services</h1>
          <p style={{ marginBottom: 28 }}>Minimal documentation · Expert document checks · 99.8% Visa success rate</p>

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
                <div className="inner-field-lbl">I am a Citizen of</div>
                <div className="inner-field-val">India (IND)</div>
                <div className="inner-field-sub">Indian Passport Holder</div>
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">Travelling To</div>
                <div className="inner-field-val">United Arab Emirates</div>
                <div className="inner-field-sub">Dubai, Abu Dhabi</div>
              </div>
              <div className="inner-search-field" onClick={(e) => { e.stopPropagation(); setShowCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="inner-field-lbl">Expected Departure</div>
                <div className="inner-field-val">
                  {formatDateDisplay(travelDate).day} <span className="unit-suffix">{formatDateDisplay(travelDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(travelDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showCal}
                  value={travelDate}
                  onChange={(date) => setTravelDate(date)}
                  onClose={() => setShowCal(false)}
                  labelText="Expected Departure"
                />
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Visa Category</div>
                <div className="inner-field-val">Tourist <span className="unit-suffix">e-Visa</span></div>
                <div className="inner-field-sub">Single Entry</div>
              </div>
              <SearchButton onClick={() => comingSoonToast(toast, "Visa services")} label="Check Visa" />
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['All Visas', 'e-Visa on Arrival', 'Schengen Assistance', 'US & UK Visa Guidance', 'Business Visas'].map((chip) => (
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

      {/* Popular Visa Services List */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Popular Visa Applications</h2>
            <p className="inner-sec-subtitle">Apply online in 3 easy steps: upload documents, pay fees, and receive visa in your inbox</p>
          </div>
        </div>

        <div className="cabs-list-stack">
          {VISAS.map((visa, idx) => (
            <div key={visa.country} className="cab-result-card" style={{ gridTemplateColumns: '1fr auto' }} data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="cab-card-body">
                <div className="cab-badge-row">
                  <span className="cab-icon">{visa.icon}</span>
                  <span className="cab-rating" style={{ background: 'hsl(var(--wa) / 0.6)', color: '#111' }}>{visa.badge}</span>
                </div>
                <h3>{visa.country}</h3>
                <p className="cab-type">{visa.type}</p>
                <p className="cab-desc" style={{ color: 'hsl(var(--su))', fontWeight: 600, marginTop: 4 }}>⏱️ {visa.processingTime}</p>
                <p className="cab-desc" style={{ marginTop: 4 }}>📄 Required: {visa.docs}</p>
              </div>
              <div className="cab-card-price-action">
                <div className="price-box">
                  <span className="price">₹{visa.price}</span>
                  <small>Embassy + MMT Fee (incl taxes)</small>
                </div>
                <button onClick={() => comingSoonToast(toast, "Visa services")}>
                  APPLY VISA
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
