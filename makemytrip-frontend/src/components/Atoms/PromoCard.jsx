import React from 'react'
import '../../styles/Sections.css'

export default function PromoCard({
  category,
  title,
  description,
  ctaText = 'BOOK NOW',
  imageUrl,
  onClick,
  onCtaClick
}) {
  const handleCtaClick = (e) => {
    if (onCtaClick) {
      e.stopPropagation()
      onCtaClick()
    }
  }

  return (
    <div className="promo-card-container" onClick={onClick}>
      <div className="promo-card-image-wrapper">
        <img src={imageUrl} alt={title} className="promo-card-image" loading="lazy" />
      </div>
      <div className="promo-card-content">
        <div className="promo-card-meta">
          <span className="promo-card-category">{category}</span>
          <span className="promo-card-tandc">T&amp;C'S APPLY</span>
        </div>
        <h3 className="promo-card-title">{title}</h3>
        <div className="promo-card-divider" />
        <p className="promo-card-description">{description}</p>
        <button className="promo-card-cta" onClick={handleCtaClick}>
          {ctaText}
        </button>
      </div>
    </div>
  )
}
