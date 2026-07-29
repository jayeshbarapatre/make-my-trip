import '../../styles/search-results.css'

export default function BusCard({ bus, onSelect }) {
  const price = parseFloat(bus.price)
  const departure = bus.departure || bus.departureTime || '—'
  const arrival = bus.arrival || bus.arrivalTime || '—'
  const duration = bus.duration || '—'
  const seats = bus.seats || 0
  const rating = bus.rating || 0
  const amenities = bus.amenities || []

  const formatPrice = (p) => {
    return `₹${p.toLocaleString('en-IN')}`
  }

  const getBadge = (provider) => {
    const badges = {
      goibibo: { text: 'GoIbibo', color: 'hsl(var(--wa))' },
      '12go': { text: '12Go', color: 'hsl(var(--su))' },
      mock: { text: 'Featured', color: 'hsl(var(--su))' }
    }
    return badges[provider] || { text: provider, color: 'hsl(var(--bc) / 0.6)' }
  }

  const badge = getBadge(bus.provider)

  return (
    <div className="bus-card">
      <div className="bus-header">
        <div className="bus-operator">
          <div className="bus-icon">🚌</div>
          <div>
            <h4>{bus.operator || 'Bus Service'}</h4>
            <div className="bus-type">{bus.busType || 'Seater'}</div>
          </div>
        </div>

        <span className="provider-badge" style={{ backgroundColor: badge.color }}>
          {badge.text}
        </span>
      </div>

      <div className="bus-times">
        <div className="time-leg">
          <div className="time-value">{departure}</div>
          <div className="time-label">Departure</div>
        </div>

        <div className="bus-duration">
          <div className="duration">{duration}</div>
          {seats > 0 && <div className="seats-available">{seats} seats</div>}
        </div>

        <div className="time-leg">
          <div className="time-value">{arrival}</div>
          <div className="time-label">Arrival</div>
        </div>
      </div>

      <div className="bus-amenities">
        {amenities.length > 0 ? (
          amenities.slice(0, 4).map((amenity, idx) => (
            <span key={idx} className="amenity-icon" title={amenity}>
              {amenity}
            </span>
          ))
        ) : (
          <span className="amenity-icon">Standard Service</span>
        )}
      </div>

      <div className="bus-footer">
        <div className="bus-meta">
          {rating > 0 && (
            <span className="rating">★ {rating.toFixed(1)}</span>
          )}
        </div>

        <div className="bus-price">{formatPrice(price)}</div>

        <button
          className="bus-select-btn"
          onClick={() => onSelect?.(bus)}
        >
          Select Seat
        </button>
      </div>
    </div>
  )
}
