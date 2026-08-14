import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Login from './Login'
import Signup from './Signup'
import ForgotPassword from './ForgotPassword'
import '../styles/LoginPage.css'
import { photo } from '../utils/images'

/* ── Destination cards data ── */
const DESTINATIONS = [
  {
    name: 'Maldives',
    price: 'From ₹45,000',
    badge: 'HOT',
    img: photo('dest-maldives'),
  },
  {
    name: 'Bali',
    price: 'From ₹28,000',
    badge: 'TRENDING',
    img: photo('dest-bali'),
  },
  {
    name: 'Dubai',
    price: 'From ₹22,000',
    badge: null,
    img: photo('dest-dubai'),
  },
]

/* ── Live departure board routes ── */
const DEPARTURE_ROUTES = [
  { from: 'DEL', to: 'BOM', fromCity: 'New Delhi', toCity: 'Mumbai',  flight: '6E 234',  status: 'ON TIME'  },
  { from: 'BOM', to: 'GOI', fromCity: 'Mumbai',    toCity: 'Goa',     flight: 'SG 567',  status: 'ON TIME'  },
  { from: 'MAA', to: 'DXB', fromCity: 'Chennai',   toCity: 'Dubai',   flight: 'AI 890',  status: 'BOARDING' },
  { from: 'DEL', to: 'CDG', fromCity: 'New Delhi', toCity: 'Paris',   flight: 'UK 123',  status: 'ON TIME'  },
  { from: 'BLR', to: 'SIN', fromCity: 'Bengaluru', toCity: 'Singapore', flight: '6E 78', status: 'ON TIME'  },
]

export default function LoginPage() {
  const navigate  = useNavigate()
  const [view,     setView]     = useState('Login') // 'Login' | 'Register' | 'Forgot'
  const [routeIdx, setRouteIdx] = useState(0)

  /* Cycle departure routes every 3 s — gives the flip-board effect */
  useEffect(() => {
    const id = setInterval(() => {
      setRouteIdx(prev => (prev + 1) % DEPARTURE_ROUTES.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const route = DEPARTURE_ROUTES[routeIdx]

  return (
    <div className="login-page-wrapper">
      {/* Ambient background glows */}
      <div className="login-bg-blob-1" />
      <div className="login-bg-blob-2" />

      <div className="login-container-card" role="main">

        {/* ════════════════════════════════════════════════════
            LEFT — Cinematic Travel Visual Panel (desktop)
            ════════════════════════════════════════════════════ */}
        <div className="login-visual-panel">

          {/* Faint decorative watermark */}
          <div className="panel-watermark" aria-hidden="true">EXPLORE</div>

          {/* ─── SVG Bezier arc with animated plane dot ─── */}
          <div className="flight-arc-wrapper" aria-hidden="true">
            <svg
              className="flight-arc-svg"
              viewBox="0 0 500 64"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Dashed curved path */}
              <path
                d="M -10,58 Q 250,-22 510,58"
                fill="none"
                stroke="rgba(255,255,255,0.17)"
                strokeWidth="1.5"
                strokeDasharray="7 13"
              />

              {/* Origin dot */}
              <circle cx="0"   cy="58" r="3.5" fill="rgba(255,255,255,0.45)" />
              {/* Destination dot */}
              <circle cx="500" cy="58" r="3.5" fill="rgba(255,179,71,0.75)"  />

              {/* Outer glow halo that follows the plane */}
              <circle r="11" fill="rgba(255,179,71,0.14)">
                <animateMotion
                  dur="6s"
                  repeatCount="indefinite"
                  path="M -10,58 Q 250,-22 510,58"
                  rotate="auto"
                />
              </circle>

              {/* Animated aeroplane icon from user URL */}
              <g filter="url(#glow)">
                <image
                  href="https://icons.veryicon.com/png/o/leisure/vajra-district_-tourism/flight-18.png"
                  x="-16"
                  y="-16"
                  width="32"
                  height="32"
                  transform="rotate(45)"
                />
                <animateMotion
                  dur="6s"
                  repeatCount="indefinite"
                  path="M -10,58 Q 250,-22 510,58"
                  rotate="auto"
                />
              </g>

              {/* Glow filter for the plane dot */}
              <defs>
                <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </div>

          {/* ─── Brand logo ─── */}
          <div className="visual-brand" onClick={() => navigate('/')}>
            <div className="brand-circle">m</div>
            <span className="brand-text">
              make<span className="brand-trip">my</span>trip
            </span>
          </div>

          {/* ─── Editorial hero content ─── */}
          <div className="visual-promo-content">

            {/* Pulsing live badge */}
            <div className="dest-badge">
              <span className="dest-badge-dot" />
              Live · 500+ Airlines · 1,000+ Destinations
            </div>

            {/* Headline */}
            <h2 className="visual-promo-heading">
              Every Great<br />
              Journey Starts<br />
              With a Search.
            </h2>

            <p className="visual-promo-desc">
              From tropical beaches to iconic skylines — your perfect trip is
              one tap away. Members unlock deals others simply can't access.
            </p>

            {/* ─── Live departure board ─── */}
            <div className="departure-board">
              <div className="departure-board-header">
                <span>✈</span>
                <span>Live Departures</span>
              </div>
              <div className="departure-board-body">
                {/* key={routeIdx} forces remount → triggers flip-in CSS animation */}
                <div className="departure-row" key={routeIdx}>
                  <div>
                    <span className="dep-route">
                      {route.from} → {route.to}
                    </span>
                    <span className="dep-airport">
                      {route.fromCity} to {route.toCity}
                    </span>
                  </div>
                  <div className="dep-right">
                    <span className="dep-flight">{route.flight}</span>
                    <span className={`dep-status${route.status === 'BOARDING' ? ' boarding' : ''}`}>
                      {route.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Destination photo cards ─── */}
            <div className="dest-cards-row">
              {DESTINATIONS.map((dest) => (
                <div
                  key={dest.name}
                  className="dest-card"
                  style={{ backgroundImage: `url(${dest.img})` }}
                  title={`Fly to ${dest.name}`}
                >
                  {dest.badge && (
                    <span
                      className={`dest-card-badge${dest.badge === 'TRENDING' ? ' trending' : ''}`}
                    >
                      {dest.badge}
                    </span>
                  )}
                  <div className="dest-card-info">
                    <span className="dest-card-name">{dest.name}</span>
                    <span className="dest-card-price">{dest.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Stats strip ─── */}
          <div className="visual-stats-strip">
            <div className="stat-item">
              <span className="stat-num">50M+</span>
              <span className="stat-label">Travelers</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">500+</span>
              <span className="stat-label">Airlines</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">1000+</span>
              <span className="stat-label">Destinations</span>
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════
            MOBILE — compact beach strip header (≤ 900px)
            ════════════════════════════════════════════════════ */}
        <div className="login-mobile-hero">
          <div className="mobile-flight-strip">
            <div className="flight-path-line" />
            <div className="flight-plane-icon">✈</div>
          </div>
          <div className="mobile-hero-brand">
            <div className="brand-circle">m</div>
            <span className="brand-text" style={{ color: '#fff' }}>
              make<span className="brand-trip">my</span>trip
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            RIGHT — Authentication Form Panel
            ════════════════════════════════════════════════════ */}
        <div className="login-form-panel">

          {/* Gradient accent bar */}
          <div className="form-accent-bar" />

          {/* Dynamic title & subtitle */}
          <div className="form-header-box">
            <h1 className="form-main-title">
              {view === 'Login'    && 'Welcome Back ✈'}
              {view === 'Register' && 'Join TripOra 🌍'}
              {view === 'Forgot'   && 'Reset Password 🔑'}
            </h1>
            <p className="form-sub-title">
              {view === 'Login'    && 'Sign in to unlock exclusive travel deals & your bookings'}
              {view === 'Register' && 'Create your free account and start exploring the world'}
              {view === 'Forgot'   && 'Verify your email to securely reset your credentials'}
            </p>
          </div>

          {/* Sign In / Register tab toggle */}
          {view !== 'Forgot' && (
            <div className="login-tabs-container" role="tablist">
              <button
                role="tab"
                aria-selected={view === 'Login'}
                className={`login-tab-btn ${view === 'Login' ? 'active' : ''}`}
                onClick={() => setView('Login')}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={view === 'Register'}
                className={`login-tab-btn ${view === 'Register' ? 'active' : ''}`}
                onClick={() => setView('Register')}
              >
                Register
              </button>
            </div>
          )}

          {/* Auth sub-components — logic completely unchanged */}
          {view === 'Login' && (
            <Login
              onSwitchTab={(target) => setView(target)}
              onForgotPassword={() => setView('Forgot')}
            />
          )}
          {view === 'Register' && (
            <Signup onSwitchTab={(target) => setView(target)} />
          )}
          {view === 'Forgot' && (
            <ForgotPassword onBackToLogin={() => setView('Login')} />
          )}

          {/* Secure encrypted badge */}
          <div className="form-secure-badge">
            🔒 256-bit SSL Encrypted · Secured by TripOra
          </div>

          {/* Legal */}
          <p className="form-legal-notice">
            By continuing, you agree to TripOra's{' '}
            <span className="legal-highlight-link">Terms of Use</span> and{' '}
            <span className="legal-highlight-link">Privacy Policy</span>.
          </p>

        </div>
      </div>
    </div>
  )
}
