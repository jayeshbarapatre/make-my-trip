import React from 'react'
import '../../styles/search-results.css'

export default function CabCard({ cab, onSelect }) {
  const price = parseFloat(cab.price)
  const rideType = cab.rideType || 'Cab'
  const duration = cab.duration || '—'
  const distance = cab.distance || '—'
  const rating = cab.rating || 0
  const seats = cab.seats || 4

  const formatPrice = (p) => {
    return `₹${p.toLocaleString('en-IN')}`
  }

  const getBadge = (provider) => {
    const badges = {
      uber: { text: 'Uber', color: 'hsl(var(--bc))' },
      ola: { text: 'Ola', color: 'hsl(var(--wa))' },
      mock: { text: 'Available', color: 'hsl(var(--su))' }
    }
    return badges[provider] || { text: provider, color: 'hsl(var(--bc) / 0.6)' }
  }

  const badge = getBadge(cab.provider)

  return (
    <div className="cab-card">
      <div className="cab-header">
        <div className="cab-type-info">
          <div className="cab-icon">
            {seats >= 6 ? '🚐' : '🚗'}
          </div>
          <div>
            <h4>{rideType}</h4>
            <div className="cab-description">{cab.description || `${seats}-seater`}</div>
          </div>
        </div>

        <span className="provider-badge" style={{ backgroundColor: badge.color, color: badge.color.includes('--wa') ? 'hsl(var(--bc))' : 'hsl(var(--bc))' }}>
          {badge.text}
        </span>
      </div>

      <div className="cab-route">
        <div className="route-item">
          <span className="label">Duration</span>
          <span className="value">{duration}</span>
        </div>

        <div className="route-divider">—</div>

        <div className="route-item">
          <span className="label">Distance</span>
          <span className="value">{distance}</span>
        </div>

        <div className="route-divider">—</div>

        <div className="route-item">
          <span className="label">Seats</span>
          <span className="value">{seats} person{seats > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="cab-footer">
        <div className="cab-rating">
          {rating > 0 && (
            <div className="rating-display">
              <span className="stars">★ {rating.toFixed(1)}</span>
              <span className="rating-label">Avg Rating</span>
            </div>
          )}
        </div>

        <div className="cab-price-section">
          <div className="estimated-price">
            <span className="label">Est. Price</span>
            <span className="price">{formatPrice(price)}</span>
          </div>

          <button
            className="cab-select-btn"
            onClick={() => onSelect?.(cab)}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}
