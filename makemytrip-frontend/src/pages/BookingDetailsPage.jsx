import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bookingService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { downloadTicketPDF } from '../utils/pdfGenerator'

export default function BookingDetailsPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const fetchBooking = async () => {
    try {
      setLoading(true)
      const response = await bookingService.getBooking(bookingId)
      const data = response.data || response
      setBooking(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching booking:', err)
      setError('Failed to load booking details. ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=' + encodeURIComponent('/bookings/' + bookingId))
      return
    }

    fetchBooking()
  }, [bookingId, user])

  const handleDownloadPDF = async () => {
    if (!booking) return
    setIsDownloading(true)
    try {
      await downloadTicketPDF(booking)
    } catch (error) {
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--b2))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: 'hsl(var(--bc) / 0.55)', fontWeight: 600 }}>Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--b2))', padding: '40px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid hsl(var(--b3))' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Booking Not Found</h2>
            <p style={{ margin: '0 0 20px', color: 'hsl(var(--bc) / 0.55)', fontSize: '15px' }}>
              {error || 'The booking you are looking for does not exist or could not be loaded.'}
            </p>
            <button
              onClick={() => navigate('/my-trips')}
              style={{
                background: 'hsl(var(--p))',
                color: 'hsl(var(--pc))',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ← Back to My Trips
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isFlight = booking.type === 'flight'
  const _isHotel = booking.type === 'hotel'

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--b2))', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <button
            onClick={() => navigate('/my-trips')}
            style={{ background: 'transparent', border: 'none', color: 'hsl(var(--p))', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
          >
            ← Back to My Trips
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            style={{
              background: isDownloading ? 'hsl(var(--b3))' : 'hsl(var(--p))',
              color: 'hsl(var(--pc))',
              border: 'none',
              padding: '12px 20px',
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

        {/* Main Card */}
        <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid hsl(var(--b3))' }}>
          {/* Header Section */}
          <div style={{ background: 'hsl(var(--b2))', borderBottom: '1px solid hsl(var(--b3))', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Booking Details</h1>
              <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>ID: {booking.bookingId} | PNR: {booking.pnr}</div>
            </div>
            <div style={{ background: booking.status === 'confirmed' ? 'hsl(var(--su) / 0.08)' : booking.status === 'cancelled' ? 'hsl(var(--er) / 0.08)' : 'hsl(var(--b3))', color: booking.status === 'confirmed' ? 'hsl(var(--su))' : booking.status === 'cancelled' ? 'hsl(var(--er))' : 'hsl(var(--bc))', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
              {booking.status}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '32px' }}>
            {/* Route & Schedule */}
            <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Journey</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>From</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'hsl(var(--bc))' }}>{booking.fromCity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>To</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'hsl(var(--bc))' }}>{booking.toCity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>Departure</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.departureDate)}</div>
                  {booking.departureTime && <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.7)' }}>{formatTime(booking.departureTime)}</div>}
                </div>
                {booking.returnDate && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55)', marginBottom: '4px' }}>Return</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{formatDate(booking.returnDate)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Service Details */}
            {isFlight && booking.airlineName && (
              <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Flight Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>Airline</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.airlineName}</div>
                  </div>
                  {booking.flightNumber && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>Flight</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.flightNumber}</div>
                    </div>
                  )}
                  {booking.cabinClass && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>Class</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc))' }}>{booking.cabinClass}</div>
                    </div>
                  )}
                  {booking.stops !== undefined && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>Stops</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
                        {booking.stops === 0 ? 'Non-stop' : `${booking.stops} Stop${booking.stops > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Passengers/Guests */}
            {booking.travellers && (
              <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Travellers</h3>
                <div style={{ fontSize: '14px', color: 'hsl(var(--bc))' }}>
                  {typeof booking.travellers === 'string' ? booking.travellers : JSON.stringify(booking.travellers).substring(0, 100)}
                </div>
              </div>
            )}

            {/* Fare Breakdown */}
            {booking.totalAmount && (
              <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Fare Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {booking.baseFare > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>Base Fare</span>
                      <span style={{ fontWeight: 600 }}>₹{booking.baseFare.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.taxes > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>Taxes & Fees</span>
                      <span style={{ fontWeight: 600 }}>₹{booking.taxes.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.convenience > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>Convenience Fee</span>
                      <span style={{ fontWeight: 600 }}>₹{booking.convenience.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'hsl(var(--su))' }}>
                      <span>Discount</span>
                      <span style={{ fontWeight: 600 }}>-₹{booking.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid hsl(var(--b3))', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'hsl(var(--p))' }}>
                    <span>Total</span>
                    <span>₹{booking.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div style={{ background: 'hsl(var(--b2))', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.6)' }}>Payment Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: booking.paymentStatus === 'completed' ? 'hsl(var(--su))' : 'hsl(var(--wa))' }}>
                    {booking.paymentStatus?.toUpperCase() || 'COMPLETED'}
                  </div>
                </div>
                {booking.paymentMethod && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>Method</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--bc))' }}>
                      {booking.paymentMethod.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                )}
                {booking.transactionId && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>Transaction ID</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--bc))', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {booking.transactionId}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ background: 'hsl(var(--b2))', borderTop: '1px solid hsl(var(--b3))', padding: '16px 24px', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--bc) / 0.55))' }}>
            Booked on {new Date(booking.createdAt).toLocaleString('en-IN')} | Need help? contact support@makemytrip.com
          </div>
        </div>
      </div>
    </div>
  )
}
