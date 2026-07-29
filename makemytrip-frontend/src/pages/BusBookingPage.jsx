import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { busService } from '../services/busService'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import showToast from '../utils/toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import '../styles/BusBookingFlow.css'
import OtpLoginModal from '../components/Auth/OtpLoginModal'
import { photo } from '../utils/images'

const fmtTime = (val) => {
  if (!val) return 'N/A'
  if (typeof val === 'object' && val.time) return val.time
  if (typeof val === 'string' && val.match(/^\d{1,2}:\d{2}/)) return val
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fmtDuration = (m) => {
  if (!m || isNaN(m)) return 'N/A'
  const duration = Number(m)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

const fmtPrice = (p) => '₹' + Number(p).toLocaleString('en-IN')

const fmtDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  const d = new Date(Number(year), Number(month) - 1, Number(day))
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function BusBookingPage() {
  const { busId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const searchDate = location.state?.searchDate

  const { user } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingStep, setPendingStep] = useState(null)

  const [step, setStep] = useState(1)

  const [travellers] = useState(() => {
    try {
      const saved = localStorage.getItem('travellers_bus')
      return saved ? JSON.parse(saved) : { count: 1 }
    } catch {
      return { count: 1 }
    }
  })

  const [passengerDetails, setPassengerDetails] = useState(() => {
    const list = []
    for (let i = 0; i < (travellers.count || 1); i++) {
      list.push({ name: '', age: '', gender: 'Male', seat: i + 1 })
    }
    return list
  })

  const [contact, setContact] = useState({ email: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [bookingDetails, setBookingDetails] = useState(null)

  // Use bus from navigation state if available (no API call needed)
  const hasBusInState = !!location.state?.bus

  const { data, isLoading, isError, _error } = useQuery({
    queryKey: ['bus', busId],
    queryFn: () => busService.getById(busId),
    retry: false,
    enabled: !hasBusInState, // Skip API call if bus is in navigation state
  })

  const rawBus = hasBusInState ? location.state.bus : (data?.data || null)

  const bus = rawBus ? (() => {
    const departure = typeof rawBus.departure === 'string' ? JSON.parse(rawBus.departure) : rawBus.departure
    const arrival = typeof rawBus.arrival === 'string' ? JSON.parse(rawBus.arrival) : rawBus.arrival

    const dateToUse = searchDate || departure?.date

    return {
      ...rawBus,
      departure: { ...departure, date: dateToUse },
      arrival: { ...arrival, date: dateToUse },
      source: departure?.city || rawBus.source,
      destination: arrival?.city || rawBus.destination,
    }
  })() : null

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  if (isLoading && !bus) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 transition-colors duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{
          borderColor: 'hsl(var(--b3))',
          borderTopColor: 'hsl(var(--p))'
        }} />
        <p className="text-lg font-semibold text-base-content/70">Loading bus details…</p>
      </div>
    </div>
  )

  if (isError || !bus) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background decorative elements with DaisyUI theme colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ background: 'hsl(var(--s) / 0.1)' }} />
        <div className="absolute bottom-40 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'hsl(var(--s) / 0.05)', animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, hsl(var(--s)), hsl(var(--s) / 0.8))', boxShadow: '0 10px 25px hsla(var(--s) / 0.3)' }}>
              <svg className="w-12 h-12" style={{ color: 'hsl(var(--sc))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg" style={{ background: 'hsl(var(--s))', color: 'hsl(var(--sc))' }}>!</div>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-3">
          Bus Not Available
        </h2>

        {/* Message */}
        <p className="text-base-content/70 text-base mb-2">
          The bus you're looking for is no longer available.
        </p>
        <p className="text-base-content/60 text-sm mb-8">
          This could be because the bus is fully booked, out of service, or the booking window has closed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/bus-search')}
            className="btn btn-primary px-6 gap-2 transform hover:scale-105 active:scale-95 transition-transform duration-200"
            style={{
              background: 'hsl(var(--p))',
              color: 'hsl(var(--pc))',
              boxShadow: '0 10px 20px hsla(var(--p) / 0.3)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Again
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost px-6 transform hover:scale-105 active:scale-95 transition-transform duration-200"
            style={{
              background: 'hsl(var(--b2))',
              color: 'hsl(var(--bc))'
            }}
          >
            Go Back
          </button>
        </div>

        {/* Helpful tips */}
        <div className="mt-8 p-4 rounded-lg" style={{ background: 'hsl(var(--b2))', border: '1px solid hsl(var(--b3))' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'hsl(var(--bc) / 0.7)' }}>💡 Helpful Tips</p>
          <ul className="text-sm space-y-2 text-left" style={{ color: 'hsl(var(--bc) / 0.7))' }}>
            <li>• Try different dates to find available buses</li>
            <li>• Check alternative routes or nearby cities</li>
            <li>• Look for buses departing at different times</li>
          </ul>
        </div>
      </div>
    </div>
  )

  const passengerCount = passengerDetails.length
  const busPrice = bus?.price || 0
  const basePrice = busPrice * passengerCount
  const taxes = Math.round(basePrice * 0.18)
  const totalAmount = basePrice + taxes

  const validatePassengersForm = () => {
    const errs = {}

    if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!contact.phone || contact.phone.trim().length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number.'
    }

    passengerDetails.forEach((p, i) => {
      if (!p.name.trim()) errs[`p_${i}_name`] = 'Name is required.'
      if (!p.age) errs[`p_${i}_age`] = 'Age is required.'
    })

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleProceedToPassengers = () => {
    if (!user) {
      setPendingStep(2)
      setShowLoginModal(true)
      return
    }
    setStep(2)
  }

      const handleProceedToPayment = () => {
    if (!user) {
      setPendingStep(3)
      setShowLoginModal(true)
      return
    }
    if (validatePassengersForm()) {
      setStep(3)
    } else {
      const firstErr = Object.keys(errors)[0]
      if (firstErr) {
        const el = document.getElementById(firstErr)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setPendingStep(3)
      setShowLoginModal(true)
      return
    }

    if (!bus) {
      showToast('Bus details not found. Please go back and select a bus.', 'error')
      return
    }

    setPaymentLoading(true)
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        showToast('Please login to continue with payment', 'error')
        setPaymentLoading(false)
        return
      }

      // Verify Razorpay is loaded
      if (!window.Razorpay) {
        showToast('Razorpay not loaded. Please refresh and try again.', 'error')
        setPaymentLoading(false)
        return
      }

      // Step 1: Create Razorpay order
      console.log('Creating Razorpay order...')
      const orderResponse = await api.post('/payment/create-order', {
        amount: totalAmount,
        currency: 'INR',
        notes: {
          bookingType: 'bus',
          busId: bus.id,
          passengers: passengerDetails.length
        }
      })

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order')
      }

      const { orderId, amount, currency } = orderResponse.data

      // Step 2: Open Razorpay checkout
      const razorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Sqpk2eYSSYrvWf',
        amount: amount,
        currency: currency,
        order_id: orderId,
        name: 'MakeMyTrip',
        description: `Bus Booking - ${bus?.operatorName || 'Bus'} (${bus?.source || bus?.from} → ${bus?.destination || bus?.to})`,
        image: `${window.location.origin}${photo('state-success', 400)}`,
        prefill: {
          name: passengerDetails[0]?.name || 'Passenger',
          email: contact?.email || '',
          contact: contact?.phone || ''
        },
        handler: async (response) => {
          await verifyBusPayment(response, orderId)
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false)
            showToast('Payment cancelled', 'info')
          }
        },
        theme: {
          color: '#003580'
        }
      }

      const razorpay = new window.Razorpay(razorpayOptions)
      razorpay.open()
    } catch (error) {
      console.error('Payment initiation failed:', error)
      const errorMsg = error.message || error.response?.data?.message || 'Payment failed. Please try again.'
      showToast(errorMsg, 'error')
      setPaymentLoading(false)
    }
  }

  const verifyBusPayment = async (razorpayResponse, orderId) => {
    try {
      console.log('Verifying payment...')

      // Prepare booking data
      const bookingData = {
        type: 'bus',
        busId: bus.id,
        busOperator: bus?.operatorName || bus?.operator || 'Bus Operator',
        busType: bus?.type || 'AC',
        fromCity: bus?.from || bus?.source || '',
        toCity: bus?.to || bus?.destination || '',
        departureDate: searchDate || bus?.departure?.date || new Date().toISOString().split('T')[0],
        passengers: passengerDetails.map(p => ({ ...p })),
        totalAmount,
        baseFare: Math.round(totalAmount * 0.8),
        taxes: Math.round(totalAmount * 0.15),
        userEmail: contact?.email,
        userName: passengerDetails[0]?.name,
        paymentMethod: 'razorpay'
      }

      // Verify payment on backend
      const verifyResponse = await api.post('/payment/verify', {
        orderId: orderId,
        paymentId: razorpayResponse.razorpay_payment_id,
        signature: razorpayResponse.razorpay_signature,
        bookingData: bookingData
      })

      // Only the backend issues booking references. A locally generated one
      // would show the customer a confirmation that matches nothing in Firestore.
      if (!verifyResponse.success || !verifyResponse.data?.booking?.bookingId) {
        throw new Error(verifyResponse.message || 'Payment verification failed')
      }

      const booking = verifyResponse.data.booking

      setBookingDetails({
        ...booking,
        id: booking.bookingId,
        operatorName: booking.busOperator || bus?.operatorName || 'Bus Operator',
        type: booking.busType || bus?.type || 'AC',
        paymentStatus: 'completed',
        transactionId: razorpayResponse.razorpay_payment_id,
        paymentId: razorpayResponse.razorpay_payment_id
      })

      showToast('✅ Payment successful! Your bus booking is confirmed.', 'success')
      setStep(4)
    } catch (err) {
      console.error('Payment verification error:', err)
      showToast(err.message || 'Payment verification failed. Please contact support.', 'error')
      setPaymentLoading(false)
    }
  }

  const downloadTicket = async () => {
    const ticketElement = document.getElementById('ticket-content')
    if (!ticketElement) return

    try {
      const canvas = await html2canvas(ticketElement, { scale: 2 })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save(`bus-ticket-${bookingDetails.id}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
    }
  }

  // Guard: Show loading state if data is loading
  if (isLoading && !bus) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--b2))', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: 'hsl(var(--nc))', fontSize: '1.125rem' }}>Loading bus details...</p>
        </div>
      </div>
    )
  }

  // Guard: Show error if bus data not found
  if (!bus) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--b2))', padding: '2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'hsl(var(--b1))', padding: '2rem', borderRadius: '0.5rem', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ margin: '0 0 0.5rem', color: 'hsl(var(--er))' }}>Bus Not Found</h2>
          <p style={{ color: 'hsl(var(--nc))', marginBottom: '1.5rem' }}>The bus you're trying to book is no longer available.</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    )
  }


  const handleOtpLoginSuccess = () => {
    setShowLoginModal(false)
    if (pendingStep) setStep(pendingStep)
  }

  return (
    <div className="bus-flow-wrapper">
      <div className="bus-flow-container">
        <div className="bus-page-title">
          <h1>Book Your Bus</h1>
          <div className="bus-steps-bar">
            <div className={`bus-step${step >= 1 ? ' completed' : ''}`}>
              <div className="bus-step-num">{step > 1 ? '✓' : '1'}</div>
              <span>1. Bus Details</span>
            </div>
            <div className="bus-step-sep">――――</div>
            <div className={`bus-step${step >= 2 ? ' completed' : ''}${step === 2 ? ' active' : ''}`}>
              <div className="bus-step-num">{step > 2 ? '✓' : '2'}</div>
              <span>2. Passenger Info</span>
            </div>
            <div className="bus-step-sep">――――</div>
            <div className={`bus-step${step >= 3 ? ' completed' : ''}${step === 3 ? ' active' : ''}`}>
              <div className="bus-step-num">{step > 3 ? '✓' : '3'}</div>
              <span>3. Review &amp; Pay</span>
            </div>
            <div className="bus-step-sep">――――</div>
            <div className={`bus-step${step === 4 ? ' active' : ''}`}>
              <div className="bus-step-num">{step === 4 ? '✓' : '4'}</div>
              <span>4. Confirmation</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="bus-form-card">
            <h2 className="bus-form-title">Review Bus Details</h2>
            <div className="bus-details-grid">
              <div className="bus-detail-item">
                <span className="bus-detail-label">Operator</span>
                <span className="bus-detail-value">{bus.operatorName}</span>
              </div>
              <div className="bus-detail-item">
                <span className="bus-detail-label">Bus Type</span>
                <span className="bus-detail-value">{bus.type || 'AC'}</span>
              </div>
              <div className="bus-detail-item">
                <span className="bus-detail-label">Departure</span>
                <span className="bus-detail-value">{fmtTime(bus.departure?.time)}</span>
                <span className="bus-detail-sub">{fmtDate(bus.departure?.date)} - {bus.from}</span>
              </div>
              <div className="bus-detail-item">
                <span className="bus-detail-label">Arrival</span>
                <span className="bus-detail-value">{fmtTime(bus.arrival?.time)}</span>
                <span className="bus-detail-sub">{fmtDate(bus.arrival?.date)} - {bus.to}</span>
              </div>
              <div className="bus-detail-item">
                <span className="bus-detail-label">Duration</span>
                <span className="bus-detail-value">{fmtDuration(bus.durationMinutes)}</span>
              </div>
              <div className="bus-detail-item">
                <span className="bus-detail-label">Price Per Seat</span>
                <span className="bus-detail-value">{fmtPrice(bus.price)}</span>
              </div>
            </div>

            {bus.amenities && bus.amenities.length > 0 && (
              <div className="bus-amenities">
                <span className="bus-amenities-label">Amenities</span>
                <div className="bus-amenities-list">
                  {bus.amenities.map((a, i) => (
                    <span key={i} className="bus-amenity-tag">{a}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="bus-button-row">
              <button className="bus-btn-outline" onClick={() => navigate(-1)}>Cancel</button>
              <button className="bus-btn-primary" onClick={handleProceedToPassengers}>
                Continue to Passengers
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bus-form-card">
            <h2 className="bus-form-title">Passenger Details</h2>

            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'hsl(var(--b2))', borderRadius: '0.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Contact Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>EMAIL</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    id="email"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: `1px solid ${errors.email ? 'hsl(var(--er))' : 'hsl(var(--b2))'}`,
                      borderRadius: '0.375rem'
                    }}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p style={{ color: 'hsl(var(--er))', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>PHONE</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    id="phone"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: `1px solid ${errors.phone ? 'hsl(var(--er))' : 'hsl(var(--b2))'}`,
                      borderRadius: '0.375rem'
                    }}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                  {errors.phone && <p style={{ color: 'hsl(var(--er))', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors.phone}</p>}
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Passengers ({passengerCount})</h3>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {passengerDetails.map((p, i) => (
                <div key={i} style={{ padding: '1rem', background: 'hsl(var(--b2))', borderRadius: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>SEAT {p.seat}</label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const updated = [...passengerDetails]
                        updated[i].name = e.target.value
                        setPassengerDetails(updated)
                      }}
                      id={`p_${i}_name`}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${errors[`p_${i}_name`] ? 'hsl(var(--er))' : 'hsl(var(--b2))'}`,
                        borderRadius: '0.375rem'
                      }}
                      placeholder="Full name"
                    />
                    {errors[`p_${i}_name`] && <p style={{ color: 'hsl(var(--er))', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors[`p_${i}_name`]}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>AGE</label>
                    <input
                      type="number"
                      value={p.age}
                      onChange={(e) => {
                        const updated = [...passengerDetails]
                        updated[i].age = e.target.value
                        setPassengerDetails(updated)
                      }}
                      id={`p_${i}_age`}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${errors[`p_${i}_age`] ? 'hsl(var(--er))' : 'hsl(var(--b2))'}`,
                        borderRadius: '0.375rem'
                      }}
                      placeholder="Age"
                      min="1"
                      max="120"
                    />
                    {errors[`p_${i}_age`] && <p style={{ color: 'hsl(var(--er))', fontSize: '0.875rem', marginTop: '0.25rem' }}>{errors[`p_${i}_age`]}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>GENDER</label>
                    <select
                      value={p.gender}
                      onChange={(e) => {
                        const updated = [...passengerDetails]
                        updated[i].gender = e.target.value
                        setPassengerDetails(updated)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '0.375rem'
                      }}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={handleProceedToPayment}>
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ marginBottom: '2rem' }}>
            {/* Main Payment Layout - 3 Column */}
            <form onSubmit={handlePaymentSubmit} style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '2rem', marginBottom: '2rem' }}>

              {/* Left Column: Payment Options */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>SELECT PAYMENT MODE</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '2px solid hsl(var(--p))',
                    background: 'hsl(var(--b1))',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <input type="radio" name="payment" value="upi" defaultChecked style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📱 UPI (GPay, PhonePe, BHIM)</span>
                  </label>

                  <label style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid hsl(var(--b2))',
                    background: 'hsl(var(--b1))',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <input type="radio" name="payment" value="card" style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>💳 Credit / Debit Card</span>
                  </label>

                  <label style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid hsl(var(--b2))',
                    background: 'hsl(var(--b1))',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <input type="radio" name="payment" value="netbanking" style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🏦 Net Banking</span>
                  </label>

                  {/* Buttons at bottom */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
                    <button type="button" onClick={() => setStep(2)} style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid hsl(var(--b2))',
                      background: 'hsl(var(--b1))',
                      color: 'hsl(var(--bc))',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}>
                      ← Back
                    </button>
                  </div>
                </div>
              </div>

              {/* Center Column: Payment Interface */}
              <div style={{ background: 'hsl(var(--b1))', padding: '2rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--b2))' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>PAY USING UNIFIED PAYMENTS INTERFACE</h3>

                <div style={{ background: 'hsl(var(--b2))', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>Enter your Virtual Private Address (VPA) or scan the generated QR code below.</p>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'left', color: 'hsl(var(--nc))' }}>ENTER UPI ID</label>
                    <input type="text" placeholder="username@upi" style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid hsl(var(--b2))',
                      background: 'hsl(var(--b1))',
                      color: 'hsl(var(--bc))',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }} />
                  </div>

                  {/* This previously rendered a decorative SVG built from
                      Math.random() and captioned it "scan to pay". It encoded
                      nothing, changed on every render, and would silently fail
                      for any customer who tried to scan it. UPI is collected
                      through Razorpay Checkout instead. */}
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'hsl(var(--nc))' }}>
                    Enter your UPI ID above and continue — you will approve the payment request in your UPI app.
                  </p>
                </div>
              </div>

              {/* Right Sidebar: Booking Summary */}
              <div style={{ background: 'hsl(var(--b1))', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid hsl(var(--b2))', height: 'fit-content', position: 'sticky', top: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--bc))' }}>BOOKING SUMMARY</h3>

                {/* Bus Details Card */}
                <div style={{ background: 'hsl(var(--b2))', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 700, color: 'hsl(var(--bc))', marginBottom: '0.25rem' }}>{bus.operatorName} {bus.type || 'AC'}</div>
                  <div style={{ color: 'hsl(var(--nc))', fontSize: '0.8rem' }}>
                    {bus.from} ({fmtTime(bus.departure?.time)}) → {bus.to} ({fmtTime(bus.arrival?.time)})
                  </div>
                </div>

                {/* Price Breakdown */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--b2))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>
                    <span>Base Charge ({passengerCount} × {fmtPrice(bus.price)})</span>
                    <span>{fmtPrice(basePrice)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--nc))' }}>
                    <span>Taxes:</span>
                    <span>{fmtPrice(taxes)}</span>
                  </div>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--p))' }}>
                  <span>Payable Amt:</span>
                  <span>{fmtPrice(totalAmount)}</span>
                </div>

                {/* Passengers */}
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(var(--b2))' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'hsl(var(--nc))' }}>PASSENGERS</div>
                  <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.8rem' }}>
                    {passengerDetails.slice(0, 3).map((p, i) => (
                      <div key={i}>• {p.name} (Age: {p.age})</div>
                    ))}
                    {passengerCount > 3 && <div style={{ color: 'hsl(var(--nc))' }}>+ {passengerCount - 3} more</div>}
                  </div>
                </div>

                {/* Pay Button */}
                <button type="submit" disabled={paymentLoading} style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'hsl(var(--p))',
                  color: 'white',
                  fontWeight: 700,
                  cursor: paymentLoading ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  opacity: paymentLoading ? 0.6 : 1
                }}>
                  {paymentLoading ? 'Processing...' : `PAY NOW ${fmtPrice(totalAmount)}`}
                </button>
              </div>

            </form>
          </div>
        )}

        {step === 4 && bookingDetails && (
          <div style={{ background: 'hsl(var(--b1))', borderRadius: '0.5rem', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
              <h2 style={{ margin: '0 0 0.5rem', color: 'hsl(var(--su))', fontSize: '1.875rem' }}>Booking Confirmed!</h2>
              <p style={{ margin: '0.5rem 0 0', color: 'hsl(var(--nc))' }}>Your bus ticket has been booked successfully</p>
            </div>

            <div id="ticket-content" style={{ padding: '2rem', background: 'hsl(var(--b2))', borderRadius: '0.5rem', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--b2))', paddingBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem' }}>Booking Confirmation</h3>
                <p style={{ margin: 0, color: 'hsl(var(--nc))', fontSize: '0.875rem' }}>Booking ID: <strong>{bookingDetails.id}</strong></p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'hsl(var(--nc))', fontWeight: 600, textTransform: 'uppercase' }}>OPERATOR</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{bus.operatorName}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'hsl(var(--nc))', fontWeight: 600, textTransform: 'uppercase' }}>BUS TYPE</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{bus.type || 'AC'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'hsl(var(--nc))', fontWeight: 600, textTransform: 'uppercase' }}>FROM</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{bus.from} - {fmtTime(bus.departure?.time)}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'hsl(var(--nc))', fontWeight: 600, textTransform: 'uppercase' }}>TO</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{bus.to} - {fmtTime(bus.arrival?.time)}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'hsl(var(--nc))', fontWeight: 600, textTransform: 'uppercase' }}>PASSENGERS</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{passengerCount}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'hsl(var(--nc))', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL AMOUNT</p>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{fmtPrice(totalAmount)}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--b2))' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>PASSENGERS</h4>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                  {passengerDetails.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{i + 1}. {p.name} (Age: {p.age})</span>
                      <span>Seat {p.seat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={downloadTicket}>
                <i className="fas fa-download"></i> Download Ticket
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>

      <OtpLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleOtpLoginSuccess}
      />
    </div>
  )
}
