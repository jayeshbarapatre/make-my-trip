import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { vendorFlightsService } from '../../services/vendorService'
import toast from 'react-hot-toast'

const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad'
]

const EMPTY_FORM = {
  airline: '', flightNumber: '', from: '', to: '',
  departureTime: '', arrivalTime: '', durationMinutes: '',
  price: '', seatsAvailable: 180, image: ''
}

const VendorFlightForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => { if (isEditing) fetchFlight() }, [id])

  // Auto-calculate duration
  useEffect(() => {
    if (formData.departureTime && formData.arrivalTime) {
      const [dh, dm] = formData.departureTime.split(':').map(Number)
      const [ah, am] = formData.arrivalTime.split(':').map(Number)
      let dep = dh * 60 + dm
      let arr = ah * 60 + am
      if (arr < dep) arr += 24 * 60
      setFormData(prev => ({ ...prev, durationMinutes: Math.max(0, arr - dep) }))
    }
  }, [formData.departureTime, formData.arrivalTime])

  const fetchFlight = async () => {
    try {
      setLoading(true)
      const res = await vendorFlightsService.getById(id)
      const f = res.data.data.flight
      setFormData({
        airline: f.airline, flightNumber: f.flightNumber,
        from: f.from, to: f.to, departureTime: f.departureTime,
        arrivalTime: f.arrivalTime, durationMinutes: f.durationMinutes,
        price: f.price, seatsAvailable: f.seatsAvailable, image: f.image || ''
      })
    } catch {
      toast.error('Failed to load flight details')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['durationMinutes', 'price', 'seatsAvailable'].includes(name) ? Number(value) : value
    }))
  }

  const validate = () => {
    if (!formData.airline.trim()) { toast.error('Enter airline name'); return false }
    if (!formData.flightNumber.trim()) { toast.error('Enter flight number'); return false }
    if (!formData.from || !formData.to) { toast.error('Select departure and arrival cities'); return false }
    if (formData.from === formData.to) { toast.error('Departure and arrival must be different'); return false }
    if (!formData.departureTime || !formData.arrivalTime) { toast.error('Enter departure and arrival times'); return false }
    if (!formData.price || formData.price <= 0) { toast.error('Enter valid price'); return false }
    if (!formData.seatsAvailable || formData.seatsAvailable <= 0) { toast.error('Enter valid seat count'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setSubmitting(true)
      const payload = {
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
        price: Number(formData.price),
        seatsAvailable: Number(formData.seatsAvailable)
      }
      if (isEditing) {
        await vendorFlightsService.update(id, payload)
        toast.success('Flight updated successfully')
      } else {
        await vendorFlightsService.create(payload)
        toast.success('Flight created successfully')
      }
      navigate('/vendor/flights')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save flight')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary mb-3" />
        <p className="text-sm text-base-content/50">Loading flight details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-base-content">
          {isEditing ? 'Edit Flight' : 'Create New Flight'}
        </h2>
        <p className="text-sm text-base-content/50 mt-0.5">
          Provide accurate flight information for admin approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Flight Details */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">✈️ Flight Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Airline Name *</span></div>
                <input
                  type="text" name="airline" className="input input-bordered input-sm"
                  placeholder="e.g., IndiGo, SpiceJet" value={formData.airline}
                  onChange={handleChange} disabled={submitting} required
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Flight Number *</span></div>
                <input
                  type="text" name="flightNumber" className="input input-bordered input-sm"
                  placeholder="e.g., 6E-123" value={formData.flightNumber}
                  onChange={handleChange} disabled={submitting} required
                />
              </label>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">🌍 Route</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Departure City *</span></div>
                <select
                  name="from" className="select select-bordered select-sm"
                  value={formData.from} onChange={handleChange} disabled={submitting}
                >
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Arrival City *</span></div>
                <select
                  name="to" className="select select-bordered select-sm"
                  value={formData.to} onChange={handleChange} disabled={submitting}
                >
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">⏱️ Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Departure Time *</span></div>
                <input
                  type="time" name="departureTime" className="input input-bordered input-sm"
                  value={formData.departureTime} onChange={handleChange} disabled={submitting}
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Arrival Time *</span></div>
                <input
                  type="time" name="arrivalTime" className="input input-bordered input-sm"
                  value={formData.arrivalTime} onChange={handleChange} disabled={submitting}
                />
              </label>
              <label className="form-control">
                <div className="label py-1">
                  <span className="label-text text-sm font-medium">Duration (min)</span>
                  <span className="label-text-alt text-xs text-base-content/40">auto-calculated</span>
                </div>
                <input
                  type="number" name="durationMinutes" className="input input-bordered input-sm bg-base-200 cursor-not-allowed"
                  value={formData.durationMinutes} readOnly disabled
                  title="Auto-calculated from departure and arrival times"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">💰 Pricing & Availability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Price per Passenger (₹) *</span></div>
                <input
                  type="number" name="price" className="input input-bordered input-sm"
                  placeholder="5000" min={1} value={formData.price}
                  onChange={handleChange} disabled={submitting} required
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Available Seats *</span></div>
                <input
                  type="number" name="seatsAvailable" className="input input-bordered input-sm"
                  placeholder="180" min={1} value={formData.seatsAvailable}
                  onChange={handleChange} disabled={submitting} required
                />
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/vendor/flights')}
            disabled={submitting}
          >
            Discard
          </button>
          <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={submitting}>
            {submitting && <span className="loading loading-spinner loading-xs" />}
            {isEditing ? 'Update Flight' : 'Create Flight'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VendorFlightForm
