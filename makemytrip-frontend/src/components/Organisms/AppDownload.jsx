import { useState } from 'react'
import '../../styles/Sections.css'

export default function AppDownload() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!phoneNumber) return
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setPhoneNumber('')
      alert('Download link sent successfully!')
    }, 1500)
  }

  return (
    <section className="app-section">
      <div className="app-inner">
        <div className="app-left-content">
          <div className="app-title-wrapper">
            <span className="app-title-icon">📱</span>
            <h3 className="app-heading">Download App Now!</h3>
          </div>
          <p className="app-tagline">
            Use coupon code <strong className="highlight-yellow">WELCOMEMMT</strong> and get FLAT 25%* off on your first hotel booking.
          </p>
          
          <form onSubmit={handleSubmit} className="app-input-row">
            <div className="phone-input-container">
              <span className="country-code-badge">🇮🇳 +91</span>
              <input 
                type="tel"
                className="app-phone-input" 
                placeholder="Enter Mobile Number" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength="10"
                required
              />
            </div>
            <button type="submit" className="app-get-btn" disabled={submitted}>
              {submitted ? 'SENDING...' : 'GET APP LINK'}
            </button>
          </form>
        </div>

        <div className="app-stores-right">
          <div className="app-store-btns">
            <a href="#playstore" className="app-store-btn-link play-store">
              <span className="store-icon">▶</span>
              <div className="store-text">
                <span className="store-sub">GET IT ON</span>
                <span className="store-main">Google Play</span>
              </div>
            </a>
            <a href="#appstore" className="app-store-btn-link app-store">
              <span className="store-icon">🍎</span>
              <div className="store-text">
                <span className="store-sub">Download on the</span>
                <span className="store-main">App Store</span>
              </div>
            </a>
          </div>
          <div className="app-qr-code-wrapper">
            <div className="app-qr-box">
              {/* Representing a neat QR code scan pattern */}
              <div className="qr-aim-finder">
                <div className="qr-dot" />
              </div>
            </div>
            <div className="app-qr-caption">
              <strong>Scan QR Code</strong>
              <p>To Download iOS &amp; Android App</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
