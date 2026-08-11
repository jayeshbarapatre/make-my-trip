import {useState, useMemo} from 'react'
import { durationFromTimes } from '../../utils/duration'
import CityInput from './CityInput'
import './FormStyles.css'

const amenitiesList = ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Movie']

const TrainForm = ({ train, onSubmit, onClose }) => {
  const [formData, setFormData] = useState(() => train ?? ({
    operatorName: '',
    trainNumber: '',
    type: 'AC',
    departure: { city: '' },
    arrival: { city: '' },
    departureTime: '',
    arrivalTime: '',
    duration: '',
    price: '',
    seats: 400,
    seatsAvailable: 400,
    amenities: [],
    image: ''
  }))


  // Derived during render — see BusForm.
  const duration = useMemo(
    () => durationFromTimes(formData.departureTime, formData.arrivalTime),
    [formData.departureTime, formData.arrivalTime]
  )

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
        [name]: ['price', 'seats', 'seatsAvailable'].includes(name) ? Number(value) : value
      }))
    }
  }

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...formData, duration })
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{train ? 'Edit Train' : 'Add New Train'}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Operator / Railway *</label>
              <input
                type="text"
                name="operatorName"
                value={formData.operatorName}
                onChange={handleChange}
                placeholder="e.g., Western Railway"
                required
              />
            </div>

            <div className="form-group">
              <label>Train Number *</label>
              <input
                type="text"
                name="trainNumber"
                value={formData.trainNumber}
                onChange={handleChange}
                placeholder="e.g., 12952"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Train Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option value="AC">AC Sleeper</option>
                <option value="Non-AC">Non-AC Seater</option>
                <option value="Sleeper">Semi-Sleeper</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Route</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Departure City *</label>
              <CityInput
                value={formData.departure?.city}
                onChange={(v) => handleNestedChange('departure', 'city', v)}
                required
              />
            </div>

            <div className="form-group">
              <label>Arrival City *</label>
              <CityInput
                value={formData.arrival?.city}
                onChange={(v) => handleNestedChange('arrival', 'city', v)}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Schedule</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Departure Time *</label>
              <input
                type="time"
                name="departureTime"
                value={formData.departureTime || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Arrival Time *</label>
              <input
                type="time"
                name="arrivalTime"
                value={formData.arrivalTime || ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration || ''}
                disabled
                placeholder="Auto-calculated"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Capacity & Amenities</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Total Seats *</label>
              <input
                type="number"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Available Seats *</label>
              <input
                type="number"
                name="seatsAvailable"
                value={formData.seatsAvailable}
                onChange={handleChange}
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Amenities</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {amenitiesList.map(amenity => (
                <div key={amenity} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id={amenity}
                    value={amenity}
                    checked={formData.amenities?.includes(amenity) || false}
                    onChange={handleChange}
                  />
                  <label htmlFor={amenity} style={{ margin: 0 }}>{amenity}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group full-width">
            <label>Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image || ''}
              onChange={handleChange}
              placeholder="Image URL"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {train ? 'Update Train' : 'Create Train'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TrainForm
