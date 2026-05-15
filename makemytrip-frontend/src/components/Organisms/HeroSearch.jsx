import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCriteria } from '../../store/reducers/searchReducer'
import { logout } from '../../store/reducers/authReducer'
import { SERVICE_TABS, SPECIAL_FARES } from '../../data/homepageData'
import '../../styles/Hero.css'

export default function HeroSearch() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)

  const depInputRef = useRef(null)
  const retInputRef = useRef(null)

  const openPicker = (inputRef) => {
    if (inputRef.current) {
      try {
        inputRef.current.showPicker()
      } catch (err) {
        inputRef.current.click()
      }
    }
  }

  const [tripType, setTripType] = useState('one-way')
  const [activeTab, setActiveTab] = useState('flights')
  const [activeFare, setActiveFare] = useState('regular')
  const [form, setForm] = useState({ 
    from: 'Delhi', 
    to: 'Bengaluru', 
    date: '', 
    returnDate: '', 
    passengers: 1 
  })

  const TODAY = new Date().toISOString().slice(0, 10)

  const swap = () => setForm((f) => ({ ...f, from: f.to, to: f.from }))

  const fmtDate = (iso) => {
    if (!iso) return null
    const d = new Date(iso)
    return {
      day: d.getDate(),
      mon: d.toLocaleString('en-IN', { month: 'short' }) + "'" + String(d.getFullYear()).slice(-2),
      week: d.toLocaleString('en-IN', { weekday: 'long' }),
    }
  }

  const dep = fmtDate(form.date)
  const ret = fmtDate(form.returnDate)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!form.date) return alert('Please select a departure date')
    dispatch(setCriteria(form))
    navigate(`/flights/results?from=${form.from}&to=${form.to}&date=${form.date}&passengers=${form.passengers}`)
  }

  return (
    <div className="hero-bg" style={{ paddingTop: '20px' }}>
      <div className="hero-card-wrap">
        <div className="hero-card">
          {/* Service Navigation Tabs */}
          <div className="service-tabs">
            {SERVICE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`service-tab${activeTab === t.id ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab(t.id)
                  if (t.id === 'hotels') navigate('/hotels')
                  if (t.id === 'villas') navigate('/homestays')
                  if (t.id === 'trains') navigate('/trains')
                  if (t.id === 'holidays') navigate('/holidays')
                  if (t.id === 'cabs') navigate('/cabs')
                  if (t.id === 'buses') navigate('/buses')
                  if (t.id === 'cruise') navigate('/cruise')
                  if (t.id === 'forex') navigate('/forex')
                  if (t.id === 'insurance') navigate('/insurance')
                }}
              >
                {t.isNew && <span className="tab-new">new</span>}
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-lbl" style={{ whiteSpace: 'pre-line' }}>{t.label}</span>
                {activeTab === t.id && <div className="tab-bar" />}
              </button>
            ))}
          </div>

          {/* AI Travel Assistant Promo */}
          <div className="ai-banner">
            <span className="ai-icon">🤖</span>
            <span className="ai-text">
              Try <strong>myna<sup style={{ fontSize: 8 }}>beta</sup></strong>&nbsp;&nbsp;Your AI Assistant for Flights &amp; Stays
            </span>
            <span className="ai-arrow">→</span>
          </div>

          <form onSubmit={handleSearch} className="search-form-element">
            {/* Trip selector */}
            <div className="trip-type-row">
              {[['one-way', 'One Way'], ['round-trip', 'Round Trip'], ['multi-city', 'Multi City']].map(([v, l]) => (
                <label key={v} className="trip-radio">
                  <input
                    type="radio"
                    name="trip"
                    value={v}
                    checked={tripType === v}
                    onChange={() => setTripType(v)}
                  />
                  <span className="custom-radio" />
                  {l}
                </label>
              ))}
              <div className="trip-intl">Book International and Domestic Flights</div>
            </div>

            {/* Fields Grid */}
            <div className="search-inputs">
              {/* FROM field */}
              <div className="input-cell from-cell">
                <div className="input-lbl">From</div>
                <input
                  type="text"
                  className="input-city-field"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  required
                />
                <div className="input-sub">DEL, {form.from} Airport India</div>
              </div>

              {/* SWAP button */}
              <button type="button" className="swap-btn" onClick={swap} title="Swap Cities">
                ⇄
              </button>

              {/* TO field */}
              <div className="input-cell to-cell">
                <div className="input-lbl">To</div>
                <input
                  type="text"
                  className="input-city-field"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  required
                />
                <div className="input-sub">BLR, {form.to} International Airport India</div>
              </div>

              <div className="input-divider" />

              {/* DEPARTURE date */}
              <div className="input-cell date-cell" onClick={() => openPicker(depInputRef)}>
                <div className="input-lbl">Departure <span className="lbl-arrow">▾</span></div>
                {dep ? (
                  <div className="input-value date-val">
                    {dep.day} {dep.mon}
                    <span className="weekday-lbl">{dep.week}</span>
                  </div>
                ) : (
                  <div className="input-value date-val placeholder">Select Date</div>
                )}
                <input
                  ref={depInputRef}
                  type="date"
                  value={form.date}
                  min={TODAY}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div className="input-divider" />

              {/* RETURN date */}
              <div 
                className="input-cell date-cell" 
                style={{ opacity: tripType === 'one-way' ? 0.55 : 1 }}
                onClick={() => tripType !== 'one-way' && openPicker(retInputRef)}
              >
                <div className="input-lbl">Return <span className="lbl-arrow">▾</span></div>
                {ret && tripType !== 'one-way' ? (
                  <div className="input-value date-val">
                    {ret.day} {ret.mon}
                    <span className="weekday-lbl">{ret.week}</span>
                  </div>
                ) : (
                  <div className="input-sub muted">Tap to add a return<br />date for bigger discounts</div>
                )}
                <input
                  ref={retInputRef}
                  type="date"
                  value={form.returnDate}
                  min={form.date || TODAY}
                  disabled={tripType === 'one-way'}
                  onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                />
              </div>

              <div className="input-divider" />

              {/* TRAVELLERS count */}
              <div className="input-cell count-cell">
                <div className="input-lbl">Travellers &amp; Class <span className="lbl-arrow">▾</span></div>
                <div className="input-value count-val">
                  <span className="cnt">{form.passengers}</span>
                  <span className="cls">Traveller{form.passengers > 1 ? 's' : ''}</span>
                </div>
                <div className="input-sub">Economy/Premium Economy</div>
                {/* Numeric selector overlay on hover/click can be managed or simple numeric input */}
                <input
                  type="number"
                  min="1"
                  max="9"
                  className="hidden-passengers-input"
                  value={form.passengers}
                  onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Special Fares */}
            <div className="fares-row">
              <div className="fares-label">
                SPECIAL<br />FARES:
              </div>
              <div className="fares-chips">
                {SPECIAL_FARES.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`fare-chip${activeFare === f.id ? ' active' : ''}`}
                    onClick={() => setActiveFare(f.id)}
                  >
                    <span className="fare-lbl-txt">
                      {f.label}
                      {f.isNew && <span className="fare-new">NEW</span>}
                    </span>
                    <span className="fare-sub">{f.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ancillary Services */}
            <div className="tools-row">
              <button type="button" className="tool-btn">
                <span className="tool-badge">10% off</span>
                🛫 Flight Tracker
              </button>
              <button type="button" className="tool-btn">
                🛍️ Shop Duty Free
              </button>
            </div>

            {/* Centered SEARCH button */}
            <div className="search-btn-wrap">
              <button type="submit" className="search-btn-main btn-primary">
                SEARCH
              </button>
            </div>
          </form>
        </div>

        {/* Scroll cues */}
        <div className="explore-more">
          <span className="chevron-icon">▾</span>
          Explore More Sections
          <span className="chevron-icon">▾</span>
        </div>
      </div>
    </div>
  )
}
