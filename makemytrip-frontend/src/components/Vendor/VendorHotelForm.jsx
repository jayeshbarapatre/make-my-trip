import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { vendorHotelsService } from '../../services/vendorService'
import toast from 'react-hot-toast'
import './VendorHotelForm.css'

const VendorHotelForm = ({ onClose, onSuccess }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    location: '',
    description: '',
    pricePerNight: '',
    price: '',
    rooms: 50,
    rating: 4,
    amenities: [],
    checkin: '14:00',
    checkout: '11:00',
    image: ''
  })

  const [selectedAmenities, setSelectedAmenities] = useState([])

  const amenitiesList = [
    'WiFi',
    'Swimming Pool',
    'Gym',
    'Spa',
    'Parking',
    'Air Conditioning',
    'Restaurant',
    'Bar',
    'Conference Room',
    'Laundry Service'
  ]

  useEffect(() => {
    if (isEditing) {
      fetchHotel()
    }
  }, [id])

  const fetchHotel = async () => {
    try {
      setLoading(true)
      const response = await vendorHotelsService.getById(id)
      const hotel = response.data.data.hotel
      setFormData({
        name: hotel.name,
        city: hotel.city,
        location: hotel.location || '',
        description: hotel.description || '',
        pricePerNight: hotel.pricePerNight,
        price: hotel.price,
        rooms: hotel.rooms,
        rating: hotel.rating,
        amenities: hotel.amenities || [],
        checkin: hotel.checkin || '14:00',
        checkout: hotel.checkout || '11:00',
        image: hotel.image || ''
      })
      setSelectedAmenities(hotel.amenities || [])
    } catch (err) {
      toast.error('Failed to load hotel details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rooms' || name === 'rating' ? Number(value) : value
    }))
  }

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.city || !formData.pricePerNight || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      const submitData = {
        ...formData,
        amenities: selectedAmenities
      }

      if (isEditing) {
        await vendorHotelsService.update(id, submitData)
        toast.success('Hotel updated successfully')
      } else {
        await vendorHotelsService.create(submitData)
        toast.success('Hotel created successfully')
      }

      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/vendor/hotels')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hotel')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="form-loading">Loading...</div>
  }

  return (
    <div className="vendor-hotel-form">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Hotel' : 'Create New Hotel'}</h2>
        {onClose && (
          <button className="btn-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="form-content">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="name">Hotel Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter hotel name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g., Mumbai, Delhi"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Specific area/neighborhood"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell guests about your hotel"
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing & Inventory</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pricePerNight">Price Per Night (₹) *</label>
              <input
                id="pricePerNight"
                name="pricePerNight"
                type="number"
                value={formData.pricePerNight}
                onChange={handleInputChange}
                placeholder="2000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Base Price (₹) *</label>
              <input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="2000"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="rooms">Total Rooms</label>
              <input
                id="rooms"
                name="rooms"
                type="number"
                value={formData.rooms}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rating">Rating (0-5)</label>
              <input
                id="rating"
                name="rating"
                type="number"
                value={formData.rating}
                onChange={handleInputChange}
                min="0"
                max="5"
                step="0.1"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Check-in & Check-out</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="checkin">Check-in Time</label>
              <input
                id="checkin"
                name="checkin"
                type="time"
                value={formData.checkin}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkout">Check-out Time</label>
              <input
                id="checkout"
                name="checkout"
                type="time"
                value={formData.checkout}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Amenities</h3>
          <div className="amenities-grid">
            {amenitiesList.map(amenity => (
              <label key={amenity} className="amenity-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Saving...' : (isEditing ? 'Update Hotel' : 'Create Hotel')}
          </button>
          {onClose && (
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default VendorHotelForm
