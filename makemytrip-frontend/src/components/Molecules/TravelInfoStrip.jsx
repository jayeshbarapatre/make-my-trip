import React from 'react'
import { INFO_CARDS } from '../../data/homepageData'
import '../../styles/Sections.css'

export default function TravelInfoStrip() {
  return (
    <section className="info-section">
      <div className="info-inner">
        <div className="info-grid">
          {INFO_CARDS.map((c, i) => (
            <div key={i} className="info-card">
              <span className="info-icon">{c.icon}</span>
              <div className="info-content">
                <h4 className="info-title">{c.title}</h4>
                <p className="info-desc">{c.desc}</p>
                <span className="info-link">
                  {c.link} <span className="arrow-small">→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
