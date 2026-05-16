import { useState, useEffect } from 'react'
import './FormStyles.css'

const BusForm = ({ bus, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    operatorName: '',
    busNumber: '',
    type: 'AC',
    departure: { city: '', time: '', date: '' },
    arrival: { city: '', time: '', date: '' },
    duration: '',
    price: '',
    seats: 45,
    amenities: []
  })

  useEffect(() => {
    if (bus) setFormData(bus)
  }, [bus])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'seats' || name === 'price' ? Number(value) : value
    }))
  }

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{bus ? 'Edit Bus' : 'Add New Bus'}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Operator Name *</label>
              <input type="text" name="operatorName" value={formData.operatorName} onChange={handleChange} placeholder="e.g., Volvo Travels" required />
            </div>

            <div className="form-group">
              <label>Bus Number *</label>
              <input type="text" name="busNumber" value={formData.busNumber} onChange={handleChange} placeholder="e.g., VT-001" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Bus Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option>AC</option>
                <option>Non-AC</option>
                <option>Sleeper</option>
                <option>Luxury</option>
              </select>
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Route Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Departure City *</label>
              <input type="text" value={formData.departure.city} onChange={(e) => handleNestedChange('departure', 'city', e.target.value)} placeholder="City" required />
            </div>

            <div className="form-group">
              <label>Departure Date</label>
              <input type="date" value={formData.departure.date} onChange={(e) => handleNestedChange('departure', 'date', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Arrival City *</label>
              <input type="text" value={formData.arrival.city} onChange={(e) => handleNestedChange('arrival', 'city', e.target.value)} placeholder="City" required />
            </div>

            <div className="form-group">
              <label>Arrival Date</label>
              <input type="date" value={formData.arrival.date} onChange={(e) => handleNestedChange('arrival', 'date', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 12h 30m" />
            </div>

            <div className="form-group">
              <label>Total Seats *</label>
              <input type="number" name="seats" value={formData.seats} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Amenities</h3>
          <div className="form-group full-width">
            <label>Amenities (comma separated)</label>
            <textarea value={Array.isArray(formData.amenities) ? formData.amenities.join(', ') : ''} onChange={(e) => setFormData(prev => ({ ...prev, amenities: e.target.value.split(',').map(a => a.trim()) }))} placeholder="WiFi, Power outlets, Blankets"></textarea>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{bus ? 'Update Bus' : 'Create Bus'}</button>
        </div>
      </form>
    </div>
  )
}

export default BusForm
