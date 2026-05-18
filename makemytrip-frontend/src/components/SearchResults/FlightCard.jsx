import React from 'react'
import '../../styles/search-results.css'

export default function FlightCard({ flight, onSelect }) {
  const departureTime = flight.departure || flight.departureTime || flight.depart_time
  const arrivalTime = flight.arrival || flight.arrivalTime || flight.arrival_time
  const duration = flight.duration
  const price = parseFloat(flight.price)
  const stops = flight.stops || 0
  const airline = flight.airline || flight.operatorName || 'Flight'

  const formatPrice = (p) => {
    return `₹${p.toLocaleString('en-IN')}`
  }

  const getBadge = (provider) => {
    const badges = {
      amadeus: { text: 'Amadeus', color: 'hsl(var(--p))' },
      skyscanner: { text: 'Skyscanner', color: 'hsl(var(--wa))' },
      mock: { text: 'Best Price', color: 'hsl(var(--su))' }
    }
    return badges[provider] || { text: provider, color: 'hsl(var(--bc) / 0.6)' }
  }

  const badge = getBadge(flight.provider)

  return (
    <div className="flight-card">
      <div className="flight-header">
        <div className="flight-airline">
          <div className="airline-icon">✈️</div>
          <div className="airline-info">
            <div className="airline-name">{airline}</div>
            <div className="flight-code">{flight.airlineCode || '—'}</div>
          </div>
        </div>

        <div className="flight-times">
          <div className="flight-leg">
            <div className="time">{departureTime}</div>
            <div className="code">{flight.from || 'From'}</div>
          </div>

          <div className="flight-duration">
            <div className="duration-text">{duration || '2h 30m'}</div>
            <div className="stops-info">
              {stops === 0 ? (
                <span className="direct-badge">Direct</span>
              ) : (
                <span>{stops} Stop{stops > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          <div className="flight-leg">
            <div className="time">{arrivalTime}</div>
            <div className="code">{flight.to || 'To'}</div>
          </div>
        </div>

        <div className="flight-price-section">
          <div className="flight-price">{formatPrice(price)}</div>
          <div className="seats-left">
            {flight.seats && flight.seats > 0 ? (
              <span>{flight.seats} seats</span>
            ) : (
              <span>Limited</span>
            )}
          </div>
        </div>
      </div>

      <div className="flight-footer">
        <div className="flight-meta">
          {flight.rating && (
            <span className="rating">
              ★ {parseFloat(flight.rating).toFixed(1)}
            </span>
          )}
          <span className="provider-badge" style={{ backgroundColor: badge.color }}>
            {badge.text}
          </span>
        </div>

        <button
          className="flight-select-btn"
          onClick={() => onSelect?.(flight)}
        >
          Select
        </button>
      </div>
    </div>
  )
}
