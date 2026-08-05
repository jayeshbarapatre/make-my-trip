import { useState, useEffect } from 'react'
import { useToastContext } from '../../context/ToastContext'
import './FormStyles.css'

export const RoomForm = ({ room, onSave, onClose, hotelId: _hotelId }) => {
  const toast = useToastContext()
  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    capacity: 2,
    totalRooms: 10,
    basePrice: '',
    amenities: [],
    images: []
  })

  useEffect(() => {
    if (room) {
      setFormData({
        categoryName: room.categoryName || '',
        description: room.description || '',
        capacity: room.capacity || 2,
        totalRooms: room.totalRooms || 10,
        basePrice: room.basePrice || '',
        amenities: Array.isArray(room.amenities) ? room.amenities : [],
        images: Array.isArray(room.images) ? room.images : []
      })
    }
  }, [room])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) : value
    })
  }

  const handleAmenitiesChange = (e) => {
    const amenities = e.target.value
      .split(',')
      .map(a => a.trim())
      .filter(a => a)
    setFormData({ ...formData, amenities })
  }

  const handleImagesChange = (e) => {
    const images = e.target.value
      .split(',')
      .map(img => img.trim())
      .filter(img => img)
    setFormData({ ...formData, images })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.categoryName.trim() || !formData.totalRooms || !formData.basePrice) {
      toast.error('Category Name, Total Rooms, and Price are required', 'Missing details')
      return
    }

    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{room ? 'Edit Room' : 'Add New Room'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label>Category Name *</label>
              <input
                type="text"
                name="categoryName"
                value={formData.categoryName}
                onChange={handleChange}
                placeholder="e.g., Deluxe, Suite, Standard"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Room description"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Capacity (Guests) *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Rooms *</label>
                <input
                  type="number"
                  name="totalRooms"
                  value={formData.totalRooms}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing & Availability</h3>

            <div className="form-group">
              <label>Price Per Night (₹) *</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="100"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Amenities & Images</h3>

            <div className="form-group">
              <label>Amenities (comma-separated)</label>
              <textarea
                value={formData.amenities.join(', ')}
                onChange={handleAmenitiesChange}
                placeholder="AC, WiFi, TV, Bathroom, Mini Bar"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>Images (comma-separated URLs)</label>
              <textarea
                value={formData.images.join(', ')}
                onChange={handleImagesChange}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                rows="2"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {room ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
