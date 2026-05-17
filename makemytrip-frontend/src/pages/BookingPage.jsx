import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { flightService } from '../services/flightService'
import { useAuth } from '../context/AuthContext'
import { authService, bookingService } from '../services/authService'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
const fmtDateTime = (val) => {
  if (!val) return 'N/A'
  let dateObj
  if (typeof val === 'object' && val.date) {
    const [h, m] = (val.time || '00:00').split(':')
    const [year, month, day] = val.date.split('-')
    dateObj = new Date(Number(year), Number(month) - 1, Number(day))
    dateObj.setHours(parseInt(h) || 0, parseInt(m) || 0)
  } else {
    dateObj = new Date(val)
  }
  if (isNaN(dateObj.getTime())) return 'N/A'
  return dateObj.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const AIRLINE_COLOR = {
  'IndiGo': 'var(--clr-indigo)', 'Air India': 'var(--clr-airindia)',
  'Vistara': 'var(--clr-vistara)', 'SpiceJet': 'var(--clr-spicejet)',
  'Akasa Air': 'var(--clr-akasa)', 'Air India Express': 'var(--clr-aiexpress)',
}
const AIRLINE_CODE = {
  'IndiGo': '6E', 'Air India': 'AI', 'Vistara': 'UK',
  'SpiceJet': 'SG', 'Akasa Air': 'QP', 'Air India Express': 'IX',
}

export default function BookingPage() {
  const { flightId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const searchDate = location.state?.searchDate

  const { user, verifyOtpLogin } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [mobilePhone, setMobilePhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [pendingStep, setPendingStep] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [toastType, setToastType] = useState('info') // 'info', 'error', 'success'
  const [showToast, setShowToast] = useState(false)

  // Steps: 1: Select/Review Flight, 2: Traveller Details, 3: Review & Payment, 4: Confirmation
  const [step, setStep] = useState(1)

  const showToastMsg = (message, type = 'info') => {
    setToastMsg(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  // Passenger state configuration
  const [travellers] = useState(() => {
    try {
      const saved = localStorage.getItem('travellers_flight')
      return saved ? JSON.parse(saved) : { adults: 1, children: 0, infants: 0, class: 'Economy' }
    } catch {
      return { adults: 1, children: 0, infants: 0, class: 'Economy' }
    }
  })

  // Dynamic passenger lists generator
  const [travellerDetails, setTravellerDetails] = useState(() => {
    const list = []
    for (let i = 0; i < (travellers.adults || 1); i++) {
      list.push({ type: 'Adult', firstName: '', lastName: '', gender: 'Male', dob: '', seat: 'Window', meal: 'Veg' })
    }
    for (let i = 0; i < (travellers.children || 0); i++) {
      list.push({ type: 'Child', firstName: '', lastName: '', gender: 'Male', dob: '', seat: 'Standard', meal: 'Veg' })
    }
    for (let i = 0; i < (travellers.infants || 0); i++) {
      list.push({ type: 'Infant', firstName: '', lastName: '', gender: 'Male', dob: '', seat: 'None', meal: 'Baby Food' })
    }
    return list
  })

  // Contact info state
  const [passenger, setPassenger] = useState({ email: '', phone: '' })
  const [errors, setErrors] = useState({})

  // Payment UI simulation state
  const [payMethod, setPayMethod] = useState('upi') // upi, card, netbanking
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [upiDetails, setUpiDetails] = useState({ vpa: '' })
  const [selectedBank, setSelectedBank] = useState('HDFC')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  // Confirmation data state
  const [bookingDetails, setBookingDetails] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['flight', flightId],
    queryFn: () => flightService.getById(flightId),
    retry: false,
  })

  const rawFlight = data?.data || location.state?.flight
  const flight = rawFlight ? (() => {
    const departure = typeof rawFlight.departure === 'string' ? JSON.parse(rawFlight.departure) : rawFlight.departure
    const arrival = typeof rawFlight.arrival === 'string' ? JSON.parse(rawFlight.arrival) : rawFlight.arrival

    // Use search date if provided, otherwise use flight's date
    const dateToUse = searchDate || departure?.date

    // Calculate arrival date (next day if flight crosses midnight, same day otherwise)
    let arrivalDate = dateToUse
    if (arrival?.time && departure?.time) {
      const [depH, depM] = (departure.time || '00:00').split(':').map(Number)
      const [arrH, arrM] = (arrival.time || '00:00').split(':').map(Number)
      const depMinutes = depH * 60 + depM
      const arrMinutes = arrH * 60 + arrM

      if (arrMinutes < depMinutes) {
        // Flight crosses midnight
        const date = new Date(dateToUse)
        date.setDate(date.getDate() + 1)
        arrivalDate = date.toISOString().split('T')[0]
      }
    }

    return {
      ...rawFlight,
      departure: { ...departure, date: dateToUse },
      arrival: { ...arrival, date: arrivalDate },
      source: departure?.city || rawFlight.source,
      destination: arrival?.city || rawFlight.destination,
    }
  })() : null

  // Reset scroll on step navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  if (isLoading && !flight) return (
    <div style={s.statusWrap}><p style={s.statusText}>Loading flight details…</p></div>
  )
  if (!flight) return (
    <div style={s.statusWrap}>
      <p style={s.statusText}>Flight not found.</p>
      <button style={s.btnSecondary} onClick={() => navigate(-1)}>Go Back</button>
    </div>
  )

  const airlineColor = AIRLINE_COLOR[flight.airline] || 'var(--clr-primary)'
  const airlineCode = AIRLINE_CODE[flight.airline] || flight.airline.slice(0, 2).toUpperCase()

  // Dynamic fare calculations based on current traveller details (not fixed initial count)
  const adultsCount = travellerDetails.filter(t => t.type === 'Adult').length
  const childrenCount = travellerDetails.filter(t => t.type === 'Child').length
  const infantsCount = travellerDetails.filter(t => t.type === 'Infant').length

  const seatFees = travellerDetails.reduce((sum, t) => {
    if (t.seat === 'Window') return sum + 350
    if (t.seat === 'Aisle') return sum + 250
    if (t.seat === 'Legroom') return sum + 600
    return sum
  }, 0)

  const totalPassengers = adultsCount + childrenCount + infantsCount
  const basePrice = flight.price * (adultsCount + childrenCount) + Math.round(flight.price * 0.4 * infantsCount)
  const taxes = Math.round(basePrice * 0.18)
  const totalAmount = basePrice + taxes + seatFees

  // Form inputs validation handler
  const validateTravellersForm = () => {
    const errs = {}

    // Contact checks
    if (!passenger.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!passenger.phone || passenger.phone.trim().length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number.'
    }

    // Dynamic checks
    travellerDetails.forEach((t, i) => {
      if (!t.firstName.trim()) errs[`t_${i}_firstName`] = 'First name is required.'
      if (!t.lastName.trim()) errs[`t_${i}_lastName`] = 'Last name is required.'
      if (!t.dob) errs[`t_${i}_dob`] = 'Date of birth is required.'
    })

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleProceedToTravellers = () => {
    if (!user) {
      showToastMsg("Please login to continue booking", "info")
      setPendingStep(2)
      setShowLoginModal(true)
      return
    }
    setStep(2)
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!mobilePhone || mobilePhone.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile number')
      return
    }
    setLoginError('')
    try {
      const res = await authService.sendMobileOtp(mobilePhone)
      if (res && (res.data || res.message)) {
        setOtpSent(true)
      } else {
        setLoginError('Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setLoginError(err.message || 'Failed to send OTP. Please try again.')
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      setLoginError('Please enter a valid 6-digit OTP (e.g., 123456)')
      return
    }
    setLoginError('')
    try {
      await verifyOtpLogin(mobilePhone, otpCode)
      setShowLoginModal(false)
      if (pendingStep) {
        setStep(pendingStep)
      }
    } catch (err) {
      setLoginError(err.message || 'Verification failed. Try 123456.')
    }
  }

  const handleProceedToPayment = () => {
    if (!user) {
      showToastMsg("Please login to continue booking", "info")
      setPendingStep(3)
      setShowLoginModal(true)
      return
    }
    if (validateTravellersForm()) {
      setStep(3)
    } else {
      const firstErr = Object.keys(errors)[0]
      if (firstErr) {
        const el = document.getElementById(firstErr)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      showToastMsg("Please login to continue booking", "info")
      setPendingStep(3)
      setShowLoginModal(true)
      return
    }

    if (payMethod === 'upi' && !upiDetails.vpa.includes('@')) {
      showToastMsg('Please enter a valid UPI ID (e.g. name@okhdfc)', 'error')
      return
    }
    if (payMethod === 'card' && (cardDetails.number.length < 16 || cardDetails.cvv.length < 3)) {
      showToastMsg('Please enter valid 16-digit card and CVV details.', 'error')
      return
    }

    setPaymentLoading(true)
    setLoadingMessage('Contacting payment gateway...')

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const generateRandomString = (len) => Array.from({ length: len }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('')

    setTimeout(() => {
      setLoadingMessage('Authorizing transaction with bank secure server...')
      setTimeout(() => {
        setLoadingMessage('Generating confirmed itinerary and PNR ticket...')
        setTimeout(() => {
          setPaymentLoading(false)

          const departureObj = typeof flight.departure === 'object' ? flight.departure : { date: '2026-05-20' }
          const arrivalObj = typeof flight.arrival === 'object' ? flight.arrival : {}
          const bookingPayload = {
            type: 'flight',
            flightId: flight.id,
            fromCity: flight.source || (typeof flight.departure === 'object' ? flight.departure.city : ''),
            toCity: flight.destination || (typeof flight.arrival === 'object' ? flight.arrival.city : ''),
            departureDate: departureObj.date || '2026-05-20',
            returnDate: arrivalObj.date,
            travellers: travellerDetails,
            totalAmount: totalAmount,
            contact: passenger,
            userEmail: passenger?.email,
            userName: user?.name
          }

          bookingService.createBooking(bookingPayload).then((res) => {
            const confirmedData = res?.data || {}
            setBookingDetails({
              bookingId: confirmedData.bookingId || 'MMT' + Math.floor(10000000 + Math.random() * 90000000),
              pnr: confirmedData.pnr || generateRandomString(6),
              flight,
              travellers: travellerDetails,
              contact: passenger,
              amount: totalAmount,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            })
            setStep(4)
          }).catch(err => {
            console.error(err)
            setBookingDetails({
              bookingId: 'MMT' + Math.floor(10000000 + Math.random() * 90000000),
              pnr: generateRandomString(6),
              flight,
              travellers: travellerDetails,
              contact: passenger,
              amount: totalAmount,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            })
            setStep(4)
          })
        }, 1000)
      }, 1000)
    }, 1000)
  }

  const handleDownloadPDF = async () => {
    const element = document.getElementById('e-ticket-content')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`MMT_Ticket_${bookingDetails?.pnr || 'Booking'}.pdf`)
    } catch (error) {
      console.error('PDF Generation Error:', error)
      showToastMsg('Failed to generate PDF. Please try again.', 'error')
    }
  }

  return (
    <div style={s.page}>

      {/* ── Wizard progress indicator bar ── */}
      <div style={s.wizardBar}>
        <div style={s.wizardInner}>
          {[
            { num: 1, label: 'Review Flight' },
            { num: 2, label: 'Add Travellers' },
            { num: 3, label: 'Make Payment' },
            { num: 4, label: 'Success Ticket' }
          ].map((item) => (
            <div key={item.num} style={s.wizardStep}>
              <div style={{
                ...s.wizardNum,
                ...(step === item.num ? s.wizardNumActive : {}),
                ...(step > item.num ? s.wizardNumDone : {})
              }}>
                {step > item.num ? '✓' : item.num}
              </div>
              <span style={{
                ...s.wizardLabel,
                ...(step === item.num ? s.wizardLabelActive : {})
              }}>{item.label}</span>
              {item.num < 4 && <div style={s.wizardLine} />}
            </div>
          ))}
        </div>
      </div>

      <div style={s.container}>

        {step < 4 && (
          <nav style={s.breadcrumb}>
            <button style={s.breadcrumbLink} onClick={() => {
              if (step > 1) setStep(step - 1)
              else navigate(-1)
            }}>
              ← {step > 1 ? 'Back to previous step' : 'Back to flight listings'}
            </button>
          </nav>
        )}

        <div style={s.layout}>

          {/* ─────────────────────────────────────────────────── */}
          {/* STEP 1: REVIEW FLIGHT INFO & FARE DETAILS           */}
          {/* ─────────────────────────────────────────────────── */}
          {step === 1 && (
            <div style={s.fullWidthLayout}>
              <div style={s.leftColumn}>
                <h2 style={s.sectionHeader}>Review Flight Details</h2>

                <div style={s.cardPanel}>
                  <div style={s.flightHeader}>
                    <div style={{ ...s.logoBox, background: airlineColor }}>{airlineCode}</div>
                    <div>
                      <h3 style={s.airlineLabel}>{flight.airline}</h3>
                      <p style={s.flightSub}>{flight.flightNumber} · {travellers.class}</p>
                    </div>
                  </div>

                  <div style={s.itineraryRow}>
                    <div style={s.itineraryNode}>
                      <span style={s.itineraryTime}>{fmtTime(flight.departure)}</span>
                      <span style={s.itineraryCity}>{flight.source}</span>
                      <span style={s.itinerarySub}>{fmtDateTime(flight.departure)}</span>
                    </div>

                    <div style={s.itineraryMiddle}>
                      <span style={s.itineraryDuration}>{fmtDuration(flight.duration)}</span>
                      <div style={s.itineraryLineBlock}>
                        <span style={s.lineDot} />
                        <span style={s.lineBar} />
                        <span style={s.linePlaneIcon}>✈</span>
                        <span style={s.lineBar} />
                        <span style={s.lineDot} />
                      </div>
                      <span style={s.itineraryStops}>
                        {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop`}
                      </span>
                    </div>

                    <div style={{ ...s.itineraryNode, alignItems: 'flex-end' }}>
                      <span style={s.itineraryTime}>{fmtTime(flight.arrival)}</span>
                      <span style={s.itineraryCity}>{flight.destination}</span>
                      <span style={s.itinerarySub}>{fmtDateTime(flight.arrival)}</span>
                    </div>
                  </div>

                  {flight.stops > 0 && (
                    <div style={s.layoverBadge}>
                      ⚠️ Connection Flight: 1 stopover with short layover details in matching local terminal.
                    </div>
                  )}

                  <div style={s.baggageSummary}>
                    <div style={s.baggageItem}>💼 <strong>Cabin Baggage:</strong> 7 kg per traveller</div>
                    <div style={s.baggageItem}>🧳 <strong>Check-in Baggage:</strong> {flight.baggage || '15 kg'} included</div>
                  </div>
                </div>

                <div style={s.refundableTerms}>
                  <p style={{ margin: 0, fontWeight: 700, color: flight.refundable ? '#2e7d32' : '#c62828' }}>
                    {flight.refundable ? '✓ Refundable Ticket' : '✗ Cancellation penalties apply (Non-refundable)'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Standard cancellation charges of the airline will apply if cancelled before departure.
                  </p>
                </div>
              </div>

              <div style={s.rightColumn}>
                <div style={s.fareSummaryCard}>
                  <h3 style={s.summaryTitle}>Fare Summary</h3>

                  <div style={s.fareRowItem}>
                    <span>Base Fare ({totalPassengers} Traveller{totalPassengers > 1 ? 's' : ''})</span>
                    <span>{fmtPrice(basePrice)}</span>
                  </div>

                  <div style={s.fareRowItem}>
                    <span>Taxes &amp; Fees (GST 18%)</span>
                    <span>{fmtPrice(taxes)}</span>
                  </div>

                  {seatFees > 0 && (
                    <div style={s.fareRowItem}>
                      <span>Seat Preferences</span>
                      <span>{fmtPrice(seatFees)}</span>
                    </div>
                  )}

                  <div style={s.dividerLine} />

                  <div style={s.totalAmountRow}>
                    <span>Total Amount</span>
                    <span>{fmtPrice(totalAmount)}</span>
                  </div>

                  <button className="btn-primary" style={{ width: '100%' }} onClick={handleProceedToTravellers}>
                    PROCEED TO TRAVELLER DETAILS
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────── */}
          {/* STEP 2: TRAVELLER DETAILS FORM                      */}
          {/* ─────────────────────────────────────────────────── */}
          {step === 2 && (
            <div style={s.fullWidthLayout}>
              <div style={s.leftColumn}>
                <h2 style={s.sectionHeader}>Enter Traveller Details</h2>

                {travellerDetails.map((traveller, index) => (
                  <div key={index} style={s.cardPanel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={s.travellerFormTitle}>
                        👤 Traveller #{index + 1} ({traveller.type})
                      </h3>
                      {travellerDetails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTravellerDetails(prev => prev.filter((_, idx) => idx !== index))
                            showToastMsg(`Traveller #${index + 1} removed`, 'success')
                          }}
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = '#fca5a5'
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = '#fee2e2'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>

                    <div style={s.formGrid}>
                      <div style={s.fieldGroup} id={`t_${index}_firstName`}>
                        <label style={s.inputLabel}>First Name</label>
                        <input
                          style={{
                            ...s.textInput,
                            ...(errors[`t_${index}_firstName`] ? s.inputErrorBorder : {})
                          }}
                          placeholder="First / Given Name"
                          value={traveller.firstName}
                          onChange={(e) => {
                            const val = e.target.value
                            setTravellerDetails(prev => prev.map((item, idx) => idx === index ? { ...item, firstName: val } : item))
                          }}
                        />
                        {errors[`t_${index}_firstName`] && (
                          <span style={s.errorLabelText}>{errors[`t_${index}_firstName`]}</span>
                        )}
                      </div>

                      <div style={s.fieldGroup} id={`t_${index}_lastName`}>
                        <label style={s.inputLabel}>Last Name</label>
                        <input
                          style={{
                            ...s.textInput,
                            ...(errors[`t_${index}_lastName`] ? s.inputErrorBorder : {})
                          }}
                          placeholder="Last / Surname"
                          value={traveller.lastName}
                          onChange={(e) => {
                            const val = e.target.value
                            setTravellerDetails(prev => prev.map((item, idx) => idx === index ? { ...item, lastName: val } : item))
                          }}
                        />
                        {errors[`t_${index}_lastName`] && (
                          <span style={s.errorLabelText}>{errors[`t_${index}_lastName`]}</span>
                        )}
                      </div>

                      <div style={s.fieldGroup}>
                        <label style={s.inputLabel}>Gender</label>
                        <select
                          style={s.selectInput}
                          value={traveller.gender}
                          onChange={(e) => {
                            const val = e.target.value
                            setTravellerDetails(prev => prev.map((item, idx) => idx === index ? { ...item, gender: val } : item))
                          }}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div style={s.fieldGroup} id={`t_${index}_dob`}>
                        <label style={s.inputLabel}>Date of Birth</label>
                        <input
                          type="date"
                          style={{
                            ...s.textInput,
                            ...(errors[`t_${index}_dob`] ? s.inputErrorBorder : {})
                          }}
                          value={traveller.dob}
                          onChange={(e) => {
                            const val = e.target.value
                            setTravellerDetails(prev => prev.map((item, idx) => idx === index ? { ...item, dob: val } : item))
                          }}
                        />
                        {errors[`t_${index}_dob`] && (
                          <span style={s.errorLabelText}>{errors[`t_${index}_dob`]}</span>
                        )}
                      </div>
                    </div>

                    <div style={s.addonsBlock}>
                      <h4 style={s.addonsTitle}>Preferences &amp; Seats (Optional)</h4>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={s.addonLabel}>Meal Request</label>
                          <select
                            style={s.addonSelect}
                            value={traveller.meal}
                            onChange={(e) => {
                              const val = e.target.value
                              setTravellerDetails(prev => prev.map((item, idx) => idx === index ? { ...item, meal: val } : item))
                            }}
                          >
                            <option value="Veg">Vegetarian Hot Meal</option>
                            <option value="NonVeg">Non-Vegetarian Hot Meal</option>
                            <option value="Jain">Jain Meal</option>
                            <option value="None">No Meal</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={s.addonLabel}>Preferred Seat</label>
                          <select
                            style={s.addonSelect}
                            value={traveller.seat}
                            onChange={(e) => {
                              const val = e.target.value
                              setTravellerDetails(prev => prev.map((item, idx) => idx === index ? { ...item, seat: val } : item))
                            }}
                          >
                            <option value="Window">Window Seat (₹350)</option>
                            <option value="Aisle">Aisle Seat (₹250)</option>
                            <option value="Legroom">Extra Legroom Exit Row (₹600)</option>
                            <option value="Standard">Standard Seat (Free)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Contact Card */}
                <div style={s.cardPanel}>
                  <h3 style={s.travellerFormTitle}>📞 Contact Information</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '-10px 0 16px' }}>
                    Your ticket details and flight updates will be sent to these details.
                  </p>

                  <div style={s.formGrid}>
                    <div style={s.fieldGroup} id="email">
                      <label style={s.inputLabel}>Email Address</label>
                      <input
                        style={{
                          ...s.textInput,
                          ...(errors.email ? s.inputErrorBorder : {})
                        }}
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={passenger.email}
                        onChange={(e) => {
                          const val = e.target.value
                          setPassenger(prev => ({ ...prev, email: val }))
                        }}
                      />
                      {errors.email && <span style={s.errorLabelText}>{errors.email}</span>}
                    </div>

                    <div style={s.fieldGroup} id="phone">
                      <label style={s.inputLabel}>Phone Number</label>
                      <input
                        style={{
                          ...s.textInput,
                          ...(errors.phone ? s.inputErrorBorder : {})
                        }}
                        type="tel"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={passenger.phone}
                        onChange={(e) => {
                          const val = e.target.value
                          setPassenger(prev => ({ ...prev, phone: val }))
                        }}
                      />
                      {errors.phone && <span style={s.errorLabelText}>{errors.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={s.rightColumn}>
                <div style={s.fareSummaryCard}>
                  <h3 style={s.summaryTitle}>Itinerary Overview</h3>
                  <div style={s.overviewMiniCard}>
                    <div style={{ fontWeight: 800 }}>{flight.source} → {flight.destination}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {fmtDateTime(flight.departure)} · {flight.airline}
                    </div>
                  </div>

                  <div style={s.dividerLine} />

                  {seatFees > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
                      <span>Seat Fees</span>
                      <span>{fmtPrice(seatFees)}</span>
                    </div>
                  )}

                  <div style={s.totalAmountRow}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--clr-primary)' }}>{fmtPrice(totalAmount)}</span>
                  </div>

                  <button className="btn-primary" style={{ width: '100%' }} onClick={handleProceedToPayment}>
                    PROCEED TO PAYMENT
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────── */}
          {/* STEP 3: REVIEW & PAYMENT                            */}
          {/* ─────────────────────────────────────────────────── */}
          {step === 3 && (
            <div style={s.fullWidthLayout}>
              {paymentLoading ? (
                <div style={s.paymentLoadingOverlay}>
                  <div style={s.paymentSpinner} />
                  <h3 style={{ margin: '16px 0 8px', color: 'var(--clr-text-primary)' }}>
                    {loadingMessage}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--clr-text-secondary)' }}>
                    Please do not refresh the page or click back. We are securing your booking.
                  </p>
                </div>
              ) : (
                <>
                  <div style={s.leftColumn}>
                    <h2 style={s.sectionHeader}>Select Payment Mode</h2>

                    <div style={s.paymentPanelLayout}>
                      <div style={s.paymentModesCol}>
                        {[
                          { id: 'upi', label: 'UPI (GPay, PhonePe, BHIM)', icon: '📱' },
                          { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                          { id: 'netbanking', label: 'Net Banking', icon: '🏦' }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            style={{
                              ...s.paymentModeBtn,
                              ...(payMethod === mode.id ? s.paymentModeBtnActive : {})
                            }}
                            onClick={() => setPayMethod(mode.id)}
                          >
                            <span style={{ marginRight: '10px' }}>{mode.icon}</span>
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handlePaymentSubmit} style={s.paymentBodyCol}>
                        {payMethod === 'upi' && (
                          <div>
                            <h4 style={{ margin: '0 0 12px' }}>Pay using Unified Payments Interface</h4>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
                              Enter your Virtual Private Address (VPA) or scan the generated QR code below.
                            </p>

                            <div style={s.fieldGroup}>
                              <label style={s.inputLabel}>Enter UPI ID</label>
                              <input
                                style={s.textInput}
                                placeholder="username@upi"
                                value={upiDetails.vpa}
                                onChange={(e) => setUpiDetails({ vpa: e.target.value })}
                                required
                              />
                            </div>

                            <div style={s.qrWrapper}>
                              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=make-my-trip-upi-payment-gateway" alt="UPI Payment QR Code" style={s.qrImage} />
                              <p style={{ fontSize: '11px', color: '#6b7280', margin: '8px 0 0' }}>
                                Scan this QR code to pay instantly with any UPI app.
                              </p>
                            </div>
                          </div>
                        )}

                        {payMethod === 'card' && (
                          <div>
                            <h4 style={{ margin: '0 0 12px' }}>Pay using Credit or Debit Card</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div style={s.fieldGroup}>
                                <label style={s.inputLabel}>Card Number</label>
                                <input
                                  style={s.textInput}
                                  placeholder="XXXX XXXX XXXX XXXX"
                                  maxLength="16"
                                  value={cardDetails.number}
                                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                  required
                                />
                              </div>

                              <div style={s.fieldGroup}>
                                <label style={s.inputLabel}>Name on Card</label>
                                <input
                                  style={s.textInput}
                                  placeholder="Full name as written on card"
                                  value={cardDetails.name}
                                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                  required
                                />
                              </div>

                              <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={s.inputLabel}>Expiry (MM/YY)</label>
                                  <input
                                    style={s.textInput}
                                    placeholder="MM/YY"
                                    maxLength="5"
                                    value={cardDetails.expiry}
                                    onChange={(e) => {
                                      let value = e.target.value.replace(/\D/g, '')
                                      if (value.length > 4) value = value.slice(0, 4)
                                      if (value.length >= 2) {
                                        const month = value.slice(0, 2)
                                        const year = value.slice(2)
                                        const monthNum = parseInt(month)
                                        if (monthNum > 12) {
                                          value = month.slice(0, 1)
                                        } else {
                                          value = month + (year ? '/' + year : '')
                                        }
                                      }
                                      setCardDetails({ ...cardDetails, expiry: value })
                                    }}
                                    required
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={s.inputLabel}>CVV Code</label>
                                  <input
                                    type="password"
                                    style={s.textInput}
                                    placeholder="CVV"
                                    maxLength="3"
                                    value={cardDetails.cvv}
                                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {payMethod === 'netbanking' && (
                          <div>
                            <h4 style={{ margin: '0 0 12px' }}>Pay using Net Banking</h4>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
                              Select your bank from the popular banks list below.
                            </p>

                            <div style={s.fieldGroup}>
                              <label style={s.inputLabel}>Choose Bank</label>
                              <select
                                style={s.selectInput}
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                              >
                                <option value="HDFC">HDFC Bank</option>
                                <option value="SBI">State Bank of India</option>
                                <option value="ICICI">ICICI Bank</option>
                                <option value="AXIS">Axis Bank</option>
                                <option value="KOTAK">Kotak Mahindra Bank</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>
                          PAY NOW {fmtPrice(totalAmount)}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div style={s.rightColumn}>
                    <div style={s.fareSummaryCard}>
                      <h3 style={s.summaryTitle}>Booking Summary</h3>
                      <div style={s.summaryBreakdown}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Flight Charge:</span>
                          <span>{fmtPrice(basePrice)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span>Taxes:</span>
                          <span>{fmtPrice(taxes)}</span>
                        </div>

                        {seatFees > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>Seat Fees:</span>
                            <span>{fmtPrice(seatFees)}</span>
                          </div>
                        )}

                        <div style={s.dividerLine} />

                        <div style={{ ...s.totalAmountRow, margin: '8px 0 0' }}>
                          <span>Payable Amt:</span>
                          <span style={{ color: 'var(--clr-primary)' }}>{fmtPrice(totalAmount)}</span>
                        </div>
                      </div>

                      <div style={s.passengerRosterBlock}>
                        <div style={{ fontWeight: 800, fontSize: '12.5px', marginBottom: '6px' }}>PASSENGERS</div>
                        {travellerDetails.map((t, index) => (
                          <div key={index} style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
                            • {t.firstName} {t.lastName} ({t.type})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────── */}
          {/* STEP 4: BOOKING CONFIRMATION & MOCK TICKET         */}
          {/* ─────────────────────────────────────────────────── */}
          {step === 4 && bookingDetails && (
            <div style={s.confirmationWrapper}>
              {/* This ID is targeted by html2canvas for PDF generation */}
              <div id="e-ticket-content" style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={s.successBannerPremium}>
                  <div style={s.successBadgePremium}>
                    <span style={s.successIcon}>✓</span>
                  </div>
                  <h2 style={s.successTitlePremium}>Booking Confirmed!</h2>
                  <p style={s.successSubPremium}>
                    Your flight to <strong>{flight.destination}</strong> is secured. Bon voyage!
                  </p>
                  
                  <div style={s.pnrRibbon}>
                    <div style={s.pnrItem}>
                      <span style={s.pnrLabel}>PNR NUMBER</span>
                      <span style={s.pnrValue}>{bookingDetails.pnr}</span>
                    </div>
                    <div style={s.pnrDivider} />
                    <div style={s.pnrItem}>
                      <span style={s.pnrLabel}>BOOKING ID</span>
                      <span style={s.pnrValue}>{bookingDetails.bookingId}</span>
                    </div>
                  </div>
                </div>

                <div style={s.ticketBody}>
                  <div style={s.ticketGrid}>
                    {/* Left: Flight Details */}
                    <div style={s.ticketSection}>
                      <h3 style={s.ticketSecTitle}>Flight Information</h3>
                      <div style={s.ticketFlightCard}>
                        <div style={s.tfHeader}>
                          <div style={{ ...s.logoBox, background: airlineColor, width: '40px', height: '40px' }}>{airlineCode}</div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '16px' }}>{flight.airline}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{flight.flightNumber} · Economy</div>
                          </div>
                        </div>
                        
                        <div style={s.tfRoute}>
                          <div style={s.tfNode}>
                            <div style={s.tfTime}>{fmtTime(flight.departure)}</div>
                            <div style={s.tfCity}>{flight.source || (typeof flight.departure === 'object' ? flight.departure.city : 'N/A')}</div>
                            <div style={s.tfDate}>{
                              typeof flight.departure === 'object' && flight.departure.date
                                ? fmtDate(flight.departure.date)
                                : new Date(flight.departure).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            }</div>
                          </div>
                          
                          <div style={s.tfMid}>
                            <div style={s.tfDuration}>{fmtDuration(flight.duration)}</div>
                            <div style={s.tfLine}>
                              <div style={s.tfDot} />
                              <div style={s.tfLineBar} />
                              <span style={{ fontSize: '14px' }}>✈</span>
                              <div style={s.tfLineBar} />
                              <div style={s.tfDot} />
                            </div>
                            <div style={s.tfStops}>{flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}</div>
                          </div>
                          
                          <div style={{ ...s.tfNode, alignItems: 'flex-end', textAlign: 'right' }}>
                            <div style={s.tfTime}>{fmtTime(flight.arrival)}</div>
                            <div style={s.tfCity}>{flight.destination || (typeof flight.arrival === 'object' ? flight.arrival.city : 'N/A')}</div>
                            <div style={s.tfDate}>{
                              typeof flight.arrival === 'object' && flight.arrival.date
                                ? fmtDate(flight.arrival.date)
                                : new Date(flight.arrival).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            }</div>
                          </div>
                        </div>
                      </div>

                      <div style={s.ticketInfoRow}>
                        <div style={s.tiBlock}>
                          <span style={s.tiLabel}>Check-in Baggage</span>
                          <span style={s.tiVal}>{flight.baggage || '15 kg'} (1 piece)</span>
                        </div>
                        <div style={s.tiBlock}>
                          <span style={s.tiLabel}>Cabin Baggage</span>
                          <span style={s.tiVal}>7 kg (1 piece)</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Passenger & Payment */}
                    <div style={s.ticketSection}>
                      <h3 style={s.ticketSecTitle}>Passenger Roster</h3>
                      <div style={s.passengerList}>
                        {bookingDetails.travellers.map((t, idx) => (
                          <div key={idx} style={s.pRow}>
                            <div style={s.pNum}>{idx + 1}</div>
                            <div style={s.pInfo}>
                              <div style={s.pName}>{t.firstName} {t.lastName}</div>
                              <div style={s.pMeta}>{t.gender} · Seat: {t.seat} · Meal: {t.meal}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ ...s.ticketInfoRow, marginTop: '24px', borderTop: '1px dashed #e5e7eb', paddingTop: '16px' }}>
                        <div style={s.tiBlock}>
                          <span style={s.tiLabel}>Payment Status</span>
                          <span style={{ ...s.tiVal, color: '#059669' }}>SUCCESS</span>
                        </div>
                        <div style={s.tiBlock}>
                          <span style={s.tiLabel}>Total Paid</span>
                          <span style={{ ...s.tiVal, fontWeight: 900 }}>{fmtPrice(bookingDetails.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={s.ticketFooter}>
                    <div style={s.tfContact}>
                      <strong>Support:</strong> 1800 102 8747 | <strong>Email:</strong> support@makemytrip.com
                    </div>
                    <p style={s.tfNote}>
                      * Please carry a valid Photo ID for airport entry. Gate closes 45 mins before departure.
                    </p>
                  </div>
                </div>
              </div>

              <div style={s.receiptActionsRow}>
                <button
                  type="button"
                  className="btn-primary"
                  style={s.actionBtnMain}
                  onClick={handleDownloadPDF}
                >
                  📥 DOWNLOAD E-TICKET (PDF)
                </button>

                <button
                  type="button"
                  style={s.actionBtnSec}
                  onClick={() => {
                    showToastMsg(`Confirmation email sent to ${bookingDetails.contact.email}`, 'success');
                  }}
                >
                  ✉️ EMAIL TICKET
                </button>

                <button
                  type="button"
                  style={s.actionBtnHome}
                  onClick={() => navigate('/')}
                >
                  🏠 GO TO HOME
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {showLoginModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '420px',
            padding: '32px 28px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f3f4f6',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔐</span>
              <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: '#111827' }}>
                Login to Continue
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                MakeMyTrip requires verification before booking. Enter your mobile number to instantly login.
              </p>
            </div>

            {loginError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center', fontWeight: 600 }}>
                {loginError}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                    MOBILE NUMBER
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 700, color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={mobilePhone}
                      maxLength={10}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  style={{ width: '100%', background: 'var(--clr-primary, #ef4444)', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                >
                  GET ONE TIME PASSWORD (OTP)
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>
                      ENTER 6-DIGIT OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--clr-primary, #ef4444)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ width: '100%', border: '2px solid var(--clr-primary, #ef4444)', borderRadius: '8px', padding: '12px 14px', fontSize: '18px', fontWeight: 800, letterSpacing: '4px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                    autoFocus
                    required
                  />
                  <span style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: '#10b981', marginTop: '8px', fontWeight: 600 }}>
                    ✓ Simulated OTP sent! (Use test OTP: 123456)
                  </span>
                </div>
                <button
                  type="submit"
                  style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  VERIFY &amp; RESUME BOOKING
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Custom Toast Notification ── */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 10000,
          animation: 'slideInUp 0.3s ease-out'
        }}>
          <div style={{
            background: toastType === 'error' ? '#fee2e2' : toastType === 'success' ? '#dcfce7' : '#dbeafe',
            border: `1.5px solid ${toastType === 'error' ? '#fca5a5' : toastType === 'success' ? '#86efac' : '#93c5fd'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            minWidth: '300px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {toastType === 'error' ? '✕' : toastType === 'success' ? '✓' : 'ℹ'}
            </span>
            <span style={{
              color: toastType === 'error' ? '#991b1b' : toastType === 'success' ? '#15803d' : '#1e40af',
              fontWeight: 600,
              fontSize: '14px',
              flex: 1
            }}>
              {toastMsg}
            </span>
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                color: toastType === 'error' ? '#991b1b' : toastType === 'success' ? '#15803d' : '#1e40af',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                minHeight: '20px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// ── Booking page Inline Styles ──
const s = {
  page: {
    background: '#f4f6f8',
    minHeight: '100vh',
    paddingBottom: '56px',
  },
  wizardBar: {
    background: '#0a1118',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '16px 0',
    color: '#fff'
  },
  wizardInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    padding: '0 24px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  wizardStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    position: 'relative'
  },
  wizardNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.6)'
  },
  wizardNumActive: {
    background: '#EB2026',
    color: '#fff',
    boxShadow: '0 0 12px rgba(235,32,38,0.5)'
  },
  wizardNumDone: {
    background: '#2e7d32',
    color: '#fff'
  },
  wizardLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)'
  },
  wizardLabelActive: {
    color: '#fff',
    fontWeight: 800
  },
  wizardLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
    margin: '0 16px'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    padding: '24px',
    boxSizing: 'border-box'
  },
  breadcrumb: {
    marginBottom: '16px'
  },
  breadcrumbLink: {
    background: 'none',
    border: 'none',
    color: '#EB2026',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0
  },
  layout: {
    width: '100%'
  },
  fullWidthLayout: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },
  leftColumn: {
    flex: '1 1 640px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightColumn: {
    flex: '0 0 340px',
    position: 'sticky',
    top: '24px'
  },
  sectionHeader: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 900,
    color: '#131921'
  },
  cardPanel: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  flightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb'
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 900,
    color: '#fff'
  },
  airlineLabel: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#131921',
    margin: 0
  },
  flightSub: {
    fontSize: '11.5px',
    color: '#6b7280',
    margin: '2px 0 0'
  },
  itineraryRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px'
  },
  itineraryNode: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '110px'
  },
  itineraryTime: {
    fontSize: '26px',
    fontWeight: 900,
    color: '#131921',
    lineHeight: 1
  },
  itineraryCity: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#131921',
    marginTop: '6px'
  },
  itinerarySub: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '3px'
  },
  itineraryMiddle: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  itineraryDuration: {
    fontSize: '11.5px',
    color: '#6b7280',
    fontWeight: 600
  },
  itineraryLineBlock: {
    width: '100%',
    display: 'flex',
    alignItems: 'center'
  },
  lineDot: {
    width: '4px',
    height: '4px',
    background: '#9ca3af',
    borderRadius: '50%'
  },
  lineBar: {
    flex: 1,
    height: '1px',
    background: '#cbd5e1'
  },
  linePlaneIcon: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '0 4px'
  },
  itineraryStops: {
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#2e7d32',
    background: '#e8f5e9',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  layoverBadge: {
    background: '#fff9db',
    border: '1px solid #ffe3e3',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#b05a00',
    marginTop: '16px',
    fontWeight: 600
  },
  baggageSummary: {
    display: 'flex',
    gap: '24px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6'
  },
  baggageItem: {
    fontSize: '12.5px',
    color: '#4b5563'
  },
  refundableTerms: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '16px 20px'
  },
  fareSummaryCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },
  summaryTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 900,
    color: '#131921',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  fareRowItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13.5px',
    color: '#4b5563',
    marginBottom: '12px'
  },
  dividerLine: {
    height: '1px',
    background: '#e5e7eb',
    margin: '16px 0'
  },
  totalAmountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    fontSize: '16px',
    fontWeight: 900,
    color: '#131921',
    marginBottom: '20px'
  },
  btnPrimary: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(180deg, #ffc878, #f3a847)',
    color: '#131921',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(243,168,71,0.25)',
    transition: 'transform 0.1s'
  },
  btnSecondary: {
    padding: '12px 24px',
    background: 'none',
    border: '1.5px solid #EB2026',
    color: '#EB2026',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  statusWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: '16px'
  },
  statusText: {
    color: '#6b7280',
    fontSize: '15px'
  },

  /* Form details */
  travellerFormTitle: {
    margin: '0 0 16px',
    fontSize: '15px',
    fontWeight: 800,
    color: '#131921'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  inputLabel: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  textInput: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13.5px',
    outline: 'none',
    background: '#fff',
    transition: 'border-color 0.15s'
  },
  inputErrorBorder: {
    borderColor: '#ef4444',
    background: '#fffbfb'
  },
  errorLabelText: {
    fontSize: '11px',
    color: '#ef4444',
    marginTop: '2px',
    fontWeight: 500
  },
  selectInput: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13.5px',
    outline: 'none',
    background: '#fff'
  },
  addonsBlock: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6'
  },
  addonsTitle: {
    margin: '0 0 12px',
    fontSize: '12px',
    fontWeight: 800,
    color: '#6b7280',
    textTransform: 'uppercase'
  },
  addonLabel: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#6b7280'
  },
  addonSelect: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '12.5px',
    marginTop: '4px',
    background: '#f9fafb'
  },
  overviewMiniCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    padding: '12px',
    borderRadius: '8px'
  },

  /* Payment view */
  paymentPanelLayout: {
    display: 'flex',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  paymentModesCol: {
    flex: '0 0 240px',
    background: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column'
  },
  paymentModeBtn: {
    padding: '16px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 700,
    color: '#4b5563',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.15s'
  },
  paymentModeBtnActive: {
    background: '#fff',
    color: '#EB2026',
    borderLeft: '4px solid #EB2026'
  },
  paymentBodyCol: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '340px'
  },
  btnPrimaryPay: {
    width: '100%',
    padding: '14px',
    background: '#EB2026',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: '24px',
    letterSpacing: '0.5px',
    transition: 'background 0.15s'
  },
  qrWrapper: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  qrMock: {
    width: '140px',
    height: '140px',
    border: '2px dashed #9ca3af',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 800,
    color: '#6b7280',
    borderRadius: '8px'
  },
  qrImage: {
    width: '140px',
    height: '140px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  paymentLoadingOverlay: {
    flex: 1,
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '56px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  paymentSpinner: {
    width: '56px',
    height: '56px',
    border: '5px solid #f3f4f6',
    borderTopColor: '#EB2026',
    borderRadius: '50%',
    animation: 'hp-spin-anim 1s infinite linear'
  },
  summaryBreakdown: {
    fontSize: '13px',
    color: '#4b5563'
  },
  passengerRosterBlock: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6'
  },

  /* Confirmation */
  confirmationWrapper: {
    maxWidth: '860px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  successBanner: {
    background: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
    color: '#fff',
    borderRadius: '12px',
    padding: '36px 24px',
    textAlign: 'center',
    boxShadow: '0 10px 24px rgba(29,78,216,0.2)'
  },
  successIcon: {
    fontSize: '48px',
    display: 'block'
  },
  itineraryDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    alignItems: 'flex-start'
  },
  receiptRowBlock: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px 24px'
  },
  receiptLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase'
  },
  receiptVal: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#131921',
    marginTop: '2px'
  },
  passengerDetailRow: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 14px'
  },
  receiptActionsRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '12px',
    flexWrap: 'wrap'
  },
  actionBtnMain: {
    flex: '1 1 280px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: 800,
    letterSpacing: '0.5px'
  },
  actionBtnSec: {
    flex: '1 1 200px',
    padding: '16px',
    background: '#fff',
    border: '1.5px solid #EB2026',
    color: '#EB2026',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  actionBtnHome: {
    flex: '1 1 200px',
    padding: '16px',
    background: '#131921',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  },

  /* Premium Confirmation Styles */
  successBannerPremium: {
    background: 'linear-gradient(135deg, #0a1118 0%, #1c2b3d 100%)',
    color: '#fff',
    padding: '48px 24px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  successBadgePremium: {
    width: '64px',
    height: '64px',
    background: '#059669',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '32px',
    boxShadow: '0 0 20px rgba(5,150,105,0.4)'
  },
  successTitlePremium: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 900,
    letterSpacing: '-0.5px',
    color: '#fff'
  },
  successSubPremium: {
    margin: '8px 0 32px',
    fontSize: '16px',
    opacity: 0.8
  },
  pnrRibbon: {
    display: 'inline-flex',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    padding: '16px 32px'
  },
  pnrItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  pnrLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase'
  },
  pnrValue: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '1px'
  },
  pnrDivider: {
    width: '1px',
    background: 'rgba(255,255,255,0.2)',
    margin: '0 32px'
  },
  ticketBody: {
    padding: '32px'
  },
  ticketGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '40px'
  },
  ticketSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  ticketSecTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    margin: '0 0 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  ticketFlightCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px'
  },
  tfHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  tfRoute: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tfNode: {
    display: 'flex',
    flexDirection: 'column'
  },
  tfTime: {
    fontSize: '28px',
    fontWeight: 900,
    color: '#111827'
  },
  tfCity: {
    fontSize: '15px',
    fontWeight: 800,
    marginTop: '4px'
  },
  tfDate: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px'
  },
  tfMid: {
    flex: 1,
    padding: '0 24px',
    textAlign: 'center'
  },
  tfDuration: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px'
  },
  tfLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#cbd5e1'
  },
  tfDot: {
    width: '6px',
    height: '6px',
    background: '#cbd5e1',
    borderRadius: '50%'
  },
  tfLineBar: {
    flex: 1,
    height: '1px',
    background: '#cbd5e1'
  },
  tfStops: {
    marginTop: '8px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#059669'
  },
  ticketInfoRow: {
    display: 'flex',
    gap: '24px',
    marginTop: '20px'
  },
  tiBlock: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  tiLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 600,
    marginBottom: '4px'
  },
  tiVal: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827'
  },
  passengerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  pRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#f9fafb',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb'
  },
  pNum: {
    width: '24px',
    height: '24px',
    background: '#e5e7eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 800,
    color: '#4b5563'
  },
  pName: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#111827'
  },
  pMeta: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px'
  },
  ticketFooter: {
    marginTop: '40px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '20px',
    textAlign: 'center'
  },
  tfContact: {
    fontSize: '12px',
    color: '#4b5563',
    marginBottom: '8px'
  },
  tfNote: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: 0,
    fontStyle: 'italic'
  }
}
