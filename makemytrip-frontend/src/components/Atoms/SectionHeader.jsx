import React from 'react'
import '../../styles/Sections.css'

export default function SectionHeader({
  title,
  tabs,
  activeTab,
  onTabChange,
  viewAllText,
  onViewAll,
  onPrev,
  onNext
}) {
  return (
    <div className="section-header-container">
      <div className="section-header-left">
        <h2 className="section-header-title">{title}</h2>
        {tabs && tabs.length > 0 && (
          <div className="section-header-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`section-header-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => onTabChange && onTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="section-header-right">
        {viewAllText && (
          <span className="section-header-viewall" onClick={onViewAll}>
            {viewAllText} <span className="arrow-icon">→</span>
          </span>
        )}
        {(onPrev || onNext) && (
          <div className="section-header-nav">
            {onPrev && <button className="section-header-nav-btn" onClick={onPrev}>‹</button>}
            {onNext && <button className="section-header-nav-btn" onClick={onNext}>›</button>}
          </div>
        )}
      </div>
    </div>
  )
}
