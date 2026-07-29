import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { vendorBusesService } from '../../services/vendorService'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad']
const amenitiesList = ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Movie']

const VendorBusForm = ({ busId, onClose, onSuccess }) => {
  const isEditing = !!busId
  const { theme, accentColor } = useTheme()

  const [formData, setFormData] = useState({
    operatorName: '', busNumber: '', type: 'AC',
    departure: { city: '' }, arrival: { city: '' },
    departureTime: '', arrivalTime: '', durationMinutes: 0,
    price: '', seatsAvailable: 45, amenities: [], image: ''
  })

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [_error, _setError] = useState('')

  const loadBus = async () => {
    try {
      setLoading(true)
      const response = await vendorBusesService.getAll()
      const bus = response.data.data.find(b => b._id === busId)
      if (bus) {
        setFormData(bus)
      } else {
        toast.error('Bus not found')
        onClose()
      }
    } catch (_err) {
      toast.error('Failed to load bus')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEditing) loadBus()
  }, [busId])

  useEffect(() => {
    if (formData.departureTime && formData.arrivalTime) {
      const [depHour, depMin] = formData.departureTime.split(':').map(Number)
      const [arrHour, arrMin] = formData.arrivalTime.split(':').map(Number)

      const depTotal = depHour * 60 + depMin
      let arrTotal = arrHour * 60 + arrMin
      if (arrTotal < depTotal) arrTotal += 24 * 60
      const durationMin = arrTotal - depTotal
      setFormData(prev => ({ ...prev, durationMinutes: Math.max(0, durationMin) }))
    }
  }, [formData.departureTime, formData.arrivalTime])

  const handleChange = (e) => {
    const { name, value, type: inputType } = e.target
    if (inputType === 'checkbox') {
      const newAmenities = formData.amenities.includes(value)
        ? formData.amenities.filter(a => a !== value)
        : [...formData.amenities, value]
      setFormData(prev => ({ ...prev, amenities: newAmenities }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: ['durationMinutes', 'price', 'seatsAvailable'].includes(name) ? Number(value) : value 
      }))
    }
  }

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.operatorName || !formData.busNumber) {
      toast.error('Please fill required bus details')
      return
    }
    if (!formData.departure.city || !formData.arrival.city) {
      toast.error('Please select departure and arrival cities')
      return
    }

    try {
      setSubmitting(true)
      if (isEditing) {
        await vendorBusesService.update(busId, formData)
        toast.success('Bus updated successfully')
      } else {
        await vendorBusesService.create(formData)
        toast.success('Bus added successfully')
      }
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bus')
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

  const hours = Math.floor(formData.durationMinutes / 60)
  const minutes = formData.durationMinutes % 60

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
        .bus-modal-container {
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .bus-modal-container input:focus, .bus-modal-container select:focus {
          border-color: var(--accent) !important;
          background: var(--surface) !important;
        }
      `}</style>
      
      <div 
        className="bus-modal-container" 
        style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsla(var(--w), 0.15)', color: 'hsl(var(--w))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className={isEditing ? 'fas fa-pen' : 'fas fa-bus'}></i>
            </div>
            {isEditing ? 'Edit Bus Details' : 'Add New Bus'}
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
                  Bus Information
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Operator Name <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input name="operatorName" type="text" value={formData.operatorName} onChange={handleChange} placeholder="e.g., RedBus Travels" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Bus Number <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input name="busNumber" type="text" value={formData.busNumber} onChange={handleChange} placeholder="e.g., RB-001" required style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Bus Type <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <select name="type" value={formData.type} onChange={handleChange} required style={inputStyle}>
                      <option value="AC">AC Sleeper</option>
                      <option value="Non-AC">Non-AC Seater</option>
                      <option value="Sleeper">Semi-Sleeper</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Price (₹) <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input name="price" type="number" value={formData.price} onChange={handleChange} min="1" required style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Route
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Departure City <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <select value={formData.departure.city} onChange={(e) => handleNestedChange('departure', 'city', e.target.value)} required style={inputStyle}>
                      <option value="">Select departure city</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Arrival City <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <select value={formData.arrival.city} onChange={(e) => handleNestedChange('arrival', 'city', e.target.value)} required style={inputStyle}>
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
                    <label style={labelStyle}>Departure Time <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input name="departureTime" type="time" value={formData.departureTime} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Arrival Time <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input name="arrivalTime" type="time" value={formData.arrivalTime} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Duration</label>
                    <input type="text" value={`${hours}h ${minutes}m`} readOnly style={{ ...inputStyle, background: 'var(--bg-default)', opacity: 0.7, cursor: 'not-allowed' }} />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Availability & Amenities
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Available Seats <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input name="seatsAvailable" type="number" value={formData.seatsAvailable} onChange={handleChange} min="1" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Image URL</label>
                    <input name="image" type="text" value={formData.image} onChange={handleChange} placeholder="Image URL (optional)" style={inputStyle} />
                  </div>
                </div>
                
                <div>
                  <label style={labelStyle}>Amenities</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                    {amenitiesList.map(amenity => (
                      <label key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          value={amenity}
                          checked={formData.amenities.includes(amenity)}
                          onChange={handleChange}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        {amenity}
                      </label>
                    ))}
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
                    {isEditing ? 'Save Changes' : 'Add Bus'}
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

export default VendorBusForm
