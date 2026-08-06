import { useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import { comingSoonToast } from '../utils/comingSoon'
import { useToastContext } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'
import { photo } from '../utils/images'
import SearchButton from '../components/Common/SearchButton'

export default function InsurancePage() {
  const navigate = useNavigate()
  const toast = useToastContext()
  const [activeTab, setActiveTab] = useState('insurance')
  const [activeChip, setActiveChip] = useState('Premium Protect')

  const PLANS = [
    {
      name: 'MMT Secure Platinum',
      desc: 'Top-tier international coverage. Zero deductibles, cover for flight delay, baggage loss, medical emergencies, and trip cancellation.',
      coverage: 'Medical Cover: up to $500,000',
      price: '1,250',
      oldPrice: '1,800',
      rating: '4.92 (8,450 ratings)',
      badge: 'POPULAR'
    },
    {
      name: 'Silver Explorer Protect',
      desc: 'Comprehensive entry-level medical and travel coverage preferred by students and solo travellers alike.',
      coverage: 'Medical Cover: up to $100,000',
      price: '649',
      oldPrice: '900',
      rating: '4.8 (3,210 ratings)'
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
      <header className="phero insurance">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Travel Insurance</span>
          </div>
          <ComingSoon vertical="Travel insurance" blurb="Plans shown are illustrative. No policy can be purchased here yet." ctaPath="/" ctaLabel="Browse flights" />
          <h1>Comprehensive Travel Insurance</h1>
          <p style={{ marginBottom: 28 }}>Zero Deductibles · Direct Cashless Claims Across 150+ Countries</p>

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
                <div className="inner-field-lbl">Destination Country</div>
                <div className="inner-field-val">Thailand (THA)</div>
                <div className="inner-field-sub">South East Asia</div>
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">Start Date</div>
                <div className="inner-field-val">15 <span className="unit-suffix">May '26</span></div>
                <div className="inner-field-sub">Friday</div>
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">End Date</div>
                <div className="inner-field-val">22 <span className="unit-suffix">May '26</span></div>
                <div className="inner-field-sub">Friday (7 Nights)</div>
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">Travellers count</div>
                <div className="inner-field-val">1 <span className="unit-suffix">Adult</span></div>
                <div className="inner-field-sub">Age: 25 years</div>
              </div>
              <SearchButton onClick={() => comingSoonToast(toast, "Travel insurance")} label="Get Plans" />
            </div>

            {/* Chips filters list */}
            <div className="inner-chips-row">
              {['Premium Protect', 'Student Special', 'Schengen Approved', 'Domestic Flight Delay Protection'].map((chip) => (
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

      {/* Available Plans */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Recommended Cashless Travel Insurance Plans</h2>
            <p className="inner-sec-subtitle">Underwritten by top-rated companies with round-the-clock emergency assistance lines</p>
          </div>
        </div>

        <div className="cabs-list-stack">
          {PLANS.map((plan, idx) => (
            <div key={plan.name} className="cab-result-card" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="cab-card-img" style={{ backgroundImage: `url(${photo('phero-insurance', 1280)})` }} />
              <div className="cab-card-body">
                <div className="cab-badge-row">
                  <span className="cab-icon">🛡️</span>
                  <span className="cab-rating">★ {plan.rating}</span>
                </div>
                <h3>{plan.name}</h3>
                <p className="cab-type">{plan.coverage}</p>
                <p className="cab-desc">{plan.desc}</p>
              </div>
              <div className="cab-card-price-action">
                <div className="price-box">
                  <span className="old-price">₹{plan.oldPrice}</span>
                  <span className="price">₹{plan.price}</span>
                  <small>Premium (incl GST)</small>
                </div>
                <button onClick={() => comingSoonToast(toast, "Travel insurance")}>
                  BUY POLICY
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
