import { useState, useEffect } from 'react'
import './FormStyles.css'

const CabForm = ({ cab, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    operatorName: '',
    cabNumber: '',
    type: 'Economy',
    baseFare: '',
    perKmRate: '',
    perMinuteRate: '',
    location: '',
    currentCity: '',
    cabs: 20
  })

  useEffect(() => {
    if (cab) setFormData(cab)
  }, [cab])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['baseFare', 'perKmRate', 'perMinuteRate', 'cabs'].includes(name) ? Number(value) : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{cab ? 'Edit Cab' : 'Add New Cab'}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Operator Name *</label>
              <input type="text" name="operatorName" value={formData.operatorName} onChange={handleChange} placeholder="e.g., Uber, Ola" required />
            </div>

            <div className="form-group">
              <label>Cab Number *</label>
              <input type="text" name="cabNumber" value={formData.cabNumber} onChange={handleChange} placeholder="e.g., DL-01-ABC-1234" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cab Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option>Economy</option>
                <option>Premium</option>
                <option>XL</option>
                <option>Luxury</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Cabs *</label>
              <input type="number" name="cabs" value={formData.cabs} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Base Fare (₹) *</label>
              <input type="number" name="baseFare" value={formData.baseFare} onChange={handleChange} placeholder="50" required />
            </div>

            <div className="form-group">
              <label>Per KM Rate (₹) *</label>
              <input type="number" name="perKmRate" value={formData.perKmRate} onChange={handleChange} placeholder="15" step="0.01" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Per Minute Rate (₹) *</label>
              <input type="number" name="perMinuteRate" value={formData.perMinuteRate} onChange={handleChange} placeholder="2" step="0.01" required />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Location</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Current City *</label>
              <input type="text" name="currentCity" value={formData.currentCity} onChange={handleChange} placeholder="e.g., Delhi" required />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Specific location" />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{cab ? 'Update Cab' : 'Create Cab'}</button>
        </div>
      </form>
    </div>
  )
}

export default CabForm
