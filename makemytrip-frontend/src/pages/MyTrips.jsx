import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService, paymentService, authService } from '../services/authService'
import BookingCard from '../components/BookingCard'
import EnhancedBookingDetailsModal from '../components/EnhancedBookingDetailsModal'
import { useAuth } from '../context/AuthContext'

export default function MyTrips() {
  const navigate = useNavigate()
  const { user, verifyOtpLogin } = useAuth()

  // Auth guard
  useEffect(() => {
    if (!user) {
      navigate('/login?returnTo=/my-trips', { replace: true })
    }
  }, [user, navigate])

  const [activeTab, setActiveTab] = useState('upcoming')
  const [typeFilter, setTypeFilter] = useState('all') // 'all', 'flight', 'hotel', 'bus', 'cab', 'train'
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
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

  // Razorpay Checkout Simulation State
  const [razorpayOrder, setRazorpayOrder] = useState(null)
  const [showRazorpay, setShowRazorpay] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Mobile OTP Wallet Login Simulation State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)

  // Fetch Bookings
  const fetchBookings = async () => {
    setLoading(true)
    try {
      let backendBookings = []
      let localBookings = []

      // Try backend first
      if (user?.id) {
        try {
          const response = await bookingService.getUserBookings(user.id)
          // Make sure we got an array
          if (Array.isArray(response)) {
            backendBookings = response
          } else if (Array.isArray(response?.data)) {
            backendBookings = response.data
          }
          console.log('✅ Backend bookings:', backendBookings.length, backendBookings)
        } catch (backendErr) {
          console.warn("⚠️ Backend fetch failed:", backendErr.message)
        }
      }

      // Always load localStorage as secondary source
      try {
        localBookings = JSON.parse(localStorage.getItem('mmt_bookings') || '[]')
        if (localBookings.length > 0) {
          console.log('💾 localStorage bookings:', localBookings.length, localBookings)
        }
      } catch (err) {
        console.warn('Error reading localStorage:', err)
      }

      // 🔄 MERGE: Combine backend + localStorage (avoid duplicates)
      const allBookings = [...backendBookings]
      const backendIds = new Set(backendBookings.map(b => b.bookingId || b.id))

      // Add localStorage bookings that aren't already in backend
      for (const localBooking of localBookings) {
        if (!backendIds.has(localBooking.bookingId) && !backendIds.has(localBooking.id)) {
          allBookings.push(localBooking)
        }
      }

      console.log('📊 Final merged bookings:', allBookings.length)
      setBookings(allBookings || [])
    } catch (err) {
      console.error("Failed to load trips:", err)
      // Last resort: just use localStorage
      try {
        const localBookings = JSON.parse(localStorage.getItem('mmt_bookings') || '[]')
        console.log('📦 Fallback to localStorage only:', localBookings.length)
        setBookings(localBookings)
      } catch (e) {
        setBookings([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [user])

  // Cancel trip handler
  const handleCancelBooking = async (id) => {
    try {
      const target = bookings.find(b => b.id === id)
      const baseAmt = target ? (target.totalAmount || target.amount || 5000) : 5000
      const cancelFee = Math.round(baseAmt * 0.20)
      const refundAmt = baseAmt - cancelFee

      await bookingService.cancelBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
      showNotification(`Booking cancelled. Refund of ₹${refundAmt.toLocaleString()} after ₹${cancelFee.toLocaleString()} charges.`, 'success')
      setShowCancelConfirm(false)
      setCancelBookingId(null)
    } catch (err) {
      showNotification('Failed to cancel booking', 'error')
    }
  }

  // Trigger Razorpay payment flow
  const handleTriggerPayment = async (amount) => {
    try {
      const order = await paymentService.createOrder(amount)
      setRazorpayOrder(order)
      setShowRazorpay(true)
      setPaymentSuccess(false)
    } catch (err) {
      showNotification('Failed to initialize payment', 'error')
    }
  }

  // Mobile OTP Send Handler
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!mobilePhone || mobilePhone.length < 10) {
      showNotification('Please enter a valid 10-digit mobile number', 'error')
      return
    }
    try {
      const res = await authService.sendMobileOtp(mobilePhone)
      if (res && (res.data || res.message)) {
        setOtpSent(true)
        showNotification('OTP sent successfully', 'success')
      } else {
        showNotification('Failed to send OTP. Please try again', 'error')
      }
    } catch (err) {
      showNotification('Failed to send OTP', 'error')
    }
  }

  // Mobile OTP Verify Handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode) {
      showNotification('Please enter the verification OTP', 'error')
      return
    }
    try {
      if (verifyOtpLogin) {
        await verifyOtpLogin(mobilePhone, otpCode)
      } else {
        await authService.verifyMobileOtp(mobilePhone, otpCode)
      }
      showNotification('Authentication successful!', 'success')
      setShowOtpModal(false)
      setOtpSent(false)
      setOtpCode('')
      fetchBookings()
    } catch (err) {
      showNotification(err?.message || 'Invalid OTP code', 'error')
    }
  }

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
        ) : sortedBookings.length === 0 ? (
          <div style={{ background: 'hsl(var(--b1))', borderRadius: '16px', padding: '80px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid hsl(var(--b3))' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧳</div>
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
              onTriggerPayment={handleTriggerPayment}
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

      {/* ── Modal 2: Razorpay Payment Simulation Checkout ── */}
      {showRazorpay && razorpayOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: 'hsl(var(--b1))', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>

            {/* Razorpay Brand Header */}
            <div style={{ background: 'hsl(var(--p))', color: 'hsl(var(--pc))', padding: '24px', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, opacity: 0.9 }}>TEST MODE SECURE CHECKOUT</div>
              <h2 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 900, color: 'hsl(var(--pc))' }}>Razorpay</h2>
              <button onClick={() => setShowRazorpay(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'hsl(var(--pc))', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>Order ID Generated from Backend</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--bc))', background: 'hsl(var(--b2))', padding: '8px', borderRadius: '6px', marginTop: '4px', fontFamily: 'monospace' }}>
                  {razorpayOrder.id}
                </div>
              </div>

              <div style={{ background: 'hsl(var(--b2))', border: '1px solid hsl(var(--b3))', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Amount Due</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: 'hsl(var(--bc))', marginTop: '4px' }}>
                  ₹{(razorpayOrder.amount / 100).toLocaleString()}
                </div>
              </div>

              {paymentSuccess ? (
                <div style={{ background: 'hsl(var(--su) / 0.08)', color: 'hsl(var(--su))', padding: '20px', borderRadius: '12px', textAlign: 'center', fontWeight: 700 }}>
                  🎉 Payment Verified Successfully! Confirmation Sent.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setPaymentSuccess(true)
                      setTimeout(() => {
                        setShowRazorpay(false)
                        alert("Razorpay Payment verified successfully! Your trip upgrade is fully confirmed.")
                      }, 1500)
                    }}
                    style={{ background: 'hsl(var(--su))', color: 'hsl(var(--b1))', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px hsl(var(--su) / 0.3)', transition: 'transform 0.1s' }}
                  >
                    💳 Simulate UPI / Card Payment
                  </button>

                  <button
                    onClick={() => setShowRazorpay(false)}
                    style={{ background: 'hsl(var(--b2))', color: 'hsl(var(--bc) / 0.55)', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel Checkout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Modal 3: Razorpay Style Mobile OTP Wallet Login ── */}
      {showOtpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ background: 'hsl(var(--b1))', width: '100%', maxWidth: '440px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>

            <div style={{ background: 'hsl(var(--b2))', borderBottom: '1px solid hsl(var(--b3))', padding: '28px 28px 20px', position: 'relative' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'hsl(var(--bc))' }}>Mobile OTP Login</h2>
              <p style={{ margin: '4px 0 0', color: 'hsl(var(--bc) / 0.55)', fontSize: '14px' }}>Razorpay Wallet Style 6-digit secure authentication</p>
              <button onClick={() => setShowOtpModal(false)} style={{ position: 'absolute', right: '20px', top: '24px', background: 'transparent', border: 'none', color: 'hsl(var(--bc))', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '28px' }}>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px' }}>Enter 10-Digit Mobile Number</label>
                    <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid hsl(var(--b3))' }}>
                      <span style={{ background: 'hsl(var(--b2))', padding: '14px 16px', color: 'hsl(var(--bc) / 0.55)', fontWeight: 700, borderRight: '1px solid hsl(var(--b3))' }}>+91</span>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="9876543210"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, ''))}
                        style={{ border: 'none', padding: '14px 16px', fontSize: '16px', fontWeight: 600, width: '100%', outline: 'none', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{ background: 'hsl(var(--p))', color: 'hsl(var(--pc))', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px hsl(var(--p) / 0.3)' }}
                  >
                    Send One-Time Password (OTP)
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'hsl(var(--b2))', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.55)' }}>Simulated SMS sent to</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'hsl(var(--bc))', marginTop: '2px' }}>+91 {mobilePhone}</div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'hsl(var(--bc) / 0.6)', marginBottom: '8px' }}>Enter 6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ border: '1px solid hsl(var(--b3))', padding: '16px', borderRadius: '10px', fontSize: '24px', letterSpacing: '12px', textAlign: 'center', fontWeight: 800, width: '100%', outline: 'none', background: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ background: 'hsl(var(--su))', color: 'hsl(var(--b1))', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px hsl(var(--su) / 0.3)' }}
                  >
                    Verify OTP & Log In
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    style={{ background: 'transparent', border: 'none', color: 'hsl(var(--er))', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ← Edit Mobile Number
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

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
