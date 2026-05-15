import React from 'react'

export default function BookingCard({ booking, onCancel, onViewDetails, onTriggerPayment }) {
  const isFlight = booking.type === 'flight'
  const isTrain = booking.type === 'train'
  const isHotel = booking.type === 'hotel'
  
  // Format travelers text
  const getTravellersText = (t) => {
    if (!t) return '1 Adult'
    if (t.passengers) {
      return `${t.passengers.length} Passenger${t.passengers.length > 1 ? 's' : ''} (${t.classCode || '3A'})`
    }
    if (t.adults) {
      const cnt = (t.adults || 0) + (t.children || 0) + (t.infants || 0)
      return `${cnt} Traveller${cnt > 1 ? 's' : ''}`
    }
    if (t.rooms) {
      return `${t.rooms} Room, ${t.adults || 1} Adult`
    }
    return JSON.stringify(t)
  }

  // Color coded status badge
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>● CONFIRMED</span>
      case 'completed':
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>✓ COMPLETED</span>
      case 'cancelled':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>✕ CANCELLED</span>
      default:
        return <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{status?.toUpperCase()}</span>
    }
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      border: '1px solid #f1f5f9',
      padding: '24px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top row: Type badge, ID, Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: isFlight ? '#eef2ff' : isTrain ? '#f0fdf4' : '#fff7ed',
            color: isFlight ? '#4f46e5' : isTrain ? '#16a34a' : '#ea580c',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {isFlight ? '✈️' : isTrain ? '🚂' : '🏨'}
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700 }}>
              {isFlight ? 'Flight Booking' : isTrain ? 'Train Ticket (IRCTC)' : 'Hotel Stay'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              ID: {booking.bookingId || booking.id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            PNR: <strong style={{ color: '#0f172a' }}>{booking.pnr || 'PNR-WAITING'}</strong>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      {/* Main content: Route/Hotel, Dates, Price */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
            {isFlight || isTrain ? 'Route' : 'Property / Location'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{booking.fromCity}</span>
            {(isFlight || isTrain) && <span style={{ color: '#eb2026' }}>→</span>}
            {(isFlight || isTrain) && <span>{booking.toCity}</span>}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
            Travel Schedule
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
            {booking.departureDate} {booking.returnDate ? `to ${booking.returnDate}` : ''}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            {getTravellersText(booking.travellers)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
            Total Fare
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>
            ₹{booking.totalAmount?.toLocaleString()}
          </div>
          {booking.status === 'confirmed' && (
            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Fully Paid</div>
          )}
          {booking.status === 'cancelled' && (
            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Refund Simulated</div>
          )}
        </div>
      </div>

      {/* Footer Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onViewDetails(booking)}
            style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
          >
            📋 View Details
          </button>
          
          <button
            onClick={() => {
              alert(`📥 DOWNLOADING E-TICKET (PDF)\nBooking ID: ${booking.bookingId}\nPNR: ${booking.pnr}\nStatus: ${booking.status.toUpperCase()}\nAmount: ₹${booking.totalAmount}`)
            }}
            style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#0284c7', cursor: 'pointer' }}
          >
            📥 Download Ticket PDF
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={() => onTriggerPayment(booking.totalAmount)}
                style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, color: '#ea580c', cursor: 'pointer' }}
              >
                ⚡ Razorpay Add-ons / Upgrade
              </button>

              <button
                onClick={() => onCancel(booking.id)}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#dc2626', cursor: 'pointer' }}
              >
                ✕ Cancel Trip
              </button>
            </>
          )}

          {booking.status === 'cancelled' && (
            <span style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              💳 Refund Credited to Wallet
            </span>
          )}
        </div>
      </div>

    </div>
  )
}
