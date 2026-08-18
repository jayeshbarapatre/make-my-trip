import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { vendorHotelsService } from '../../services/vendorService'
import { useTheme } from '../../context/ThemeContext'
import toast from 'react-hot-toast'

const VendorHotelForm = ({ hotelId, onClose, onSuccess }) => {
  const isEditing = !!hotelId
  const { theme, accentColor } = useTheme()

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '', city: '', location: '', description: '',
    pricePerNight: '', price: '', rooms: 50, rating: 4,
    amenities: [], checkin: '14:00', checkout: '11:00', image: '', imagesInput: ''
  })

  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([])

  const amenitiesList = [
    'WiFi', 'Swimming Pool', 'Gym', 'Spa', 'Parking',
    'Air Conditioning', 'Restaurant', 'Bar', 'Conference Room', 'Laundry Service'
  ]

  const roomTypesList = [
    'Standard Room', 'Deluxe Room', 'Superior Room', 'Executive Room', 'Family Room',
    'Suite', 'Junior Suite', 'King Room', 'Twin Room', 'Single Room',
    'Double Room', 'Studio Room', 'Villa', 'Cottage', 'Penthouse',
    'Dormitory Room', 'Economy Room', 'Honeymoon Suite'
  ]

  const fetchHotel = async () => {
    try {
      setLoading(true)
      const response = await vendorHotelsService.getById(hotelId)
      const hotel = response.data.data.hotel
      setFormData({
        name: hotel.name, city: hotel.city, location: hotel.location || '',
        description: hotel.description || '', pricePerNight: hotel.pricePerNight,
        price: hotel.price, rooms: hotel.rooms, rating: hotel.rating,
        amenities: hotel.amenities || [], checkin: hotel.checkin || '14:00',
        checkout: hotel.checkout || '11:00', image: hotel.image || '',
        imagesInput: hotel.images && Array.isArray(hotel.images) ? hotel.images.join('\n') : ''
      })
      setSelectedAmenities(hotel.amenities || [])
      setSelectedRoomTypes(hotel.roomTypes || [])
    } catch (_err) {
      toast.error('Failed to load hotel details')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEditing) fetchHotel()
  }, [hotelId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['rooms', 'rating', 'price', 'pricePerNight'].includes(name) ? Number(value) : value
    }))
  }

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  const toggleRoomType = (rt) => {
    setSelectedRoomTypes(prev =>
      prev.includes(rt) ? prev.filter(r => r !== rt) : [...prev, rt]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.city || (!formData.pricePerNight && !formData.price)) {
      toast.error('Please fill in all required fields (Hotel Name, City, and Price)')
      return
    }

    try {
      setSubmitting(true)
      const imageArray = formData.imagesInput
        ? formData.imagesInput.split(/[\n,]+/).map(url => url.trim()).filter(url => url.length > 0)
        : []
      // Auto-sync pricePerNight and price if only one is provided
      const resolvedPrice = Number(formData.pricePerNight || formData.price)
      const submitData = {
        ...formData,
        pricePerNight: resolvedPrice,
        price: resolvedPrice,
        amenities: selectedAmenities,
        images: imageArray,
        roomTypes: selectedRoomTypes
      }
      delete submitData.imagesInput

      if (isEditing) {
        await vendorHotelsService.update(hotelId, submitData)
        toast.success('Hotel updated successfully')
      } else {
        await vendorHotelsService.create(submitData)
        toast.success('Hotel created successfully')
      }

      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hotel')
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
      className="modal-backdrop-overlay"
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
        .hotel-modal-container {
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hotel-modal-container input:focus, .hotel-modal-container textarea:focus {
          border-color: var(--accent) !important;
          background: var(--surface) !important;
        }
      `}</style>
      
      <div 
        className="hotel-modal-container" 
        style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsl(var(--su) / 0.15)', color: 'hsl(var(--su))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              <i className={isEditing ? 'fas fa-pen' : 'fas fa-plus'}></i>
            </div>
            {isEditing ? 'Edit Hotel Listing' : 'Create New Hotel'}
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
                  Basic Information
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="name" style={labelStyle}>Hotel Name <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Enter hotel name" required style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="city" style={labelStyle}>City <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input id="city" name="city" type="text" value={formData.city} onChange={handleInputChange} placeholder="e.g., Mumbai, Delhi" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="location" style={labelStyle}>Location</label>
                    <input id="location" name="location" type="text" value={formData.location} onChange={handleInputChange} placeholder="Specific area/neighborhood" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label htmlFor="description" style={labelStyle}>Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Tell guests about your hotel" rows="3" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Hotel Images
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="image" style={labelStyle}>Primary Image URL</label>
                  <input id="image" name="image" type="url" value={formData.image} onChange={handleInputChange} placeholder="Main thumbnail image URL (optional)" style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="imagesInput" style={labelStyle}>Additional Images (Bulk URLs)</label>
                  <textarea id="imagesInput" name="imagesInput" value={formData.imagesInput} onChange={handleInputChange} placeholder="Paste multiple image URLs here (separated by commas or new lines)" rows="4" style={{ ...inputStyle, resize: 'vertical' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Add as many URLs as you want, separated by a new line or comma.</p>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Pricing & Inventory
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div>
                    <label htmlFor="pricePerNight" style={labelStyle}>Price / Night (₹) <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input id="pricePerNight" name="pricePerNight" type="number" value={formData.pricePerNight} onChange={handleInputChange} placeholder="2000" required style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="price" style={labelStyle}>Base Price (₹) <span style={{ color: 'hsl(var(--er))' }}>*</span></label>
                    <input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="2000" required style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="rooms" style={labelStyle}>Total Rooms</label>
                    <input id="rooms" name="rooms" type="number" value={formData.rooms} onChange={handleInputChange} min="1" style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="rating" style={labelStyle}>Rating (0-5)</label>
                    <input id="rating" name="rating" type="number" value={formData.rating} onChange={handleInputChange} min="0" max="5" step="0.1" style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Check-in & Check-out
                </h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="checkin" style={labelStyle}>Check-in Time</label>
                    <input id="checkin" name="checkin" type="time" value={formData.checkin} onChange={handleInputChange} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="checkout" style={labelStyle}>Check-out Time</label>
                    <input id="checkout" name="checkout" type="time" value={formData.checkout} onChange={handleInputChange} style={inputStyle} />
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Room Categories & Amenities
                </h3>
                
                <div style={{ marginTop: '20px' }}>
                  <label style={labelStyle}>Room Categories</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {roomTypesList.map(rt => {
                      const isSelected = selectedRoomTypes.includes(rt);
                      return (
                        <div 
                          key={rt}
                          onClick={() => toggleRoomType(rt)}
                          style={{
                            padding: '8px 12px', borderRadius: '8px', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                            background: isSelected ? 'rgba(46, 193, 88, 0.05)' : 'var(--bg-hover)', color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                            fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                            userSelect: 'none'
                          }}
                        >
                          <i className={`fas fa-${isSelected ? 'check-square' : 'square'}`} style={{ fontSize: '14px', opacity: isSelected ? 1 : 0.4 }}></i>
                          <span style={{ fontWeight: isSelected ? 600 : 500 }}>{rt}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={labelStyle}>Amenities</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {amenitiesList.map(amenity => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <div 
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          style={{
                            padding: '8px 12px', borderRadius: '8px', border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                            background: isSelected ? 'rgba(46, 193, 88, 0.05)' : 'var(--bg-hover)', color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                            fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                            userSelect: 'none'
                          }}
                        >
                          <i className={`fas fa-${isSelected ? 'check-square' : 'square'}`} style={{ fontSize: '14px', opacity: isSelected ? 1 : 0.4 }}></i>
                          <span style={{ fontWeight: isSelected ? 600 : 500 }}>{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>

            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', background: 'var(--surface)' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: '140px' }}>
                {submitting ? (
                  <span className="loading loading-spinner" style={{ width: '14px', height: '14px' }}></span>
                ) : (
                  <>
                    <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                    {isEditing ? 'Save Changes' : 'Create Hotel'}
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

export default VendorHotelForm
