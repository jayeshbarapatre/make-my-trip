import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import toast from 'react-hot-toast'
import axios from 'axios'
import './AdminFlights.css'

const AdminVendors = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showHotels, setShowHotels] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [vendorHotels, setVendorHotels] = useState([])
  const [loadingHotels, setLoadingHotels] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vendorType: 'flight'
  })
  const [submitting, setSubmitting] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

  // Dynamic vendor type configuration - matches homepage services
  const vendorTypeConfig = {
    flight: {
      label: 'Flights',
      placeholder: 'e.g., SkyAirways Airlines',
      icon: '✈️'
    },
    hotel: {
      label: 'Hotels',
      placeholder: 'e.g., Paradise Hotels',
      icon: '🏨'
    },
    villa: {
      label: 'Villas & Homestays',
      placeholder: 'e.g., CozyStay Villas',
      icon: '🏡'
    },
    holiday: {
      label: 'Holiday Packages',
      placeholder: 'e.g., VacationWonders Packages',
      icon: '🧳'
    },
    train: {
      label: 'Trains',
      placeholder: 'e.g., RailTravel Express',
      icon: '🚆'
    },
    bus: {
      label: 'Buses',
      placeholder: 'e.g., GoTravel Buses',
      icon: '🚌'
    },
    cab: {
      label: 'Cabs',
      placeholder: 'e.g., RideHub Cabs',
      icon: '🚖'
    },
    tour: {
      label: 'Tours & Attractions',
      placeholder: 'e.g., ExploreWorld Tours',
      icon: '🎡'
    },
    visa: {
      label: 'Visa',
      placeholder: 'e.g., TravelVisa Services',
      icon: '🛂'
    },
    cruise: {
      label: 'Cruise',
      placeholder: 'e.g., SailingAdventures Cruise',
      icon: '🚢'
    },
    forex: {
      label: 'Forex Card & Currency',
      placeholder: 'e.g., MoneyExchange Services',
      icon: '💳'
    },
    insurance: {
      label: 'Travel Insurance',
      placeholder: 'e.g., SafeTravel Insurance',
      icon: '🛡️'
    },
    multi: {
      label: 'Multi-Service',
      placeholder: 'e.g., TravelMax Services',
      icon: '🌐'
    }
  }

  const getVendorPlaceholder = (type) => {
    return vendorTypeConfig[type]?.placeholder || 'e.g., Travel Vendor'
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${API_BASE_URL}/admin/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendors(response.data.data.vendors || [])
    } catch (err) {
      toast.error('Failed to load vendors')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('All fields are required')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('adminToken')
      const response = await axios.post(`${API_BASE_URL}/admin/vendors`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Vendor created successfully')
      setVendors([response.data.data.vendor, ...vendors])
      setFormData({ name: '', email: '', password: '', phone: '', vendorType: Object.keys(vendorTypeConfig)[0] })
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewHotels = async (vendor) => {
    try {
      setSelectedVendor(vendor)
      setLoadingHotels(true)
      const token = localStorage.getItem('adminToken')
      const response = await axios.get(`${API_BASE_URL}/admin/vendors/${vendor.id}/hotels`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendorHotels(response.data.data.hotels || [])
      setShowHotels(true)
    } catch (err) {
      toast.error('Failed to load vendor hotels')
      console.error(err)
    } finally {
      setLoadingHotels(false)
    }
  }

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Delete this vendor? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/admin/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Vendor deleted successfully')
      setVendors(vendors.filter(v => v.id !== vendorId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vendor')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 text-base-content/60">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
          <p>Loading vendors...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Manage Vendors</h1>
            <p className="mt-1 text-base-content/60 text-sm">
              Register and manage hotel & flight vendors
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <i className="fas fa-plus"></i> Register New Vendor
          </button>
        </div>

        {showForm && (
          <div className="modal modal-open">
            <div className="modal-box shadow-2xl max-w-md">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                onClick={() => !submitting && setShowForm(false)}
                disabled={submitting}
              >
                ✕
              </button>

              <h3 className="font-bold text-lg mb-6">Register New Vendor</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Vendor Type *</span>
                  </label>
                  <select
                    name="vendorType"
                    value={formData.vendorType}
                    onChange={handleInputChange}
                    required
                    className="select select-bordered"
                    disabled={submitting}
                  >
                    {Object.entries(vendorTypeConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Vendor Name *</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={getVendorPlaceholder(formData.vendorType)}
                    required
                    className="input input-bordered"
                    disabled={submitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Email *</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="vendor@example.com"
                    required
                    className="input input-bordered"
                    disabled={submitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="9876543210"
                    required
                    className="input input-bordered"
                    disabled={submitting}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Password (min 8 characters) *</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter secure password"
                    required
                    minLength="8"
                    className="input input-bordered"
                    disabled={submitting}
                  />
                </div>

                <div className="modal-action pt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                    className="btn btn-outline btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    {submitting && <span className="loading loading-spinner loading-sm"></span>}
                    {submitting ? 'Creating...' : 'Register Vendor'}
                  </button>
                </div>
              </form>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={() => !submitting && setShowForm(false)}>
              <button disabled={submitting} />
            </form>
          </div>
        )}

        {vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 bg-base-100 rounded-lg">
            <i className="fas fa-inbox text-5xl text-base-content/30 mb-4"></i>
            <p className="text-lg text-base-content/70">No vendors registered yet</p>
            <p className="text-sm text-base-content/50">Click "Register New Vendor" to get started</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(vendor => (
                  <tr key={vendor.id}>
                    <td>
                      <strong>{vendor.name}</strong>
                    </td>
                    <td>{vendor.email}</td>
                    <td>{vendor.phone}</td>
                    <td>
                      <span className="badge badge-info badge-sm">
                        {vendorTypeConfig[vendor.vendorType]?.icon} {vendorTypeConfig[vendor.vendorType]?.label || vendor.vendorType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${vendor.vendorStatus === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                        {vendor.vendorStatus}
                      </span>
                    </td>
                    <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleViewHotels(vendor)}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => handleDelete(vendor.id)}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showHotels && selectedVendor && (
          <div className="modal modal-open">
            <div className="modal-box shadow-2xl max-w-2xl max-h-96 overflow-y-auto">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
                onClick={() => !loadingHotels && setShowHotels(false)}
                disabled={loadingHotels}
              >
                ✕
              </button>

              <h3 className="font-bold text-lg mb-4">{selectedVendor.name}'s Hotels</h3>

              <div className="divider my-0"></div>

              {loadingHotels ? (
                <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                  <i className="fas fa-spinner fa-spin text-3xl text-primary mb-2"></i>
                  <p>Loading hotels...</p>
                </div>
              ) : vendorHotels.length === 0 ? (
                <div className="text-center py-12 text-base-content/60">
                  <p>No hotels added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendorHotels.map(hotel => (
                    <div key={hotel.id} className="border border-base-content/10 rounded-lg p-4 bg-base-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-base-content">{hotel.name}</h4>
                          <p className="text-sm text-base-content/60">📍 {hotel.city}</p>
                        </div>
                        <span className={`badge badge-sm ${
                          hotel.listingStatus === 'APPROVED' ? 'badge-success' :
                          hotel.listingStatus === 'PENDING_APPROVAL' ? 'badge-warning' :
                          hotel.listingStatus === 'REJECTED' ? 'badge-error' :
                          'badge-secondary'
                        }`}>
                          {hotel.listingStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-xs uppercase text-base-content/60 font-semibold">Price/Night</span>
                          <p className="font-semibold text-base-content">₹{hotel.pricePerNight.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-xs uppercase text-base-content/60 font-semibold">Rooms</span>
                          <p className="font-semibold text-base-content">{hotel.rooms}</p>
                        </div>
                        <div>
                          <span className="text-xs uppercase text-base-content/60 font-semibold">Rating</span>
                          <p className="font-semibold text-base-content">⭐ {hotel.rating.toFixed(1)}</p>
                        </div>
                      </div>

                      {hotel.listingStatus === 'REJECTED' && hotel.rejectionReason && (
                        <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded text-sm text-error">
                          <strong>Rejection Reason:</strong> {hotel.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form method="dialog" className="modal-backdrop" onClick={() => !loadingHotels && setShowHotels(false)}>
              <button disabled={loadingHotels} />
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminVendors
