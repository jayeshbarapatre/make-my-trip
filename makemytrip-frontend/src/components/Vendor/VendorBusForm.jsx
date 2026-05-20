import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vendorBusesService } from '../../services/vendorService'
import VendorLayout from './VendorLayout'
import toast from 'react-hot-toast'

const CITIES = [
  'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad'
]
const AMENITIES = ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Movie']

const EMPTY_FORM = {
  operatorName: '', busNumber: '', type: 'AC',
  departure: { city: '' }, arrival: { city: '' },
  departureTime: '', arrivalTime: '', durationMinutes: 0,
  price: '', seatsAvailable: 45, amenities: [], image: ''
}

const VendorBusForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (isEditing) loadBus() }, [id])

  // Auto-calculate duration
  useEffect(() => {
    if (formData.departureTime && formData.arrivalTime) {
      const [dh, dm] = formData.departureTime.split(':').map(Number)
      const [ah, am] = formData.arrivalTime.split(':').map(Number)
      let dep = dh * 60 + dm
      let arr = ah * 60 + am
      if (arr < dep) arr += 24 * 60
      setFormData(prev => ({ ...prev, durationMinutes: arr - dep }))
    }
  }, [formData.departureTime, formData.arrivalTime])

  const loadBus = async () => {
    try {
      const res = await vendorBusesService.getAll()
      const bus = res.data.data.find(b => b._id === id)
      if (bus) setFormData(bus)
    } catch {
      setError('Failed to load bus')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type: t } = e.target
    if (t === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        amenities: prev.amenities.includes(value)
          ? prev.amenities.filter(a => a !== value)
          : [...prev.amenities, value]
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleNested = (section, field, value) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      if (isEditing) {
        await vendorBusesService.update(id, formData)
        toast.success('Bus updated successfully')
      } else {
        await vendorBusesService.create(formData)
        toast.success('Bus created successfully')
      }
      navigate('/vendor/buses')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bus')
    } finally {
      setSubmitting(false)
    }
  }

  const hours = Math.floor(formData.durationMinutes / 60)
  const mins = formData.durationMinutes % 60

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary mb-3" />
          <p className="text-sm text-base-content/50">Loading bus details...</p>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-base-content">
            {isEditing ? 'Edit Bus' : 'Add New Bus'}
          </h2>
          <p className="text-sm text-base-content/50 mt-0.5">
            Provide accurate bus information for admin approval
          </p>
        </div>

        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bus Details */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-5">
              <h3 className="font-semibold text-base-content mb-4">🚌 Bus Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Operator Name *</span></div>
                  <input
                    type="text" name="operatorName" className="input input-bordered input-sm"
                    placeholder="e.g., RedBus Travels" value={formData.operatorName}
                    onChange={handleChange} required disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Bus Number *</span></div>
                  <input
                    type="text" name="busNumber" className="input input-bordered input-sm"
                    placeholder="e.g., RB-001" value={formData.busNumber}
                    onChange={handleChange} required disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Bus Type *</span></div>
                  <select
                    name="type" className="select select-bordered select-sm"
                    value={formData.type} onChange={handleChange} disabled={submitting}
                  >
                    <option value="AC">AC Sleeper</option>
                    <option value="Non-AC">Non-AC Seater</option>
                    <option value="Sleeper">Semi-Sleeper</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </label>
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Price (₹) *</span></div>
                  <input
                    type="number" name="price" className="input input-bordered input-sm"
                    placeholder="800" value={formData.price}
                    onChange={handleChange} required disabled={submitting}
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
                  <div className="label py-1"><span className="label-text text-sm font-medium">From *</span></div>
                  <select
                    className="select select-bordered select-sm"
                    value={formData.departure.city}
                    onChange={e => handleNested('departure', 'city', e.target.value)}
                    disabled={submitting} required
                  >
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">To *</span></div>
                  <select
                    className="select select-bordered select-sm"
                    value={formData.arrival.city}
                    onChange={e => handleNested('arrival', 'city', e.target.value)}
                    disabled={submitting} required
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
                    value={formData.departureTime} onChange={handleChange}
                    required disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Arrival Time *</span></div>
                  <input
                    type="time" name="arrivalTime" className="input input-bordered input-sm"
                    value={formData.arrivalTime} onChange={handleChange}
                    required disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1">
                    <span className="label-text text-sm font-medium">Duration</span>
                    <span className="label-text-alt text-xs text-base-content/40">auto</span>
                  </div>
                  <input
                    type="text" className="input input-bordered input-sm bg-base-200 cursor-not-allowed"
                    value={`${hours}h ${mins}m`} readOnly disabled
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Availability & Amenities */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body p-5">
              <h3 className="font-semibold text-base-content mb-4">💺 Availability & Amenities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Available Seats *</span></div>
                  <input
                    type="number" name="seatsAvailable" className="input input-bordered input-sm"
                    min={1} value={formData.seatsAvailable}
                    onChange={handleChange} required disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Image URL</span></div>
                  <input
                    type="url" name="image" className="input input-bordered input-sm"
                    placeholder="https://..." value={formData.image}
                    onChange={handleChange} disabled={submitting}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium text-base-content mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map(a => (
                    <label
                      key={a}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium select-none
                        ${formData.amenities.includes(a)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-base-200 border-base-300 text-base-content/70 hover:border-primary/50'
                        }`}
                    >
                      <input
                        type="checkbox" className="checkbox checkbox-primary checkbox-xs"
                        value={a} checked={formData.amenities.includes(a)}
                        onChange={handleChange} disabled={submitting}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-end">
            <button
              type="button" className="btn btn-ghost btn-sm"
              onClick={() => navigate('/vendor/buses')} disabled={submitting}
            >
              Discard
            </button>
            <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={submitting}>
              {submitting && <span className="loading loading-spinner loading-xs" />}
              {isEditing ? 'Update Bus' : 'Add Bus'}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  )
}

export default VendorBusForm
