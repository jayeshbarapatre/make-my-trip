import React, { useState } from 'react'
import '../../styles/search-results.css'

export default function HotelCard({ hotel, onSelect }) {
  const [imageError, setImageError] = useState(false)

  const price = parseFloat(hotel.price)
  const nights = hotel.nights || 1
  const pricePerNight = hotel.pricePerNight || Math.round(price / nights)
  const rating = hotel.rating
  const reviewCount = hotel.reviewCount || 0
  const amenities = hotel.amenities || []

  const formatPrice = (p) => {
    return `₹${p.toLocaleString('en-IN')}`
  }

  const getBadge = (provider) => {
    const badges = {
      booking: { text: 'Booking.com', color: 'hsl(var(--p))' },
      agoda: { text: 'Agoda', color: 'hsl(var(--wa))' },
      expedia: { text: 'Expedia', color: 'hsl(var(--b2))' },
      mock: { text: 'Featured', color: 'hsl(var(--su))' }
    }
    return badges[provider] || { text: provider, color: 'hsl(var(--bc) / 0.6)' }
  }

  const badge = getBadge(hotel.provider)
  const img = hotel.image || `https://images.unsplash.com/photo-1445631867551-0dbf667ef51f?auto=format&fit=crop&w=500&h=350&q=80`

  return (
    <div className="hotel-card">
      <div className="hotel-image-wrapper">
        {!imageError ? (
          <img
            src={img}
            alt={hotel.name}
            className="hotel-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="hotel-image-placeholder">🏨</div>
        )}
        <span className="hotel-provider-badge" style={{ backgroundColor: badge.color }}>
          {badge.text}
        </span>
        {hotel.roomsLeft && (
          <span className="rooms-left">
            {hotel.roomsLeft === 1 ? '⚡ Last room!' : `${hotel.roomsLeft} left`}
          </span>
        )}
      </div>

      <div className="hotel-body">
        <h4 className="hotel-name">{hotel.name}</h4>
        <div className="hotel-location">{hotel.location || hotel.destination || 'Destination'}</div>

        <div className="hotel-rating">
          {rating && (
            <>
              <span className="rating-stars">
                {'★'.repeat(Math.floor(rating))}
              </span>
              <span className="rating-value">{rating.toFixed(1)}</span>
              {reviewCount > 0 && (
                <span className="review-count">({reviewCount} reviews)</span>
              )}
            </>
          )}
        </div>

        {amenities.length > 0 && (
          <div className="hotel-amenities">
            {amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="amenity-tag">{amenity}</span>
            ))}
            {amenities.length > 3 && (
              <span className="amenity-more">+{amenities.length - 3} more</span>
            )}
          </div>
        )}

        <div className="hotel-pricing">
          <div className="price-breakdown">
            <div className="per-night">
              <span className="label">₹{pricePerNight.toLocaleString('en-IN')}</span>
              <span className="unit">/night</span>
            </div>
            {nights > 1 && (
              <div className="total-nights">
                <span className="label">×{nights}</span>
                <span className="unit">nights</span>
              </div>
            )}
          </div>
          <div className="total-price">{formatPrice(price)}</div>
        </div>

        <button
          className="hotel-select-btn"
          onClick={() => onSelect?.(hotel)}
        >
          View & Book
        </button>
      </div>
    </div>
  )
}
