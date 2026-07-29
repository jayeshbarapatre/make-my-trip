import { useState } from 'react'
import { downloadTicketPDF } from '../utils/pdfGenerator'

export default function BookingDetailsModal({ booking, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  const isFlight = booking.type === 'flight'
  const isHotel = booking.type === 'hotel'
  const _isTrain = booking.type === 'train'
  const _isBus = booking.type === 'bus'
  const _isCab = booking.type === 'cab'

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    setDownloadError(null)
    try {
      await downloadTicketPDF(booking)
    } catch (error) {
      setDownloadError('Failed to download PDF. Please try again.')
      console.error('PDF download error:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A'
    if (timeStr.includes(':')) return timeStr
    return timeStr
  }

  const renderFlightDetails = () => (
    <>
      {/* Airline & Flight Info */}
      {booking.airlineName && (
        <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Airline Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Airline Name</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.airlineName}</div>
            </div>
            {booking.flightNumber && (
              <div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Flight Number</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.flightNumber}</div>
              </div>
            )}
            {booking.airlineCode && (
              <div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Airline Code</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.airlineCode}</div>
              </div>
            )}
            {booking.aircraft && (
              <div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Aircraft</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.aircraft}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Departure & Arrival */}
      <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Journey Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Departure City</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.fromCity}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Arrival City</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.toCity}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Departure</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.departureDate)}</div>
            <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.7)', marginTop: '4px' }}>{formatTime(booking.departureTime)}</div>
          </div>
          {booking.returnDate && (
            <div>
              <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Return</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.returnDate)}</div>
              <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.7)', marginTop: '4px' }}>{formatTime(booking.arrivalTime)}</div>
            </div>
          )}
        </div>

        {booking.departureAirport && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Departure Airport</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.departureAirport}</div>
            </div>
            {booking.arrivalAirport && (
              <div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Arrival Airport</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.arrivalAirport}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flight Class & Stops */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'hsl(var(--b2))', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
        {booking.cabinClass && (
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Cabin Class</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.cabinClass}</div>
          </div>
        )}
        {booking.stops !== undefined && (
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Stops</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
              {booking.stops === 0 ? 'Non-stop' : `${booking.stops} Stop${booking.stops > 1 ? 's' : ''}`}
            </div>
          </div>
        )}
      </div>
    </>
  )

  const renderHotelDetails = () => (
    <>
      {/* Hotel Info */}
      <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Hotel Details</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Property Name</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.fromCity}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>City</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.toCity}</div>
          </div>
        </div>
      </div>

      {/* Check-in & Check-out */}
      <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Stay Dates</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Check-in</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.departureDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Check-out</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.returnDate)}</div>
          </div>
        </div>
        {booking.travellers?.nights && (
          <div style={{ marginTop: '12px', color: 'hsl(var(--bc) / 0.7)', fontSize: '13px' }}>
            {booking.travellers.nights} Night{booking.travellers.nights > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  )

  const renderPassengerDetails = () => {
    if (!booking.passengers && !booking.travellers) return null

    const passengers = booking.passengers || (Array.isArray(booking.travellers) ? booking.travellers : [])
    if (passengers.length === 0) return null

    return (
      <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Passenger Details</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {passengers.map((passenger, idx) => (
            <div key={idx} style={{ padding: '12px', background: 'hsl(var(--b1))', borderRadius: '6px', borderLeft: '3px solid hsl(var(--p))' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Name</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
                    {passenger.firstName} {passenger.lastName}
                  </div>
                </div>
                {passenger.age && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Age</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{passenger.age}</div>
                  </div>
                )}
              </div>
              {passenger.gender && (
                <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.7))' }}>Gender: {passenger.gender}</div>
              )}
              {passenger.seatNumber && (
                <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.7)' }}>Seat: {passenger.seatNumber}</div>
              )}
              {passenger.mealPreference && (
                <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.7)' }}>Meal: {passenger.mealPreference}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderFareDetails = () => (
    <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Fare Breakdown</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {booking.baseFare > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>Base Fare</span>
            <span style={{ fontWeight: 600 }}>₹{booking.baseFare.toLocaleString()}</span>
          </div>
        )}
        {booking.taxes > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>Taxes & Fees</span>
            <span style={{ fontWeight: 600 }}>₹{booking.taxes.toLocaleString()}</span>
          </div>
        )}
        {booking.convenience > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>Convenience Fee</span>
            <span style={{ fontWeight: 600 }}>₹{booking.convenience.toLocaleString()}</span>
          </div>
        )}
        {booking.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'hsl(var(--su))' }}>
            <span>Discount</span>
            <span style={{ fontWeight: 600 }}>-₹{booking.discount.toLocaleString()}</span>
          </div>
        )}
        {booking.couponCode && (
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', marginTop: '4px' }}>Coupon: {booking.couponCode}</div>
        )}
        {booking.gst > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>GST</span>
            <span style={{ fontWeight: 600 }}>₹{booking.gst.toLocaleString()}</span>
          </div>
        )}
        <div style={{ borderTop: '1px solid hsl(var(--b3))', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700 }}>
          <span>Total</span>
          <span style={{ color: 'hsl(var(--p))' }}>₹{booking.totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )

  const renderPaymentDetails = () => (
    <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Payment Information</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {booking.paymentMethod && (
          <div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Payment Method</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
              {booking.paymentMethod.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Payment Status</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: booking.paymentStatus === 'completed' ? 'hsl(var(--su))' : 'hsl(var(--wa))' }}>
            {booking.paymentStatus?.toUpperCase() || 'COMPLETED'}
          </div>
        </div>
      </div>
      {booking.transactionId && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'hsl(var(--bc) / 0.6))' }}>
          Transaction ID: <strong>{booking.transactionId}</strong>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
      <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: 'hsl(var(--b2))', borderBottom: '1px solid hsl(var(--b3))', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Booking Details</h3>
            <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55))' }}>
              ID: {booking.bookingId} | PNR: {booking.pnr}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--bc))', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {/* Booking Status */}
          <div style={{ background: 'hsl(var(--su) / 0.08)', border: '1px solid hsl(var(--su) / 0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>Booking Status</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--su))' }}>{booking.status?.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)' }}>
              Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN')}
            </div>
          </div>

          {/* Type-specific details */}
          {isFlight && renderFlightDetails()}
          {isHotel && renderHotelDetails()}

          {/* Passenger Details */}
          {renderPassengerDetails()}

          {/* Fare Breakdown */}
          {renderFareDetails()}

          {/* Payment Information */}
          {renderPaymentDetails()}
        </div>

        {/* Footer */}
        <div style={{ background: 'hsl(var(--b2))', borderTop: '1px solid hsl(var(--b3))', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.6))' }}>
            Need help? <strong>support@makemytrip.com</strong>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{
              background: isDownloading ? 'hsl(var(--b3))' : 'hsl(var(--p))',
              color: 'hsl(var(--pc))',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              opacity: isDownloading ? 0.6 : 1
            }}
          >
            {isDownloading ? '⏳ Generating...' : '📥 Download PDF'}
          </button>
        </div>

        {downloadError && (
          <div style={{ background: 'hsl(var(--er) / 0.1)', color: 'hsl(var(--er))', padding: '12px 24px', fontSize: '13px', textAlign: 'center' }}>
            {downloadError}
          </div>
        )}
      </div>
    </div>
  )
}
