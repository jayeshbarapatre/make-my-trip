import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingService } from '../services/authService'
import BookingCard from '../components/BookingCard'
import EnhancedBookingDetailsModal from '../components/EnhancedBookingDetailsModal'
import { useAuth } from '../context/AuthContext'
import OtpLoginModal from '../components/Auth/OtpLoginModal'
import Photo from '../components/Common/Photo'

export default function MyTrips() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Auth guard
  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=/my-trips', { replace: true })
    }
  }, [user, navigate])

  const [activeTab, setActiveTab] = useState('upcoming')
  const [typeFilter, setTypeFilter] = useState('all') // 'all', 'flight', 'hotel', 'bus', 'cab', 'train'
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [searchField, setSearchField] = useState('all') // 'all', 'bookingId', 'city', 'airline', 'passenger'
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState('latest') // 'latest', 'oldest', 'priceHigh', 'priceLow'

  // Notification state
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
  }

  // Mobile OTP Wallet Login Simulation State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)

  // Firestore is the single source of truth for bookings. Reading from
  // localStorage here previously surfaced stale and duplicate trips, and could
  // show records the backend had already rejected or cancelled.
  const {
    data: bookings = [],
    isPending,
    error: loadError,
    refetch: fetchBookings
  } = useQuery({
    queryKey: ['bookings', user?.id],
    enabled: Boolean(user?.id),
    // A booking made after this list was last fetched must show up the moment
    // the customer opens My Trips. The global 5-minute staleTime otherwise
    // served the pre-booking cache, so a paid trip looked like it never
    // happened — the single most alarming thing a booking site can do.
    refetchOnMount: 'always',
    staleTime: 0,
    queryFn: async () => {
      const response = await bookingService.getUserBookings(user.id)
      return Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : []
    }
  })

  const loading = Boolean(user?.id) && isPending

  // Cancel trip handler
  const handleCancelBooking = async (id) => {
    try {
      const res = await bookingService.cancelBooking(id)
      // Refetch rather than patching local state: the server decides the final
      // status and the refund amount, not the client.
      await queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] })

      const refund = res?.refund
      showNotification(
        refund
          ? `Booking cancelled. ₹${Number(refund.refundAmount).toLocaleString('en-IN')} will be refunded after a ₹${Number(refund.cancellationFee).toLocaleString('en-IN')} cancellation fee (${refund.policy}).`
          : 'Booking cancelled. Any refund due will be processed to your original payment method.',
        'success'
      )
      setShowCancelConfirm(false)
      setCancelBookingId(null)
    } catch (err) {
      showNotification(err.message || 'Failed to cancel booking', 'error')
    }
  }

  // Trigger Razorpay payment flow
  // Mobile OTP Send Handler
    // Mobile OTP Verify Handler
    // Search & Filter Logic
  const searchBookings = (bookingsToSearch) => {
    if (!searchQuery) return bookingsToSearch

    const query = searchQuery.toLowerCase()
    return bookingsToSearch.filter(b => {
      if (searchField === 'all') {
        return (
          (b.bookingId && b.bookingId.toLowerCase().includes(query)) ||
          (b.fromCity && b.fromCity.toLowerCase().includes(query)) ||
          (b.toCity && b.toCity.toLowerCase().includes(query)) ||
          (b.airlineName && b.airlineName.toLowerCase().includes(query)) ||
          (b.pnr && b.pnr.toLowerCase().includes(query)) ||
          (Array.isArray(b.travellers) && b.travellers.some(t =>
            (t.firstName && t.firstName.toLowerCase().includes(query)) ||
            (t.lastName && t.lastName.toLowerCase().includes(query))
          ))
        )
      } else if (searchField === 'bookingId') {
        return b.bookingId && b.bookingId.toLowerCase().includes(query)
      } else if (searchField === 'city') {
        return (b.fromCity && b.fromCity.toLowerCase().includes(query)) ||
               (b.toCity && b.toCity.toLowerCase().includes(query))
      } else if (searchField === 'airline') {
        return b.airlineName && b.airlineName.toLowerCase().includes(query)
      } else if (searchField === 'passenger') {
        return Array.isArray(b.travellers) && b.travellers.some(t =>
          (t.firstName && t.firstName.toLowerCase().includes(query)) ||
          (t.lastName && t.lastName.toLowerCase().includes(query))
        )
      }
      return true
    })
  }

  const filterByDateRange = (bookingsToFilter) => {
    if (!dateRangeStart && !dateRangeEnd) return bookingsToFilter

    return bookingsToFilter.filter(b => {
      const bookingDate = new Date(b.createdAt || b.departureDate)
      if (dateRangeStart && new Date(dateRangeStart) > bookingDate) return false
      if (dateRangeEnd && new Date(dateRangeEnd) < bookingDate) return false
      return true
    })
  }

  // Filtering logic
  const filteredBookings = bookings.filter(b => {
    const statusToMatch = activeTab === 'upcoming' ? 'confirmed' : activeTab
    const statusMatch = b.status === statusToMatch
    const typeMatch = typeFilter === 'all' || b.type === typeFilter
    return statusMatch && typeMatch
  })

  const searchFiltered = searchBookings(filteredBookings)
  const dateFiltered = filterByDateRange(searchFiltered)

  const sortedBookings = dateFiltered.sort((a, b) => {
    if (sortOrder === 'latest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    } else if (sortOrder === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    } else if (sortOrder === 'priceHigh') {
      return b.totalAmount - a.totalAmount
    } else if (sortOrder === 'priceLow') {
      return a.totalAmount - b.totalAmount
    }
    return 0
  })


  const handleOtpLoginSuccess = () => {
    setShowOtpModal(false)
    showNotification("Signed in successfully", "success")
    fetchBookings()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(var(--b2))', padding: '50px 0 40px', }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

        {/* Top Header Banner & Wallet Balance */}
        <div style={{
          background: 'linear-gradient(135deg, hsl(var(--bc)) 0%, hsl(var(--bc) / 0.9) 100%)',
          color: 'hsl(var(--b1))',
          borderRadius: '16px',
          padding: '32px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          marginBottom: '32px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'hsl(var(--b1) / 0.7)' }}>Secure Traveller History</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px', color: 'hsl(var(--b1))' }}>My Trips & Bookings</h1>
            <p style={{ margin: '6px 0 0', color: 'hsl(var(--b1) / 0.8)', fontSize: '15px' }}>Manage all your flight and hotel bookings, download e-tickets, and simulate refunds.</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* User Info */}
            {user && (
              <div style={{ background: 'hsl(var(--b1) / 0.1)', border: '1px solid hsl(var(--b1) / 0.2)', padding: '12px 20px', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: 'hsl(var(--b1) / 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Welcome</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--b1))', marginTop: '2px' }}>{user.name || user.email || 'Traveller'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter (Flight / Hotel) */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Services', icon: '📋' },
            { id: 'flight', label: 'Flights', icon: '✈️' },
            { id: 'hotel', label: 'Hotels', icon: '🏨' },
            { id: 'bus', label: 'Buses', icon: '🚌' },
            { id: 'cab', label: 'Cabs', icon: '🚕' },
            { id: 'train', label: 'Trains', icon: '🚆' }
          ].map(type => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              style={{
                background: typeFilter === type.id ? 'hsl(var(--bc))' : 'hsl(var(--b1))',
                color: typeFilter === type.id ? 'hsl(var(--b1))' : 'hsl(var(--bc))',
                border: typeFilter === type.id ? '1px solid hsl(var(--bc))' : '1px solid hsl(var(--b3))',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: typeFilter === type.id ? '0 4px 12px hsl(var(--bc) / 0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ background: 'hsl(var(--b1))', border: '1px solid hsl(var(--b3))', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '250px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search by Booking ID, City, Airline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid hsl(var(--b3))',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'hsl(var(--b2))',
                  color: 'hsl(var(--bc))',
                }}
              />
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid hsl(var(--b3))',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'hsl(var(--b2))',
                  color: 'hsl(var(--bc))',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Fields</option>
                <option value="bookingId">Booking ID</option>
                <option value="city">City</option>
                <option value="airline">Airline</option>
                <option value="passenger">Passenger Name</option>
              </select>
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid hsl(var(--b3))',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                background: 'hsl(var(--b2))',
                color: 'hsl(var(--bc))',
                cursor: 'pointer'
              }}
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="priceLow">Price: Low to High</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '10px 16px',
                border: '1px solid hsl(var(--b3))',
                borderRadius: '8px',
                background: showFilters ? 'hsl(var(--bc) / 0.1)' : 'hsl(var(--b2))',
                color: 'hsl(var(--bc))',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🔽 {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '12px', borderTop: '1px solid hsl(var(--b3))' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6))', marginBottom: '6px' }}>From Date</label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid hsl(var(--b3))',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    background: 'hsl(var(--b2))',
                    color: 'hsl(var(--bc))',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6))', marginBottom: '6px' }}>To Date</label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid hsl(var(--b3))',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    background: 'hsl(var(--b2))',
                    color: 'hsl(var(--bc))',
                    cursor: 'pointer'
                  }}
                />
              </div>
              {(searchQuery || dateRangeStart || dateRangeEnd) && (
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSearchField('all')
                      setDateRangeStart('')
                      setDateRangeEnd('')
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid hsl(var(--er))',
                      borderRadius: '6px',
                      background: 'hsl(var(--er) / 0.08)',
                      color: 'hsl(var(--er))',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Count */}
          <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.55))', marginTop: '12px' }}>
            {sortedBookings.length} booking{sortedBookings.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid hsl(var(--b3))', paddingBottom: '16px' }}>
          {[
            { id: 'upcoming', label: '⏳ Upcoming Trips' },
            { id: 'completed', label: '✓ Completed' },
            { id: 'cancelled', label: '✕ Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'hsl(var(--bc))' : 'hsl(var(--b1))',
                color: activeTab === tab.id ? 'hsl(var(--b1))' : 'hsl(var(--bc) / 0.65)',
                border: activeTab === tab.id ? '1px solid hsl(var(--bc))' : '1px solid hsl(var(--b3))',
                padding: '12px 24px',
                borderRadius: '30px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List Container */}
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', fontSize: '18px', color: 'hsl(var(--bc) / 0.55)', fontWeight: 600 }}>
            ⏳ Loading your trips...
          </div>
        ) : loadError ? (
          <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid hsl(var(--b3))' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: 'hsl(var(--bc))' }}>We could not load your trips</h3>
            <p style={{ margin: '0 0 20px', color: 'hsl(var(--bc) / 0.55)', fontSize: '15px' }}>{loadError.message || 'Please try again.'}</p>
            <button
              onClick={fetchBookings}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'hsl(var(--p))', color: 'hsl(var(--pc))', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', padding: '48px 20px 72px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid hsl(var(--b3))' }}>
            <div style={{ width: '100%', maxWidth: '460px', height: '210px', margin: '0 auto 28px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(10, 17, 40, 0.12)' }}>
              <Photo
                name="state-empty-trips"
                sizes="(max-width: 520px) 90vw, 460px"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: 'hsl(var(--bc))' }}>No bookings found</h3>
            <p style={{ margin: 0, color: 'hsl(var(--bc) / 0.55)', fontSize: '15px' }}>{searchQuery || dateRangeStart ? 'Try adjusting your search filters or plan your next vacation from the MakeMyTrip homepage.' : 'Plan your next vacation or flight search from the MakeMyTrip homepage.'}</p>
          </div>
        ) : (
          sortedBookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={(id) => {
                setCancelBookingId(id)
                setShowCancelConfirm(true)
              }}
              onViewDetails={(bkg) => setSelectedBooking(bkg)}
            />
          ))
        )}

      </div>

      {/* ── Enhanced Booking Details Modal ── */}
      {selectedBooking && (
        <EnhancedBookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* ── Modal 3: Razorpay Style Mobile OTP Wallet Login ── */}
      <OtpLoginModal
        open={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSuccess={handleOtpLoginSuccess}
        title="Mobile OTP Login"
      />

      {/* Notification Toast */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: notification.type === 'success' ? 'hsl(var(--su))' : 'hsl(var(--er))',
          color: 'hsl(var(--b1))',
          padding: '16px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 2000,
          animation: 'slideIn 0.3s ease'
        }}>
          {notification.message}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && cancelBookingId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1500
        }}>
          <div style={{
            background: 'hsl(var(--b1))',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 700, color: 'hsl(var(--bc))' }}>Cancel Booking?</h3>
            <p style={{ margin: '0 0 20px', color: 'hsl(var(--bc) / 0.55)', fontSize: '14px' }}>
              Standard cancellation charges (20%) will apply. Are you sure you want to proceed?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowCancelConfirm(false)
                  setCancelBookingId(null)
                }}
                style={{
                  background: 'hsl(var(--b2))',
                  color: 'hsl(var(--bc))',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Keep Booking
              </button>
              <button
                onClick={() => {
                  handleCancelBooking(cancelBookingId)
                }}
                style={{
                  background: 'hsl(var(--er))',
                  color: 'hsl(var(--b1))',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
