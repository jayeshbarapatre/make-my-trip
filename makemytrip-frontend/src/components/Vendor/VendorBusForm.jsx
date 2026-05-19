import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vendorBusesService } from '../../services/vendorService'
import './VendorBusForm.css'

const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad']
const amenitiesList = ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Movie']

const VendorBusForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    operatorName: '',
    busNumber: '',
    type: 'AC',
    departure: { city: '' },
    arrival: { city: '' },
    departureTime: '',
    arrivalTime: '',
    durationMinutes: 0,
    price: '',
    seatsAvailable: 45,
    amenities: [],
    image: ''
  })

  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEditing) {
      loadBus()
    }
  }, [id])

  const loadBus = async () => {
    try {
      const response = await vendorBusesService.getAll()
      const bus = response.data.data.find(b => b._id === id)
      if (bus) {
        setFormData(bus)
      }
    } catch (err) {
      setError('Failed to load bus')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (formData.departureTime && formData.arrivalTime) {
      const [depHour, depMin] = formData.departureTime.split(':').map(Number)
      const [arrHour, arrMin] = formData.arrivalTime.split(':').map(Number)

      const depTotal = depHour * 60 + depMin
      let arrTotal = arrHour * 60 + arrMin

      if (arrTotal < depTotal) arrTotal += 24 * 60

      const durationMin = arrTotal - depTotal
      setFormData(prev => ({ ...prev, durationMinutes: durationMin }))
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
      setFormData(prev => ({ ...prev, [name]: value }))
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
    try {
      if (isEditing) {
        await vendorBusesService.update(id, formData)
      } else {
        await vendorBusesService.create(formData)
      }
      navigate('/vendor/buses')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bus')
    }
  }

  if (loading) return <div className="vendor-flights-page">Loading...</div>

  const hours = Math.floor(formData.durationMinutes / 60)
  const minutes = formData.durationMinutes % 60

  return (
    <div className="vendor-flights-page">
      <div className="page-header">
        <h1>{isEditing ? 'Edit Bus' : 'Add New Bus'}</h1>
      </div>

      {error && <div style={{ color: 'hsl(var(--er))', marginBottom: '1rem', padding: '1rem', background: 'hsl(var(--er) / 0.1)', borderRadius: '0.5rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-section">
          <h3>Bus Details</h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Operator Name *</label>
              <input
                type="text"
                name="operatorName"
                className="form-input"
                value={formData.operatorName}
                onChange={handleChange}
                placeholder="e.g., RedBus Travels"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bus Number *</label>
              <input
                type="text"
                name="busNumber"
                className="form-input"
                value={formData.busNumber}
                onChange={handleChange}
                placeholder="e.g., RB-001"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bus Type *</label>
              <select name="type" className="form-input" value={formData.type} onChange={handleChange} required>
                <option value="AC">AC Sleeper</option>
                <option value="Non-AC">Non-AC Seater</option>
                <option value="Sleeper">Semi-Sleeper</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Route</h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">From *</label>
              <select
                className="form-input"
                value={formData.departure.city}
                onChange={(e) => handleNestedChange('departure', 'city', e.target.value)}
                required
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">To *</label>
              <select
                className="form-input"
                value={formData.arrival.city}
                onChange={(e) => handleNestedChange('arrival', 'city', e.target.value)}
                required
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Schedule</h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Departure Time *</label>
              <input
                type="time"
                name="departureTime"
                className="form-input"
                value={formData.departureTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Arrival Time *</label>
              <input
                type="time"
                name="arrivalTime"
                className="form-input"
                value={formData.arrivalTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-input"
                value={`${hours}h ${minutes}m`}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing & Availability</h3>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Available Seats *</label>
              <input
                type="number"
                name="seatsAvailable"
                className="form-input"
                value={formData.seatsAvailable}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amenities</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {amenitiesList.map(amenity => (
                <div key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id={amenity}
                    value={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onChange={handleChange}
                  />
                  <label htmlFor={amenity} style={{ margin: 0 }}>{amenity}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="text"
              name="image"
              className="form-input"
              value={formData.image}
              onChange={handleChange}
              placeholder="Image URL"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/vendor/buses')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Update Bus' : 'Add Bus'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VendorBusForm
