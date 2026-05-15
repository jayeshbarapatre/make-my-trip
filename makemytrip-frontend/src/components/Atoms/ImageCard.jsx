import React from 'react'
import '../../styles/Sections.css'

export default function ImageCard({
  title,
  subtitle,
  imageUrl,
  badge,
  borderColor,
  buttonText,
  variant = 'destination', // 'destination' | 'brand' | 'airline'
  onClick
}) {
  const cardStyle = borderColor ? { '--brand-color': borderColor } : {}

  return (
    <div 
      className={`image-card-container variant-${variant}`} 
      style={cardStyle}
      onClick={onClick}
    >
      <div className="image-card-media-wrapper">
        <img src={imageUrl} alt={title} className="image-card-img" loading="lazy" />
        {badge && <span className="image-card-badge">{badge}</span>}
      </div>
      
      <div className="image-card-info-body">
        <div className="image-card-text-container">
          <h4 className="image-card-title">{title}</h4>
          {subtitle && <p className="image-card-subtitle">{subtitle}</p>}
        </div>
        
        {buttonText && (
          <button className="image-card-action-btn">
            {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}
