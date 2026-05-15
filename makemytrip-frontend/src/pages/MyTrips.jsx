import React, { useState, useEffect } from 'react'
import { bookingService, paymentService, authService } from '../services/authService'
import BookingCard from '../components/BookingCard'
import { useAuth } from '../context/AuthContext'

export default function MyTrips() {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Auth context
  const { user, verifyOtpLogin } = useAuth()

  // Razorpay Checkout Simulation State
  const [razorpayOrder, setRazorpayOrder] = useState(null)
  const [showRazorpay, setShowRazorpay] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Mobile OTP Wallet Login Simulation State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [walletBalance, setWalletBalance] = useState(4250) // MakeMyTrip Wallet bonus feature

  // Fetch Bookings
  const fetchBookings = async () => {
    setLoading(true)
    try {
      const currentUserId = user?.id || 'usr_1111-2222-3333-4444'
      const data = await bookingService.getUserBookings(currentUserId)
      setBookings(data || [])
    } catch (err) {
      console.error("Failed to load trips:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [user])

  // Cancel trip handler
  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking? Standard cancellation charges (20%) will apply.")) return;

    try {
      const target = bookings.find(b => b.id === id)
      const baseAmt = target ? (target.totalAmount || target.amount || 5000) : 5000
      const cancelFee = Math.round(baseAmt * 0.20)
      const refundAmt = baseAmt - cancelFee

      await bookingService.cancelBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
      setWalletBalance(prev => prev + refundAmt)
      alert(`Booking cancelled successfully. A refund of ₹${refundAmt.toLocaleString()} (after ₹${cancelFee.toLocaleString()} cancellation charges) has been credited to your MakeMyTrip Wallet!`)
    } catch (err) {
      alert("Failed to cancel booking.")
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
      alert("Failed to initialize Razorpay test order.")
    }
  }

  // Mobile OTP Send Handler
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!mobilePhone || mobilePhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.")
      return
    }
    try {
      const res = await authService.sendMobileOtp(mobilePhone)
      setOtpSent(true)
      alert(res?.message || "OTP sent successfully via simulated SMS!")
    } catch (err) {
      alert(err || "Failed to send OTP.")
    }
  }

  // Mobile OTP Verify Handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode) {
      alert("Please enter the verification OTP.")
      return
    }
    try {
      if (verifyOtpLogin) {
        await verifyOtpLogin(mobilePhone, otpCode)
      } else {
        await authService.verifyMobileOtp(mobilePhone, otpCode)
      }
      alert("Authentication Successful via Razorpay-Style Mobile OTP!")
      setShowOtpModal(false)
      setOtpSent(false)
      setOtpCode('')
      fetchBookings()
    } catch (err) {
      alert(err || "Invalid OTP code.")
    }
  }

  // Filtered bookings
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'upcoming') return b.status === 'confirmed'
    if (activeTab === 'completed') return b.status === 'completed'
    if (activeTab === 'cancelled') return b.status === 'cancelled'
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 0', }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

        {/* Top Header Banner & Wallet Balance */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#fff',
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
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Secure Traveller History</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff' }}>My Trips & Bookings</h1>
            <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '15px' }}>Manage all your flight and hotel bookings, download e-tickets, and simulate refunds.</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* MakeMyTrip Wallet Balance Badge */}
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '16px 24px', borderRadius: '12px', backdropFilter: 'blur(10px)', textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>MMT Wallet Cash</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>₹{walletBalance.toLocaleString()}</div>
            </div>

            <button
              onClick={() => setShowOtpModal(true)}
              style={{ background: '#eb2026', color: '#fff', border: 'none', padding: '16px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(235,32,38,0.3)', transition: 'transform 0.2s' }}
            >
              📱 Mobile OTP Login
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          {[
            { id: 'upcoming', label: '⏳ Upcoming Trips' },
            { id: 'completed', label: '✓ Completed' },
            { id: 'cancelled', label: '✕ Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#0f172a' : '#fff',
                color: activeTab === tab.id ? '#fff' : '#475569',
                border: activeTab === tab.id ? '1px solid #0f172a' : '1px solid #cbd5e1',
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
          <div style={{ padding: '60px 20px', textAlign: 'center', fontSize: '18px', color: '#64748b', fontWeight: 600 }}>
            ⏳ Loading your booking history from PostgreSQL database...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '80px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧳</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>No {activeTab} bookings found</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Plan your next vacation or flight search from the MakeMyTrip homepage.</p>
          </div>
        ) : (
          filteredBookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={handleCancelBooking}
              onViewDetails={(bkg) => setSelectedBooking(bkg)}
              onTriggerPayment={handleTriggerPayment}
            />
          ))
        )}

      </div>

      {/* ── Modal 1: Booking Details view ── */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '650px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#0f172a', color: '#fff', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>Trip Reference Sheet</h3>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>PNR: {selectedBooking.pnr}</div>
              </div>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>From City / Origin</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{selectedBooking.fromCity}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Destination / Property</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{selectedBooking.toCity}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Total Billed Amount</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>₹{selectedBooking.totalAmount?.toLocaleString()}</div>
                </div>
                <button
                  onClick={() => { alert("E-ticket receipt downloaded."); setSelectedBooking(null); }}
                  style={{ background: '#eb2026', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm & Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Razorpay Payment Simulation Checkout ── */}
      {showRazorpay && razorpayOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>

            {/* Razorpay Brand Header */}
            <div style={{ background: '#0284c7', color: '#fff', padding: '24px', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, opacity: 0.9 }}>TEST MODE SECURE CHECKOUT</div>
              <h2 style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 900, color: '#ffffff' }}>Razorpay</h2>
              <button onClick={() => setShowRazorpay(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Order ID Generated from Backend</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '8px', borderRadius: '6px', marginTop: '4px', fontFamily: 'monospace' }}>
                  {razorpayOrder.id}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Amount Due</div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                  ₹{(razorpayOrder.amount / 100).toLocaleString()}
                </div>
              </div>

              {paymentSuccess ? (
                <div style={{ background: '#dcfce7', color: '#15803d', padding: '20px', borderRadius: '12px', textAlign: 'center', fontWeight: 700 }}>
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
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)', transition: 'transform 0.1s' }}
                  >
                    💳 Simulate UPI / Card Payment
                  </button>

                  <button
                    onClick={() => setShowRazorpay(false)}
                    style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
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
          <div style={{ background: '#fff', width: '100%', maxWidth: '440px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>

            <div style={{ background: '#0f172a', color: '#fff', padding: '28px 28px 20px', position: 'relative' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>Mobile OTP Login</h2>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>Razorpay Wallet Style 6-digit secure authentication</p>
              <button onClick={() => setShowOtpModal(false)} style={{ position: 'absolute', right: '20px', top: '24px', background: 'transparent', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: '28px' }}>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Enter 10-Digit Mobile Number</label>
                    <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      <span style={{ background: '#f1f5f9', padding: '14px 16px', color: '#64748b', fontWeight: 700, borderRight: '1px solid #cbd5e1' }}>+91</span>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="9876543210"
                        value={mobilePhone}
                        onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, ''))}
                        style={{ border: 'none', padding: '14px 16px', fontSize: '16px', fontWeight: 600, width: '100%', outline: 'none' }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{ background: '#eb2026', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(235,32,38,0.3)' }}
                  >
                    Send One-Time Password (OTP)
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Simulated SMS sent to</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>+91 {mobilePhone}</div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Enter 6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '10px', fontSize: '24px', letterSpacing: '12px', textAlign: 'center', fontWeight: 800, width: '100%', outline: 'none' }}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '16px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                  >
                    Verify OTP & Log In
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    style={{ background: 'transparent', border: 'none', color: '#eb2026', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ← Edit Mobile Number
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
