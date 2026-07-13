import { useState, useEffect } from 'react'
import AutocompleteInput from './AutocompleteInput'
import './FormStyles.css'

const FlightForm = ({ flight, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    departure: { city: '', airport: '', time: '', date: '' },
    arrival: { city: '', airport: '', time: '', date: '' },
    duration: '',
    price: '',
    seats: 180,
    baggage: '',
    stops: 0,
    aircraft: '',
    image: ''
  })

  useEffect(() => {
    if (flight) {
      setFormData(flight)
    }
  }, [flight])

  useEffect(() => {
    if (
      formData.departure.date && 
      formData.departure.time && 
      formData.arrival.date && 
      formData.arrival.time
    ) {
      const depDate = new Date(`${formData.departure.date}T${formData.departure.time}`)
      const arrDate = new Date(`${formData.arrival.date}T${formData.arrival.time}`)

      if (!isNaN(depDate.getTime()) && !isNaN(arrDate.getTime())) {
        const diffMs = arrDate.getTime() - depDate.getTime()
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60))
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          const calculatedDuration = `${hours}h ${minutes}m`
          
          if (formData.duration !== calculatedDuration) {
            setFormData(prev => ({ ...prev, duration: calculatedDuration }))
          }
        }
      }
    }
  }, [formData.departure.date, formData.departure.time, formData.arrival.date, formData.arrival.time])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleAutocompleteChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAutocompleteNestedChange = (section, field, value) => {
    handleNestedChange(section, field, value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{flight ? 'Edit Flight' : 'Add New Flight'}</h2>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <AutocompleteInput
                type="airline"
                placeholder="e.g., Air India"
                value={formData.airline}
                onChange={(val) => handleAutocompleteChange('airline', val)}
                label="Airline"
                required
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                type="flightNumber"
                placeholder="e.g., AI101"
                value={formData.flightNumber}
                onChange={(val) => handleAutocompleteChange('flightNumber', val)}
                label="Flight Number"
                required
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                type="aircraft"
                placeholder="e.g., Boeing 737"
                value={formData.aircraft}
                onChange={(val) => handleAutocompleteChange('aircraft', val)}
                label="Aircraft"
              />
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
          <h3>Departure</h3>

          <div className="form-row">
            <div className="form-group">
              <AutocompleteInput
                type="city"
                placeholder="e.g., Delhi"
                value={formData.departure.city}
                onChange={(val) => handleAutocompleteNestedChange('departure', 'city', val)}
                label="City"
                required
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                type="airport"
                placeholder="e.g., DEL"
                value={formData.departure.airport}
                onChange={(val) => handleAutocompleteNestedChange('departure', 'airport', val)}
                label="Airport"
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.departure.date}
                onChange={(e) => handleNestedChange('departure', 'date', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={formData.departure.time}
                onChange={(e) => handleNestedChange('departure', 'time', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Arrival</h3>

          <div className="form-row">
            <div className="form-group">
              <AutocompleteInput
                type="city"
                placeholder="e.g., Mumbai"
                value={formData.arrival.city}
                onChange={(val) => handleAutocompleteNestedChange('arrival', 'city', val)}
                label="City"
                required
              />
            </div>

            <div className="form-group">
              <AutocompleteInput
                type="airport"
                placeholder="e.g., BOM"
                value={formData.arrival.airport}
                onChange={(val) => handleAutocompleteNestedChange('arrival', 'airport', val)}
                label="Airport"
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.arrival.date}
                onChange={(e) => handleNestedChange('arrival', 'date', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={formData.arrival.time}
                onChange={(e) => handleNestedChange('arrival', 'time', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g., 2h 30m"
              />
            </div>

            <div className="form-group">
              <label>Stops</label>
              <input
                type="number"
                name="stops"
                value={formData.stops}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Total Seats *</label>
              <input
                type="number"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Baggage Allowance</label>
              <input
                type="text"
                name="baggage"
                value={formData.baggage}
                onChange={handleChange}
                placeholder="e.g., 20kg"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Image URL</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Image URL"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {flight ? 'Update Flight' : 'Create Flight'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FlightForm
