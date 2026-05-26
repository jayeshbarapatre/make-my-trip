import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { vendorFlightsService } from '../../services/vendorService'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const VendorFlightForm = ({ flightId, onClose, onSuccess }) => {
  const isEditing = !!flightId
  const { theme, accentColor } = useTheme()

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    airline: '', flightNumber: '', from: '', to: '',
    departureTime: '', arrivalTime: '', durationMinutes: '',
    price: '', seatsAvailable: 180, image: ''
  })

  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad']

  useEffect(() => {
    if (isEditing) fetchFlight()
  }, [flightId])

  // Auto-calculate duration
  useEffect(() => {
    if (formData.departureTime && formData.arrivalTime) {
      const [depHour, depMin] = formData.departureTime.split(':').map(Number)
      const [arrHour, arrMin] = formData.arrivalTime.split(':').map(Number)

      let depTotalMin = depHour * 60 + depMin
      let arrTotalMin = arrHour * 60 + arrMin

      if (arrTotalMin < depTotalMin) {
        arrTotalMin += 24 * 60
      }

      const duration = arrTotalMin - depTotalMin
      setFormData(prev => ({ ...prev, durationMinutes: Math.max(0, duration) }))
    }
  }, [formData.departureTime, formData.arrivalTime])

  const fetchFlight = async () => {
    try {
      setLoading(true)
      const response = await vendorFlightsService.getById(flightId)
      const flight = response.data.data.flight
      setFormData({
        airline: flight.airline, flightNumber: flight.flightNumber,
        from: flight.from, to: flight.to, departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime, durationMinutes: flight.durationMinutes,
        price: flight.price, seatsAvailable: flight.seatsAvailable, image: flight.image || ''
      })
    } catch (err) {
      toast.error('Failed to load flight details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['durationMinutes', 'price', 'seatsAvailable'].includes(name) ? Number(value) : value
    }))
  }

  const validateForm = () => {
    if (!formData.airline.trim() || !formData.flightNumber.trim()) { toast.error('Please fill airline details'); return false; }
    if (!formData.from || !formData.to) { toast.error('Please select cities'); return false; }
    if (formData.from === formData.to) { toast.error('Departure and arrival cities must be different'); return false; }
    if (!formData.departureTime || !formData.arrivalTime) { toast.error('Please enter times'); return false; }
    if (!formData.durationMinutes || formData.durationMinutes <= 0) { toast.error('Invalid duration'); return false; }
    if (!formData.price || formData.price <= 0) { toast.error('Invalid price'); return false; }
    if (!formData.seatsAvailable || formData.seatsAvailable <= 0) { toast.error('Invalid seats'); return false; }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      const submitData = { ...formData, durationMinutes: Number(formData.durationMinutes), price: Number(formData.price), seatsAvailable: Number(formData.seatsAvailable) }

      if (isEditing) {
        await vendorFlightsService.update(flightId, submitData)
        toast.success('Flight updated successfully')
      } else {
        await vendorFlightsService.create(submitData)
        toast.success('Flight created successfully')
      }

      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save flight')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--bg-hover)',
    color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s', marginTop: '6px'
  }

  const labelStyle = {
    fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)'
  }

  return createPortal(
    <div 
      className="admin-layout modal-backdrop-overlay" 
      data-theme={theme}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 17, 23, 0.65)', backdropFilter: 'blur(12px)', padding: '24px',
        '--accent': accentColor
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .flight-modal-container {
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .flight-modal-container input:focus, .flight-modal-container select:focus {
          border-color: var(--accent) !important;
          background: var(--surface) !important;
        }
      `}</style>
      
      <div 
        className="flight-modal-container" 
        style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className={isEditing ? 'fas fa-pen' : 'fas fa-plane'}></i>
            </div>
            {isEditing ? 'Edit Flight Details' : 'Add New Flight'}
          </h2>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              width: '32px', height: '32px', minWidth: '32px', minHeight: '32px', 
              padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', flex: '0 0 32px', border: '1px solid var(--border)', 
              background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' 
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', flex: 1 }}>
            <span className="loading loading-spinner loading-lg text-primary" style={{ color: 'var(--accent)' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Flight Information
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="airline" style={labelStyle}>Airline Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input id="airline" name="airline" type="text" value={formData.airline} onChange={handleInputChange} placeholder="e.g., IndiGo, SpiceJet" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="flightNumber" style={labelStyle}>Flight Number <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input id="flightNumber" name="flightNumber" type="text" value={formData.flightNumber} onChange={handleInputChange} placeholder="e.g., 6E-123" required style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Route
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="from" style={labelStyle}>Departure City <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <select id="from" name="from" value={formData.from} onChange={handleInputChange} required style={inputStyle}>
                      <option value="">Select departure city</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="to" style={labelStyle}>Arrival City <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <select id="to" name="to" value={formData.to} onChange={handleInputChange} required style={inputStyle}>
                      <option value="">Select arrival city</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Schedule
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label htmlFor="departureTime" style={labelStyle}>Departure Time <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input id="departureTime" name="departureTime" type="time" value={formData.departureTime} onChange={handleInputChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="arrivalTime" style={labelStyle}>Arrival Time <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input id="arrivalTime" name="arrivalTime" type="time" value={formData.arrivalTime} onChange={handleInputChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="durationMinutes" style={labelStyle}>Duration (mins)</label>
                    <input id="durationMinutes" name="durationMinutes" type="number" value={formData.durationMinutes} readOnly style={{ ...inputStyle, background: 'var(--bg-default)', opacity: 0.7, cursor: 'not-allowed' }} />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Pricing & Availability
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="price" style={labelStyle}>Price (per passenger) <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="e.g., 5000" min="1" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="seatsAvailable" style={labelStyle}>Available Seats <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input id="seatsAvailable" name="seatsAvailable" type="number" value={formData.seatsAvailable} onChange={handleInputChange} placeholder="e.g., 180" min="1" required style={inputStyle} />
                  </div>
                </div>
              </div>

            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', background: 'var(--surface)' }}>
              <button type="button" className="btn" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '140px' }}>
                {submitting ? (
                  <span className="loading loading-spinner" style={{ width: '14px', height: '14px' }}></span>
                ) : (
                  <>
                    <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                    {isEditing ? 'Save Changes' : 'Create Flight'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}

export default VendorFlightForm
