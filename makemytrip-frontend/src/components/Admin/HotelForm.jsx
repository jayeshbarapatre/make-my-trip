import { useState, useEffect } from 'react'
import './FormStyles.css'

const HotelForm = ({ hotel, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    location: '',
    description: '',
    rating: 4,
    price: '',
    pricePerNight: '',
    rooms: 50,
    amenities: [],
    image: '',
    images: []
  })

  useEffect(() => {
    if (hotel) setFormData(hotel)
  }, [hotel])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rooms' || name === 'rating' || name === 'price' || name === 'pricePerNight' ? Number(value) : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{hotel ? 'Edit Hotel' : 'Add New Hotel'}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Hotel Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Hotel name" required />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" required />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Location</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Address" />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Hotel description"></textarea>
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing & Availability</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Price (₹) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Price Per Night (₹) *</label>
              <input type="number" name="pricePerNight" value={formData.pricePerNight} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Rooms *</label>
              <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Rating (1-5)</label>
              <input type="number" name="rating" value={formData.rating} onChange={handleChange} min="1" max="5" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Images & Other Details</h3>

          <div className="form-group full-width">
            <label>Main Image URL</label>
            <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="Main image URL" />
          </div>

          <div className="form-group full-width">
            <label>Gallery Images (comma separated URLs)</label>
            <textarea name="images" value={Array.isArray(formData.images) ? formData.images.join(', ') : ''} onChange={(e) => setFormData(prev => ({ ...prev, images: e.target.value.split(',').map(a => a.trim()).filter(Boolean) }))} placeholder="https://..., https://..."></textarea>
          </div>

          <div className="form-group full-width">
            <label>Amenities (comma separated)</label>
            <textarea name="amenities" value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : ''} onChange={(e) => setFormData(prev => ({ ...prev, amenities: e.target.value.split(',').map(a => a.trim()) }))} placeholder="WiFi, Pool, Gym, Restaurant"></textarea>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{hotel ? 'Update Hotel' : 'Create Hotel'}</button>
        </div>
      </form>
    </div>
  )
}

export default HotelForm
