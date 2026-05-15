import React from 'react'
import '../../styles/Sections.css'

export default function PromoBanner() {
  return (
    <section className="hilton-section">
      <div className="hilton-inner">
        <div className="hilton-card">
          <div className="hilton-left">
            <span className="hilton-icon">🏨</span>
            <div className="hilton-content-block">
              <h4 className="hilton-ttl">
                Stay with Hilton — The Perfect Address for Business &amp; Leisure Trips.
              </h4>
              <p className="hilton-sub">Hilton for the Stay</p>
            </div>
          </div>
          <button className="hilton-btn">EXPLORE STAYS</button>
        </div>
      </div>
    </section>
  )
}
