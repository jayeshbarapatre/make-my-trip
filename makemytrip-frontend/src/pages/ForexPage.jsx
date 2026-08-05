import { useState } from 'react'
import ComingSoon from '../components/ComingSoon'
import { comingSoonToast } from '../utils/comingSoon'
import { useToastContext } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { SERVICE_TABS } from '../data/homepageData'
import TabIcon from '../components/TabIcon'
import '../styles/Hero.css'

export default function ForexPage() {
  const navigate = useNavigate()
  const toast = useToastContext()
  const [activeTab, setActiveTab] = useState('forex')
  const [inrAmount, setInrAmount] = useState('50,000')
  const [usdAmount, setUsdAmount] = useState('600')

  const CARDS = [
    {
      name: 'MMT Multi-Currency Forex Card',
      desc: 'Zero markup rates, universally accepted across 150+ countries. Backed by ICICI Bank security.',
      features: '🔒 Instant lock/unlock via App · 💸 Zero cash withdrawal fees · 📱 Instant balance check',
      fee: 'Free (Waived off for summer travellers)',
      badge: 'RECOMMENDED'
    },
    {
      name: 'Physical Currency Notes Home Delivery',
      desc: 'Get genuine currency notes delivered safely at your doorstep within 24 hours of booking.',
      features: '🛵 Secure courier delivery · 📄 Legal certificate issued · 💵 Multiple denominations',
      fee: 'Flat ₹99 shipping fee'
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
      <header className="phero forex">
        <div className="phero-inner">
          
          {/* Breadcrumbs */}
          <div className="crumb-container">
            <span className="crumb-link" onClick={() => navigate('/')}>Home</span>
            <span className="crumb-sep">›</span>
            <span className="crumb-cur">Forex Card &amp; Cash</span>
          </div>
          <ComingSoon vertical="Forex" blurb="Rates shown are indicative. We are not selling currency or cards yet." ctaPath="/" ctaLabel="Browse flights" />
          <h1>Multi-Currency Forex Cards &amp; Cash</h1>
          <p style={{ fontWeight: 600, marginBottom: 28 }}>Best Exchange Rates Guaranteed · Same-Day Doorstep Delivery</p>

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
            <div className="inner-search-grid cabs-grid" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr auto' }}>
              <div className="inner-search-field">
                <div className="inner-field-lbl">I Need Currency for</div>
                <div className="inner-field-val">United States (USD)</div>
                <div className="inner-field-sub">US Dollar</div>
              </div>
              <div className="inner-search-field">
                <div className="inner-field-lbl">You Pay (INR)</div>
                <input 
                  type="text" 
                  className="inner-field-val" 
                  value={inrAmount} 
                  style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontWeight: 800, color: 'inherit' }}
                  onChange={(e) => {
                    setInrAmount(e.target.value)
                    setUsdAmount(Math.round(parseFloat(e.target.value.replace(/,/g,'')) / 83.5 || 0))
                  }}
                />
                <div className="inner-field-sub">Exchange Rate: 1 USD = ₹83.50</div>
              </div>
              <div className="inner-search-field" style={{ borderRight: 'none' }}>
                <div className="inner-field-lbl">You Get (USD)</div>
                <div className="inner-field-val">${usdAmount}</div>
                <div className="inner-field-sub">In Forex Card or Cash</div>
              </div>
              <button className="inner-search-cta" onClick={() => comingSoonToast(toast, "Forex")}>
                GET FOREX NOW
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Forex Options List */}
      <section className="inner-page-section">
        <div className="inner-sec-header">
          <div>
            <h2 className="inner-sec-title">Recommended Forex Card &amp; Cash Options</h2>
            <p className="inner-sec-subtitle">Lock in your rates today to protect your travel funds from currency fluctuations</p>
          </div>
        </div>

        <div className="cabs-list-stack">
          {CARDS.map((card, idx) => (
            <div key={card.name} className="cab-result-card" style={{ gridTemplateColumns: '1fr auto' }} data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="cab-card-body">
                <div className="cab-badge-row">
                  <span className="cab-icon">💳</span>
                  {card.badge && <span className="cab-rating" style={{ background: 'hsl(var(--wa) / 0.6)', color: '#111' }}>{card.badge}</span>}
                </div>
                <h3>{card.name}</h3>
                <p className="cab-desc" style={{ fontSize: 14, marginBottom: 8 }}>{card.desc}</p>
                <p className="cab-desc" style={{ color: 'hsl(var(--su))', fontWeight: 600 }}>{card.features}</p>
              </div>
              <div className="cab-card-price-action">
                <div className="price-box">
                  <span className="price">{card.fee}</span>
                  <small>Zero Hidden Issuance Charges</small>
                </div>
                <button onClick={() => comingSoonToast(toast, "Forex")}>
                  APPLY NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
