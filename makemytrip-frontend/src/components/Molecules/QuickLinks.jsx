import React from 'react'
import { QUICK_LINKS } from '../../data/homepageData'
import '../../styles/Hero.css'

export default function QuickLinks() {
  return (
    <div className="quicklinks-bar">
      <div className="quicklinks-inner">
        {QUICK_LINKS.map((q) => (
          <div key={q.title} className="quick-pill">
            <span className="qp-icon">{q.icon}</span>
            <div className="qp-text">
              <span className="qp-title">
                {q.title}
                {q.isNew && <span className="qp-new">new</span>}
              </span>
              {q.sub && <span className="qp-sub">{q.sub}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
