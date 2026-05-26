import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { vendorCabsService } from '../../services/vendorService'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const VendorCabForm = ({ cabId, onClose, onSuccess }) => {
  const isEditing = !!cabId
  const { theme, accentColor } = useTheme()

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    operatorName: '',
    cabNumber: '',
    type: 'Economy',
    baseFare: '',
    perKmRate: '',
    perMinuteRate: '',
    currentCity: '',
    cabs: 20
  })

  useEffect(() => {
    if (isEditing) fetchCabDetails()
  }, [cabId])

  const fetchCabDetails = async () => {
    try {
      setLoading(true)
      const res = await vendorCabsService.getAll()
      const cab = res.data.data.cabs.find(c => c.id === cabId)
      if (cab) {
        setFormData({
          operatorName: cab.operatorName,
          cabNumber: cab.cabNumber,
          type: cab.type,
          baseFare: cab.baseFare,
          perKmRate: cab.perKmRate,
          perMinuteRate: cab.perMinuteRate,
          currentCity: cab.currentCity || '',
          cabs: cab.cabs
        })
      } else {
        toast.error('Cab not found')
        onClose()
      }
    } catch (err) {
      toast.error('Failed to load cab details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      if (isEditing) {
        await vendorCabsService.update(cabId, formData)
        toast.success('Cab updated successfully')
      } else {
        await vendorCabsService.create(formData)
        toast.success('Cab created successfully')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save cab')
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
        .cab-modal-container {
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .cab-modal-container input:focus, .cab-modal-container select:focus {
          border-color: var(--accent) !important;
          background: var(--surface) !important;
        }
      `}</style>

      <div 
        className="cab-modal-container" 
        style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className={isEditing ? 'fas fa-pen' : 'fas fa-taxi'}></i>
            </div>
            {isEditing ? 'Edit Cab Listing' : 'Add New Cab'}
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
              
              {/* Basic Information Section */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Basic Information
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Operator Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input name="operatorName" type="text" value={formData.operatorName} onChange={handleChange} placeholder="e.g., FastCabs" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Registration Number <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input name="cabNumber" type="text" value={formData.cabNumber} onChange={handleChange} placeholder="e.g., MH-12-AB-1234" required style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Cab Type <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <select name="type" value={formData.type} onChange={handleChange} required style={inputStyle}>
                      <option value="Economy">Economy</option>
                      <option value="Premium">Premium</option>
                      <option value="XL">XL</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Total Cabs of this model <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input name="cabs" type="number" value={formData.cabs} onChange={handleChange} min="1" required style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Pricing & Location Section */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Pricing & Location
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Base Fare (₹) <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input name="baseFare" type="number" value={formData.baseFare} onChange={handleChange} min="0" required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Per Km Rate (₹) <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input name="perKmRate" type="number" value={formData.perKmRate} onChange={handleChange} min="0" required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Per Minute Rate (₹) <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input name="perMinuteRate" type="number" value={formData.perMinuteRate} onChange={handleChange} min="0" required style={inputStyle} />
                  </div>
                </div>

                <div style={{ width: '100%' }}>
                  <label style={labelStyle}>Base City <span style={{ color: '#ff4d4f' }}>*</span></label>
                  <input name="currentCity" type="text" value={formData.currentCity} onChange={handleChange} placeholder="e.g. Mumbai" required style={inputStyle} />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--surface2)' }}>
              <button 
                type="button" 
                onClick={onClose}
                disabled={submitting}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, minWidth: '140px' }}
              >
                {submitting ? (
                  <span className="loading loading-spinner" style={{ width: '16px', height: '16px' }}></span>
                ) : (
                  isEditing ? 'Save Changes' : 'Add Cab'
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

export default VendorCabForm
