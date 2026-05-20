import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import toast from 'react-hot-toast'
import axios from 'axios'
import {
  RiAddLine, RiEyeLine, RiDeleteBinLine, RiStoreLine,
  RiSearchLine, RiUserLine
} from 'react-icons/ri'

const VENDOR_TYPES = {
  flight:    { label: 'Flights',              icon: '✈️' },
  hotel:     { label: 'Hotels',               icon: '🏨' },
  villa:     { label: 'Villas & Homestays',   icon: '🏡' },
  holiday:   { label: 'Holiday Packages',     icon: '🧳' },
  train:     { label: 'Trains',               icon: '🚆' },
  bus:       { label: 'Buses',                icon: '🚌' },
  cab:       { label: 'Cabs',                 icon: '🚖' },
  tour:      { label: 'Tours & Attractions',  icon: '🎡' },
  visa:      { label: 'Visa',                 icon: '🛂' },
  cruise:    { label: 'Cruise',               icon: '🚢' },
  forex:     { label: 'Forex & Currency',     icon: '💳' },
  insurance: { label: 'Travel Insurance',     icon: '🛡️' },
  multi:     { label: 'Multi-Service',        icon: '🌐' },
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const AdminVendors = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showHotels, setShowHotels] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [vendorHotels, setVendorHotels] = useState([])
  const [loadingHotels, setLoadingHotels] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', vendorType: 'flight'
  })

  useEffect(() => { fetchVendors() }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE_URL}/admin/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendors(res.data.data.vendors || [])
    } catch {
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
    }
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
      const res = await axios.post(`${API_BASE_URL}/admin/vendors`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Vendor created successfully')
      setVendors([res.data.data.vendor, ...vendors])
      setFormData({ name: '', email: '', password: '', phone: '', vendorType: 'flight' })
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
      const res = await axios.get(`${API_BASE_URL}/admin/vendors/${vendor.id}/hotels`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendorHotels(res.data.data.hotels || [])
      setShowHotels(true)
    } catch {
      toast.error('Failed to load vendor hotels')
    } finally {
      setLoadingHotels(false)
    }
  }

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Delete this vendor? This cannot be undone.')) return
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/admin/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Vendor deleted')
      setVendors(vendors.filter(v => v.id !== vendorId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vendor')
    }
  }

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Vendors</h2>
            <p className="text-sm text-base-content/50 mt-0.5">Manage platform vendors across all categories</p>
          </div>
          <button className="btn btn-primary btn-sm gap-2 w-fit" onClick={() => setShowForm(true)}>
            <RiAddLine className="w-4 h-4" />
            Register Vendor
          </button>
        </div>

        {/* Search */}
        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <RiSearchLine className="w-4 h-4 text-base-content/40" />
          <input
            type="text"
            className="grow"
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading vendors...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiStoreLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No vendors found</p>
              <p className="text-sm text-base-content/50 mt-1">
                {search ? 'Try a different search term' : 'Register your first vendor to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>Vendor</th>
                    <th>Type</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(vendor => {
                    const typeInfo = VENDOR_TYPES[vendor.vendorType] || { label: vendor.vendorType, icon: '🏢' }
                    return (
                      <tr key={vendor.id} className="hover:bg-base-200/50 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="w-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                <span>{vendor.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-base-content">{vendor.name}</p>
                              <p className="text-[11px] text-base-content/50">{vendor.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline badge-sm gap-1">
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        </td>
                        <td className="text-sm text-base-content/60">{vendor.phone}</td>
                        <td>
                          <span className={`badge badge-sm ${vendor.vendorStatus === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                            {vendor.vendorStatus}
                          </span>
                        </td>
                        <td className="text-xs text-base-content/50">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="btn btn-ghost btn-xs gap-1"
                              onClick={() => handleViewHotels(vendor)}
                            >
                              <RiEyeLine className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1"
                              onClick={() => handleDelete(vendor.id)}
                            >
                              <RiDeleteBinLine className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Register Vendor Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <button
              className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4"
              onClick={() => !submitting && setShowForm(false)}
              disabled={submitting}
            >✕</button>
            <h3 className="font-bold text-lg mb-5">Register New Vendor</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Vendor Type *</span></div>
                <select
                  className="select select-bordered select-sm"
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={e => setFormData({ ...formData, vendorType: e.target.value })}
                  disabled={submitting}
                >
                  {Object.entries(VENDOR_TYPES).map(([key, { label, icon }]) => (
                    <option key={key} value={key}>{icon} {label}</option>
                  ))}
                </select>
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Vendor Name *</span></div>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder={VENDOR_TYPES[formData.vendorType]?.label + ' vendor name'}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Email *</span></div>
                <input
                  type="email"
                  className="input input-bordered input-sm"
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Phone *</span></div>
                <input
                  type="tel"
                  className="input input-bordered input-sm"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="form-control">
                <div className="label py-1"><span className="label-text text-sm font-medium">Password (min 8 chars) *</span></div>
                <input
                  type="password"
                  className="input input-bordered input-sm"
                  placeholder="Secure password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  disabled={submitting}
                  minLength={8}
                  required
                />
              </label>
              <div className="modal-action pt-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={submitting}>
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  Register
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => !submitting && setShowForm(false)} />
        </div>
      )}

      {/* View Hotels Modal */}
      {showHotels && selectedVendor && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4"
              onClick={() => setShowHotels(false)}
            >✕</button>
            <h3 className="font-bold text-lg mb-4">{selectedVendor.name}'s Hotels</h3>
            <div className="divider my-0 mb-4" />
            {loadingHotels ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="loading loading-spinner loading-md text-primary mb-2" />
                <p className="text-sm text-base-content/50">Loading hotels...</p>
              </div>
            ) : vendorHotels.length === 0 ? (
              <div className="text-center py-12 text-base-content/50">
                <p className="text-sm">No hotels added yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {vendorHotels.map(hotel => (
                  <div key={hotel.id} className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-base-content">{hotel.name}</h4>
                          <p className="text-xs text-base-content/50 mt-0.5">📍 {hotel.city}</p>
                        </div>
                        <span className={`badge badge-sm ${
                          hotel.listingStatus === 'APPROVED' ? 'badge-success' :
                          hotel.listingStatus === 'PENDING_APPROVAL' ? 'badge-warning' :
                          hotel.listingStatus === 'REJECTED' ? 'badge-error' : 'badge-neutral'
                        }`}>
                          {hotel.listingStatus?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-base-content/50">Price/Night</p>
                          <p className="font-semibold text-base-content">₹{hotel.pricePerNight?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-base-content/50">Rooms</p>
                          <p className="font-semibold text-base-content">{hotel.rooms}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-base-content/50">Rating</p>
                          <p className="font-semibold text-base-content">⭐ {hotel.rating?.toFixed(1)}</p>
                        </div>
                      </div>
                      {hotel.listingStatus === 'REJECTED' && hotel.rejectionReason && (
                        <div className="mt-3 p-2 bg-error/10 border border-error/20 rounded text-xs text-error">
                          <strong>Rejection reason:</strong> {hotel.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-backdrop" onClick={() => setShowHotels(false)} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminVendors
