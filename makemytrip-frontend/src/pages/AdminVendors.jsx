import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import AdminLayout from '../components/Admin/AdminLayout'
import { AtmosphereModal } from '../components/Admin/VendorModals/AtmosphereModal'
import toast from 'react-hot-toast'
import axios from 'axios'
import {
  RiAddLine, RiEyeLine, RiDeleteBinLine, RiStoreLine,
  RiSearchLine, RiCloseLine, RiMailLine,
  RiPhoneLine, RiLockLine, RiShieldCheckLine
} from 'react-icons/ri'

const VENDOR_TYPES = {
  flight:    { label: 'Flights',             icon: '✈️',  placeholder: 'e.g., SkyAirways Airlines' },
  hotel:     { label: 'Hotels',              icon: '🏨',  placeholder: 'e.g., Paradise Hotels' },
  villa:     { label: 'Villas & Homestays',  icon: '🏡',  placeholder: 'e.g., CozyStay Villas' },
  holiday:   { label: 'Holiday Packages',    icon: '🧳',  placeholder: 'e.g., VacationWonders' },
  train:     { label: 'Trains',              icon: '🚆',  placeholder: 'e.g., RailTravel Express' },
  bus:       { label: 'Buses',               icon: '🚌',  placeholder: 'e.g., GoTravel Buses' },
  cab:       { label: 'Cabs',                icon: '🚖',  placeholder: 'e.g., RideHub Cabs' },
  tour:      { label: 'Tours & Attractions', icon: '🎡',  placeholder: 'e.g., ExploreWorld Tours' },
  visa:      { label: 'Visa',                icon: '🛂',  placeholder: 'e.g., TravelVisa Services' },
  cruise:    { label: 'Cruise',              icon: '🚢',  placeholder: 'e.g., SailingAdventures' },
  forex:     { label: 'Forex & Currency',    icon: '💳',  placeholder: 'e.g., MoneyExchange Services' },
  insurance: { label: 'Travel Insurance',    icon: '🛡️', placeholder: 'e.g., SafeTravel Insurance' },
  multi:     { label: 'Multi-Service',       icon: '🌐',  placeholder: 'e.g., TravelMax Services' },
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
const EMPTY_FORM = { name: '', email: '', password: '', phone: '', vendorType: 'flight' }

function VendorModal({ onClose, children }) {
  const theme = document.documentElement.getAttribute('data-theme') || 'light'
  return createPortal(
    <div
      data-theme={theme}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.6)',
      }}
      onClick={onClose}
    >
      <div
        style={{ maxHeight: '90vh', width: '100%', maxWidth: '640px' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

const AdminVendors = () => {
  const [vendors, setVendors]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [showForm, setShowForm]             = useState(false)
  const [showHotels, setShowHotels]         = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [vendorHotels, setVendorHotels]     = useState([])
  const [loadingHotels, setLoadingHotels]   = useState(false)
  const [formData, setFormData]             = useState(EMPTY_FORM)
  const [submitting, setSubmitting]         = useState(false)
  const [showPassword, setShowPassword]     = useState(false)

  useEffect(() => { fetchVendors() }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE_URL}/admin/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendors(res.data.data.vendors || [])
    } catch { toast.error('Failed to load vendors') }
    finally { setLoading(false) }
  }

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      return toast.error('All fields are required')
    }
    if (formData.password.length < 8) return toast.error('Password must be at least 8 characters')
    try {
      setSubmitting(true)
      const token = localStorage.getItem('adminToken')
      const res = await axios.post(`${API_BASE_URL}/admin/vendors`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Vendor registered successfully')
      setVendors([res.data.data.vendor, ...vendors])
      setFormData(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor')
    } finally { setSubmitting(false) }
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
    } catch { toast.error('Failed to load vendor hotels') }
    finally { setLoadingHotels(false) }
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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete vendor') }
  }

  const closeForm = () => { if (!submitting) { setShowForm(false); setFormData(EMPTY_FORM); setShowPassword(false) } }

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedType = VENDOR_TYPES[formData.vendorType]

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Vendors</h2>
            <p className="text-sm text-base-content/50 mt-0.5">Register and manage platform vendors across all categories</p>
          </div>
          <button className="btn btn-primary btn-sm gap-2 w-fit" onClick={() => setShowForm(true)}>
            <RiAddLine className="w-4 h-4" /> Register New Vendor
          </button>
        </div>

        {/* Search */}
        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <RiSearchLine className="w-4 h-4 text-base-content/40" />
          <input type="text" className="grow" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <p className="text-sm text-base-content/50 mt-1">{search ? 'Try a different search term' : 'Register your first vendor to get started'}</p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>Vendor</th><th>Type</th><th>Phone</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(vendor => {
                    const t = VENDOR_TYPES[vendor.vendorType] || { label: vendor.vendorType, icon: '🏢' }
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
                        <td><span className="badge badge-outline badge-sm gap-1">{t.icon} {t.label}</span></td>
                        <td className="text-sm text-base-content/60">{vendor.phone}</td>
                        <td><span className={`badge badge-sm ${vendor.vendorStatus === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>{vendor.vendorStatus}</span></td>
                        <td className="text-xs text-base-content/50">{new Date(vendor.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button className="btn btn-ghost btn-xs gap-1" onClick={() => handleViewHotels(vendor)}><RiEyeLine className="w-3.5 h-3.5" /> View</button>
                            <button className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1" onClick={() => handleDelete(vendor.id)}><RiDeleteBinLine className="w-3.5 h-3.5" /> Delete</button>
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

      {/* ── Register Vendor Modal (Atmosphere Design) ── */}
      {showForm && (
        <AtmosphereModal
          onClose={closeForm}
          formData={formData}
          onFormChange={handleChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          selectedVendor={null}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      )}

      {/* ── View Hotels Modal ── */}
      {showHotels && selectedVendor && (
        <VendorModal onClose={() => !loadingHotels && setShowHotels(false)}>
          <div className="card bg-base-100 shadow-2xl border border-base-200 w-full" style={{ maxHeight: '85vh', maxWidth: '640px', display: 'flex', flexDirection: 'column', backgroundColor: 'hsl(var(--b1))' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 shrink-0">
              <div>
                <h3 className="text-base font-bold text-base-content">{selectedVendor.name}</h3>
                <p className="text-xs text-base-content/50 mt-0.5">Vendor listings overview</p>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowHotels(false)}>
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }} className="p-6">
              {loadingHotels ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <span className="loading loading-spinner loading-lg text-primary mb-3" />
                  <p className="text-sm text-base-content/50">Loading hotels...</p>
                </div>
              ) : vendorHotels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-base-content/40">
                  <p className="text-sm">No hotels added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendorHotels.map(hotel => (
                    <div key={hotel.id} className="p-4 bg-base-200 rounded-xl border border-base-300">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-base-content">{hotel.name}</h4>
                          <p className="text-xs text-base-content/50 mt-0.5">📍 {hotel.city}</p>
                        </div>
                        <span className={`badge badge-sm ${hotel.listingStatus === 'APPROVED' ? 'badge-success' : hotel.listingStatus === 'PENDING_APPROVAL' ? 'badge-warning' : hotel.listingStatus === 'REJECTED' ? 'badge-error' : 'badge-neutral'}`}>
                          {hotel.listingStatus?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[{l:'Price/Night',v:`${hotel.pricePerNight?.toLocaleString()}`},{l:'Rooms',v:hotel.rooms},{l:'Rating',v:`⭐ ${hotel.rating?.toFixed(1)}`}].map(({l,v}) => (
                          <div key={l} className="bg-base-100 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] uppercase font-semibold text-base-content/40 mb-0.5">{l}</p>
                            <p className="text-sm font-bold text-base-content">{v}</p>
                          </div>
                        ))}
                      </div>
                      {hotel.listingStatus === 'REJECTED' && hotel.rejectionReason && (
                        <div className="mt-3 p-2.5 bg-error/10 border border-error/20 rounded-lg text-xs text-error">
                          <strong>Rejection reason:</strong> {hotel.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </VendorModal>
      )}
    </AdminLayout>
  )
}

export default AdminVendors
