import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { vendorHotelsService } from '../../services/vendorService'
import toast from 'react-hot-toast'

const AMENITIES = [
  'WiFi', 'Swimming Pool', 'Gym', 'Spa', 'Parking',
  'Air Conditioning', 'Restaurant', 'Bar', 'Conference Room', 'Laundry Service'
]

const EMPTY_FORM = {
  name: '', city: '', location: '', description: '',
  pricePerNight: '', price: '', rooms: 50, rating: 4,
  amenities: [], checkin: '14:00', checkout: '11:00', image: ''
}

const VendorHotelForm = ({ onClose, onSuccess }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [selectedAmenities, setSelectedAmenities] = useState([])

  useEffect(() => {
    if (isEditing) fetchHotel()
  }, [id])

  const fetchHotel = async () => {
    try {
      setLoading(true)
      const res = await vendorHotelsService.getById(id)
      const h = res.data.data.hotel
      setFormData({
        name: h.name, city: h.city, location: h.location || '',
        description: h.description || '', pricePerNight: h.pricePerNight,
        price: h.price, rooms: h.rooms, rating: h.rating,
        amenities: h.amenities || [], checkin: h.checkin || '14:00',
        checkout: h.checkout || '11:00', image: h.image || ''
      })
      setSelectedAmenities(h.amenities || [])
    } catch {
      toast.error('Failed to load hotel details')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['rooms', 'rating', 'price', 'pricePerNight'].includes(name) ? Number(value) : value
    }))
  }

  const toggleAmenity = (a) => {
    setSelectedAmenities(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
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
      const payload = { ...formData, amenities: selectedAmenities }
      if (isEditing) {
        await vendorHotelsService.update(id, payload)
        toast.success('Hotel updated successfully')
      } else {
        await vendorHotelsService.create(payload)
        toast.success('Hotel created successfully')
      }
      onSuccess ? onSuccess() : navigate('/vendor/hotels')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hotel')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="loading loading-spinner loading-lg text-primary mb-3" />
        <p className="text-sm text-base-content/50">Loading hotel details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-base-content">
          {isEditing ? 'Edit Hotel' : 'Create New Hotel'}
        </h2>
        <p className="text-sm text-base-content/50 mt-0.5">
          {isEditing ? 'Update your hotel listing details' : 'Fill in the details to create a new hotel listing'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">Basic Information</h3>
            <div className="space-y-4">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Hotel Name *</span></div>
                <input
                  type="text" name="name" className="input input-bordered input-sm"
                  placeholder="Enter hotel name" value={formData.name}
                  onChange={handleChange} required disabled={submitting}
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">City *</span></div>
                  <input
                    type="text" name="city" className="input input-bordered input-sm"
                    placeholder="e.g., Mumbai, Delhi" value={formData.city}
                    onChange={handleChange} required disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1"><span className="label-text text-sm font-medium">Location / Area</span></div>
                  <input
                    type="text" name="location" className="input input-bordered input-sm"
                    placeholder="Specific area or neighborhood" value={formData.location}
                    onChange={handleChange} disabled={submitting}
                  />
                </label>
              </div>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Description</span></div>
                <textarea
                  name="description" className="textarea textarea-bordered textarea-sm"
                  placeholder="Tell guests about your hotel..." rows={4}
                  value={formData.description} onChange={handleChange} disabled={submitting}
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
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">Pricing & Inventory</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Price/Night (₹) *</span></div>
                <input
                  type="number" name="pricePerNight" className="input input-bordered input-sm"
                  placeholder="2000" value={formData.pricePerNight}
                  onChange={handleChange} required disabled={submitting}
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Base Price (₹) *</span></div>
                <input
                  type="number" name="price" className="input input-bordered input-sm"
                  placeholder="2000" value={formData.price}
                  onChange={handleChange} required disabled={submitting}
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Total Rooms</span></div>
                <input
                  type="number" name="rooms" className="input input-bordered input-sm"
                  min={1} value={formData.rooms}
                  onChange={handleChange} disabled={submitting}
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Rating (0–5)</span></div>
                <input
                  type="number" name="rating" className="input input-bordered input-sm"
                  min={0} max={5} step={0.1} value={formData.rating}
                  onChange={handleChange} disabled={submitting}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Check-in / Check-out */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">Check-in & Check-out</h3>
            <div className="grid grid-cols-2 gap-4 max-w-xs">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Check-in</span></div>
                <input
                  type="time" name="checkin" className="input input-bordered input-sm"
                  value={formData.checkin} onChange={handleChange} disabled={submitting}
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Check-out</span></div>
                <input
                  type="time" name="checkout" className="input input-bordered input-sm"
                  value={formData.checkout} onChange={handleChange} disabled={submitting}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-base-content mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(amenity => (
                <label
                  key={amenity}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium select-none
                    ${selectedAmenities.includes(amenity)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-base-200 border-base-300 text-base-content/70 hover:border-primary/50'
                    }`}
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-xs"
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    disabled={submitting}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          {onClose && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/vendor/hotels')}
            disabled={submitting}
          >
            Discard
          </button>
          <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={submitting}>
            {submitting && <span className="loading loading-spinner loading-xs" />}
            {isEditing ? 'Update Hotel' : 'Create Hotel'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VendorHotelForm
