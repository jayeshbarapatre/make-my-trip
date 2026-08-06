import { useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import { comingSoonToast } from '../utils/comingSoon'
import { useToastContext } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import CustomCalendarPicker from '../components/CustomCalendarPicker'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'
import { photo } from '../utils/images'
import SearchButton from '../components/Common/SearchButton'

export default function ToursPage() {
  const navigate = useNavigate()
  const toast = useToastContext()
  const [activeTab, setActiveTab] = useState('tours')
  const [activeChip, setActiveChip] = useState('All Attractions')
  const [activityDate, setActivityDate] = useState('2026-05-18')
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


  const TOURS = [
    {
      title: 'Universal Studios Singapore Ticket',
      loc: 'Sentosa Island, Singapore',
      category: 'Theme Parks · Instant Confirmation',
      desc: 'Experience cutting-edge rides, shows, and attractions based on your favourite blockbuster films.',
      price: '5,200',
      oldPrice: '6,000',
      rating: '4.9 (4,210 reviews)',
      badge: 'BESTSELLER',
      img: photo('phero-tours')
    },
    {
      title: 'Dubai Desert Safari with BBQ Dinner',
      loc: 'Dubai, United Arab Emirates',
      category: 'Adventure · Dune Bashing · Belly Dance',
      desc: 'Thrilling 4x4 drive across golden dunes, camel ride, henna painting, and starlit traditional buffet.',
      price: '3,450',
      oldPrice: '4,500',
      rating: '4.8 (2,890 reviews)',
      badge: 'POPULAR',
      img: photo('dest-jaipur')
    },
    {
      title: 'Eiffel Tower Summit Priority Access',
      loc: 'Paris, France',
      category: 'Sightseeing · Skip The Line',
      desc: 'Ascend to the top of Paris with an expert guide and enjoy breathtaking panoramic views.',
      price: '4,800',
      oldPrice: '5,500',
      rating: '4.95 (1,650 reviews)',
      badge: 'MUST VISIT',
      img: photo('dest-goa')
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
      <header className="phero tours">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Tours &amp; Attractions</span>
          </div>
          <ComingSoon vertical="Tours & activities" blurb="You can browse experiences here, but tickets cannot be booked yet." ctaPath="/hotels" ctaLabel="Browse hotels" />
          <h1>Explore Best Tours, Activities &amp; Attractions</h1>
          <p style={{ marginBottom: 28 }}>Skip-the-line tickets · Immersive local experiences · Global attractions</p>

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
                <div className="inner-field-lbl">City / Landmark</div>
                <div className="inner-field-val">Singapore</div>
                <div className="inner-field-sub">South East Asia</div>
              </div>
              <div className="inner-search-field" onClick={(e) => { e.stopPropagation(); setShowCal(true); }} style={{ position: 'relative', cursor: 'pointer' }}>
                <div className="inner-field-lbl">Activity Date</div>
                <div className="inner-field-val">
                  {formatDateDisplay(activityDate).day} <span className="unit-suffix">{formatDateDisplay(activityDate).monthYear}</span>
                </div>
                <div className="inner-field-sub">{formatDateDisplay(activityDate).weekday}</div>
                <CustomCalendarPicker
                  isOpen={showCal}
                  value={activityDate}
                  onChange={(date) => setActivityDate(date)}
                  onClose={() => setShowCal(false)}
                  labelText="Activity Date"
                />
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">Category</div>
                <div className="inner-field-val">Theme Parks</div>
                <div className="inner-field-sub">All activities</div>
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Travellers</div>
                <div className="inner-field-val">2 <span className="unit-suffix">Adults</span></div>
                <div className="inner-field-sub">General pass</div>
              </div>
              <SearchButton onClick={() => comingSoonToast(toast, "Tours & activities")} />
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['All Attractions', 'Theme Parks', 'Museums & Galleries', 'Adventure Sports', 'City Sightseeing'].map((chip) => (
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

      {/* Recommended Tours Stack Section */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Top Rated Global Attractions</h2>
            <p className="inner-sec-subtitle">Book online to secure your guaranteed entry slots and instant vouchers</p>
          </div>
        </div>

        <div className="cabs-list-stack">
          {TOURS.map((tour, idx) => (
            <div key={tour.title} className="cab-result-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="cab-card-img" style={{ backgroundImage: `url(${tour.img})` }} />
              <div className="cab-card-body">
                <div className="cab-badge-row">
                  <span className="cab-icon">🎟️</span>
                  <span className="cab-rating">★ {tour.rating}</span>
                </div>
                <h3>{tour.title}</h3>
                <p className="cab-type">{tour.category}</p>
                <p className="cab-desc" style={{ marginBottom: 6 }}>📍 {tour.loc}</p>
                <p className="cab-desc">{tour.desc}</p>
              </div>
              <div className="cab-card-price-action">
                <div className="price-box">
                  <span className="old-price">₹{tour.oldPrice}</span>
                  <span className="price">₹{tour.price}</span>
                  <small>Instant Voucher</small>
                </div>
                <button onClick={() => comingSoonToast(toast, "Tours & activities")}>
                  BOOK TICKETS
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
