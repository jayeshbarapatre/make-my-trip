import React from 'react'

export default function BookingCard({ booking, onCancel, onViewDetails, onTriggerPayment }) {
  const isFlight = booking.type === 'flight'
  const isTrain = booking.type === 'train'
  const isHotel = booking.type === 'hotel'
  
  // Format travelers text
  const getTravellersText = (t) => {
    if (!t) return '1 Adult'
    
    // Handle array of passenger objects (common for flights)
    if (Array.isArray(t)) {
      if (t.length === 1 && t[0].firstName) {
        return `1 Traveller (${t[0].firstName} ${t[0].lastName})`
      }
      return `${t.length} Traveller${t.length > 1 ? 's' : ''}`
    }

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
    return '1 Adult'
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <span style={{ background: 'hsl(var(--su) / 0.1)', color: 'hsl(var(--su))', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>● CONFIRMED</span>
      case 'completed':
        return <span style={{ background: 'hsl(var(--b2))', color: 'hsl(var(--bc) / 0.6)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>✓ COMPLETED</span>
      case 'cancelled':
        return <span style={{ background: 'hsl(var(--er) / 0.1)', color: 'hsl(var(--er))', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>✕ CANCELLED</span>
      default:
        return <span style={{ background: 'hsl(var(--b2))', color: 'hsl(var(--bc))', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{status?.toUpperCase()}</span>
    }
  }

  return (
    <div style={{
      background: 'hsl(var(--b1))',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      border: '1px solid hsl(var(--b3))',
      padding: '24px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid hsl(var(--b3))', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'hsl(var(--b2))',
            color: isFlight ? 'hsl(var(--p))' : isTrain ? 'hsl(var(--su))' : (booking.type === 'bus') ? 'hsl(var(--wa))' : (booking.type === 'cab') ? 'hsl(var(--p))' : 'hsl(var(--wa))',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {isFlight ? '✈️' : isTrain ? '🚂' : (booking.type === 'bus') ? '🚌' : (booking.type === 'cab') ? '🚕' : '🏨'}
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 700 }}>
              {isFlight ? 'Flight Booking' : isTrain ? 'Train Ticket (IRCTC)' : (booking.type === 'bus') ? 'Bus Booking' : (booking.type === 'cab') ? 'Cab Booking' : 'Hotel Stay'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--bc))' }}>
              ID: {booking.bookingId || booking.id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.6)' }}>
            PNR: <strong style={{ color: 'hsl(var(--bc))' }}>{booking.pnr || 'PNR-WAITING'}</strong>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.5)', fontWeight: 700, marginBottom: '4px' }}>
            {isFlight || isTrain || booking.type === 'bus' || booking.type === 'cab' ? 'Route' : 'Property / Location'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'hsl(var(--bc))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{booking.fromCity}</span>
            {(isFlight || isTrain || booking.type === 'bus' || booking.type === 'cab') && <span style={{ color: 'hsl(var(--er))' }}>→</span>}
            {(isFlight || isTrain || booking.type === 'bus' || booking.type === 'cab') && <span>{booking.toCity}</span>}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.5)', fontWeight: 700, marginBottom: '4px' }}>
            Travel Schedule
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'hsl(var(--bc))' }}>
            {booking.departureDate} {booking.returnDate ? `to ${booking.returnDate}` : ''}
          </div>
          <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.6)', marginTop: '2px' }}>
            {getTravellersText(booking.travellers)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--bc) / 0.5)', fontWeight: 700, marginBottom: '4px' }}>
            Total Fare
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: 'hsl(var(--bc))' }}>
            ₹{booking.totalAmount?.toLocaleString()}
          </div>
          {booking.status === 'confirmed' && (
            <div style={{ fontSize: '11px', color: 'hsl(var(--su))', fontWeight: 600 }}>Fully Paid</div>
          )}
          {booking.status === 'cancelled' && (
            <div style={{ fontSize: '11px', color: 'hsl(var(--er))', fontWeight: 600 }}>Refund Simulated</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'hsl(var(--b2))', padding: '12px 16px', borderRadius: '8px', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onViewDetails(booking)}
            style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--bc))', cursor: 'pointer' }}
          >
            📋 View Details
          </button>

          <button
            onClick={() => {
              alert(`📥 DOWNLOADING E-TICKET (PDF)\nBooking ID: ${booking.bookingId}\nPNR: ${booking.pnr}\nStatus: ${booking.status.toUpperCase()}\nAmount: ₹${booking.totalAmount}`)
            }}
            style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--p))', cursor: 'pointer' }}
          >
            📥 Download Ticket PDF
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={() => onTriggerPayment(booking.totalAmount)}
                style={{ background: 'hsl(var(--wa) / 0.1)', border: '1px solid hsl(var(--wa))', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--wa))', cursor: 'pointer' }}
              >
                ⚡ Razorpay Add-ons / Upgrade
              </button>

              <button
                onClick={() => onCancel(booking.id)}
                style={{ background: 'hsl(var(--er) / 0.1)', border: '1px solid hsl(var(--er))', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'hsl(var(--er))', cursor: 'pointer' }}
              >
                ✕ Cancel Trip
              </button>
            </>
          )}

          {booking.status === 'cancelled' && (
            <span style={{ fontSize: '13px', color: 'hsl(var(--er))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              💳 Refund Credited to Wallet
            </span>
          )}
        </div>
      </div>

    </div>
  )
}
