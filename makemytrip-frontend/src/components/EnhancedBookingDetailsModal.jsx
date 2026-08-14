import { useState } from 'react'
import { downloadTicketPDF } from '../utils/pdfGenerator'

export default function EnhancedBookingDetailsModal({ booking, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  // DEBUG: Log what data modal receives
  console.log('=== MODAL RECEIVED BOOKING ===')
  console.log('Booking ID:', booking.bookingId)
  console.log('From City:', booking.fromCity)
  console.log('To City:', booking.toCity)
  console.log('Airline Name:', booking.airlineName)
  console.log('Flight Number:', booking.flightNumber)
  console.log('Base Fare:', booking.baseFare)
  console.log('Full booking object:', booking)

  const isFlight = booking.type === 'flight'
  const _isHotel = booking.type === 'hotel'
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
    if (!timeStr) return '—'
    if (timeStr.includes(':')) return timeStr
    return timeStr
  }

  // Helper to safely render passenger array
  const getTravellerInfo = () => {
    if (!booking.travellers) return null

    if (Array.isArray(booking.travellers)) {
      return booking.travellers.map((p, idx) => (
        <div key={idx} style={{ padding: '12px', background: 'hsl(var(--b1))', borderRadius: '6px', borderLeft: '3px solid hsl(var(--p))' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
            {p.firstName || p.name || `Traveller ${idx + 1}`} {p.lastName || ''}
          </div>
          {p.age && <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Age: {p.age}</div>}
          {p.gender && <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Gender: {p.gender}</div>}
        </div>
      ))
    }

    if (typeof booking.travellers === 'object') {
      const { adults, children, infants } = booking.travellers
      const _total = (adults || 0) + (children || 0) + (infants || 0)
      return (
        <div style={{ fontSize: '14px', color: 'hsl(var(--bc))' }}>
          {adults || 0} Adult{adults !== 1 ? 's' : ''}{children ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}{infants ? `, ${infants} Infant${infants !== 1 ? 's' : ''}` : ''}
        </div>
      )
    }

    return <div style={{ fontSize: '14px', color: 'hsl(var(--bc))' }}>1 Adult</div>
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
      <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxWidth: '800px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ background: 'hsl(var(--b2))', borderBottom: '1px solid hsl(var(--b3))', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Booking Details</h3>
            <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', lineHeight: '1.5' }}>
              <div>ID: {booking.bookingId || booking.id}</div>
              <div>PNR: {booking.pnr || 'N/A'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'hsl(var(--bc))', fontSize: '24px', cursor: 'pointer', padding: '0', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>

          {/* Status Badge */}
          <div style={{ background: booking.status === 'confirmed' ? 'hsl(var(--su) / 0.08)' : booking.status === 'cancelled' ? 'hsl(var(--er) / 0.08)' : 'hsl(var(--b2))', border: `1px solid ${booking.status === 'confirmed' ? 'hsl(var(--su) / 0.2)' : booking.status === 'cancelled' ? 'hsl(var(--er) / 0.2)' : 'hsl(var(--b3))'}`, borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: booking.status === 'confirmed' ? 'hsl(var(--su))' : booking.status === 'cancelled' ? 'hsl(var(--er))' : 'hsl(var(--bc))' }}>
                {booking.status?.toUpperCase() || 'CONFIRMED'}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', textAlign: 'right' }}>
              <div>Booked on</div>
              <div style={{ fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.createdAt)}</div>
            </div>
          </div>

          {/* Route Section */}
          <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Route</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>From</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))' }}>{booking.fromCity || '—'}</div>
              </div>
              <div style={{ fontSize: '20px', color: 'hsl(var(--p))' }}>→</div>
              <div>
                <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>To</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))' }}>{booking.toCity || '—'}</div>
              </div>
            </div>
          </div>

          {/* Travel Schedule */}
          <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Travel Schedule</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>Departure</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.departureDate)}</div>
                {booking.departureTime && <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)', marginTop: '2px' }}>{formatTime(booking.departureTime)}</div>}
              </div>
              {booking.returnDate && (
                <div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>Return</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.returnDate)}</div>
                  {booking.arrivalTime && <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)', marginTop: '2px' }}>{formatTime(booking.arrivalTime)}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Flight-specific Details */}
          {isFlight && (
            <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Flight Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {booking.airlineName && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Airline</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.airlineName}</div>
                  </div>
                )}
                {booking.flightNumber && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Flight</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.flightNumber}</div>
                  </div>
                )}
                {booking.cabinClass && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Class</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.cabinClass}</div>
                  </div>
                )}
                {booking.stops !== undefined && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Stops</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
                      {booking.stops === 0 ? 'Non-stop' : `${booking.stops} Stop${booking.stops > 1 ? 's' : ''}`}
                    </div>
                  </div>
                )}
                {booking.departureAirport && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Departure Airport</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.departureAirport}</div>
                  </div>
                )}
                {booking.arrivalAirport && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Arrival Airport</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.arrivalAirport}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Travellers/Passengers */}
          {(booking.travellers || booking.passengers) && (
            <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Travellers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getTravellerInfo()}
              </div>
            </div>
          )}

          {/* Fare Breakdown */}
          {booking.totalAmount && (
            <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Fare Breakdown</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {booking.baseFare > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Base Fare</span>
                    <span style={{ fontWeight: 600 }}>₹{Math.round(booking.baseFare).toLocaleString()}</span>
                  </div>
                )}
                {booking.taxes > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Taxes & Fees</span>
                    <span style={{ fontWeight: 600 }}>₹{Math.round(booking.taxes).toLocaleString()}</span>
                  </div>
                )}
                {booking.convenience > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Convenience Fee</span>
                    <span style={{ fontWeight: 600 }}>₹{Math.round(booking.convenience).toLocaleString()}</span>
                  </div>
                )}
                {booking.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'hsl(var(--su))' }}>
                    <span>Discount</span>
                    <span style={{ fontWeight: 600 }}>-₹{Math.round(booking.discount).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid hsl(var(--b3))', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'hsl(var(--p))' }}>₹{Math.round(booking.totalAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          {(booking.paymentMethod || booking.paymentStatus) && (
            <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Payment Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {booking.paymentStatus && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: booking.paymentStatus === 'completed' ? 'hsl(var(--su))' : 'hsl(var(--wa))' }}>
                      {booking.paymentStatus.toUpperCase()}
                    </div>
                  </div>
                )}
                {booking.paymentMethod && (
                  <div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>Method</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
                      {booking.paymentMethod.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: 'hsl(var(--b2))', borderTop: '1px solid hsl(var(--b3))', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.55))' }}>
            support@tripora.com
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{
              background: isDownloading ? 'hsl(var(--b3))' : 'hsl(var(--p))',
              color: 'hsl(var(--pc))',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              opacity: isDownloading ? 0.6 : 1,
              whiteSpace: 'nowrap'
            }}
          >
            {isDownloading ? '⏳' : '📥'} {isDownloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>

        {downloadError && (
          <div style={{ background: 'hsl(var(--er) / 0.1)', color: 'hsl(var(--er))', padding: '10px 16px', fontSize: '12px', textAlign: 'center', borderTop: '1px solid hsl(var(--er) / 0.2)' }}>
            {downloadError}
          </div>
        )}
      </div>
    </div>
  )
}
