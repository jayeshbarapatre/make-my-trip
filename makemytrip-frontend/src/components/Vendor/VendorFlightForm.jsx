import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { vendorFlightsService } from '../../services/vendorService'
import toast from 'react-hot-toast'
import './VendorFlightForm.css'

const VendorFlightForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    from: '',
    to: '',
    departureTime: '',
    arrivalTime: '',
    durationMinutes: '',
    price: '',
    seatsAvailable: 180,
    image: ''
  })

  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad']

  useEffect(() => {
    if (isEditing) {
      fetchFlight()
    }
  }, [id])

  // Auto-calculate duration when departure or arrival time changes
  useEffect(() => {
    if (formData.departureTime && formData.arrivalTime) {
      const [depHour, depMin] = formData.departureTime.split(':').map(Number)
      const [arrHour, arrMin] = formData.arrivalTime.split(':').map(Number)

      let depTotalMin = depHour * 60 + depMin
      let arrTotalMin = arrHour * 60 + arrMin

      // If arrival time is less than departure time, assume next day flight
      if (arrTotalMin < depTotalMin) {
        arrTotalMin += 24 * 60
      }

      const duration = arrTotalMin - depTotalMin

      setFormData(prev => ({
        ...prev,
        durationMinutes: Math.max(0, duration) // Ensure duration is not negative
      }))
    }
  }, [formData.departureTime, formData.arrivalTime])

  const fetchFlight = async () => {
    try {
      setLoading(true)
      const response = await vendorFlightsService.getById(id)
      const flight = response.data.data.flight
      setFormData({
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        from: flight.from,
        to: flight.to,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        durationMinutes: flight.durationMinutes,
        price: flight.price,
        seatsAvailable: flight.seatsAvailable,
        image: flight.image || ''
      })
    } catch (err) {
      toast.error('Failed to load flight details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['durationMinutes', 'price', 'seatsAvailable'].includes(name) ? Number(value) : value
    }))
  }

  const validateForm = () => {
    if (!formData.airline.trim()) {
      toast.error('Please enter airline name')
      return false
    }
    if (!formData.flightNumber.trim()) {
      toast.error('Please enter flight number')
      return false
    }
    if (!formData.from || !formData.to) {
      toast.error('Please select departure and arrival cities')
      return false
    }
    if (formData.from === formData.to) {
      toast.error('Departure and arrival cities must be different')
      return false
    }
    if (!formData.departureTime || !formData.arrivalTime) {
      toast.error('Please enter departure and arrival times')
      return false
    }
    if (!formData.durationMinutes || formData.durationMinutes <= 0) {
      toast.error('Please enter valid flight duration')
      return false
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Please enter valid price')
      return false
    }
    if (!formData.seatsAvailable || formData.seatsAvailable <= 0) {
      toast.error('Please enter valid number of seats')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSubmitting(true)
      const submitData = {
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
        price: Number(formData.price),
        seatsAvailable: Number(formData.seatsAvailable)
      }

      if (isEditing) {
        await vendorFlightsService.update(id, submitData)
        toast.success('Flight updated successfully')
      } else {
        await vendorFlightsService.create(submitData)
        toast.success('Flight created successfully')
      }
      navigate('/vendor/flights')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save flight')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="vendor-flight-form">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i> Loading flight details...
        </div>
      </div>
    )
  }

  return (
    <div className="vendor-flight-form">
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-header">
          <h2>{isEditing ? 'Edit Flight' : 'Create New Flight'}</h2>
          <p>Provide accurate flight information for vendor approval</p>
        </div>

        <div className="form-section">
          <h3 className="section-title">✈️ Flight Details</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="airline" className="form-label">Airline Name *</label>
              <input
                type="text"
                id="airline"
                name="airline"
                value={formData.airline}
                onChange={handleInputChange}
                placeholder="e.g., IndiGo, SpiceJet, GoAir"
                className="form-input"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="flightNumber" className="form-label">Flight Number *</label>
              <input
                type="text"
                id="flightNumber"
                name="flightNumber"
                value={formData.flightNumber}
                onChange={handleInputChange}
                placeholder="e.g., 6E-123, SG-456"
                className="form-input"
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">🌍 Route</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="from" className="form-label">Departure City *</label>
              <select
                id="from"
                name="from"
                value={formData.from}
                onChange={handleInputChange}
                className="form-input"
                disabled={submitting}
              >
                <option value="">Select departure city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="to" className="form-label">Arrival City *</label>
              <select
                id="to"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                className="form-input"
                disabled={submitting}
              >
                <option value="">Select arrival city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">⏱️ Schedule</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="departureTime" className="form-label">Departure Time *</label>
              <input
                type="time"
                id="departureTime"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleInputChange}
                className="form-input"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="arrivalTime" className="form-label">Arrival Time *</label>
              <input
                type="time"
                id="arrivalTime"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleInputChange}
                className="form-input"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="durationMinutes" className="form-label">Duration (minutes) * <span style={{ fontSize: '12px', color: '#6b7280' }}>(auto-calculated)</span></label>
              <input
                type="number"
                id="durationMinutes"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleInputChange}
                placeholder="e.g., 180"
                className="form-input"
                min="1"
                disabled={true}
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', opacity: 0.7 }}
                title="Duration is automatically calculated from departure and arrival times"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">💰 Pricing & Availability</h3>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="price" className="form-label">Price (per passenger) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 5000"
                className="form-input"
                min="1"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="seatsAvailable" className="form-label">Available Seats *</label>
              <input
                type="number"
                id="seatsAvailable"
                name="seatsAvailable"
                value={formData.seatsAvailable}
                onChange={handleInputChange}
                placeholder="e.g., 180"
                className="form-input"
                min="1"
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/vendor/flights')}
            disabled={submitting}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditing ? 'Update Flight' : 'Create Flight'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VendorFlightForm
