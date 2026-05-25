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
import { useTheme } from '../context/ThemeContext'
import TabIcon from '../components/TabIcon'

const VENDOR_TYPES = {
  flight:    { label: 'Flights',             icon: 'flights',  placeholder: 'e.g., SkyAirways Airlines' },
  hotel:     { label: 'Hotels',              icon: 'hotels',  placeholder: 'e.g., Paradise Hotels' },
  villa:     { label: 'Villas & Homestays',  icon: 'villas',  placeholder: 'e.g., CozyStay Villas' },
  holiday:   { label: 'Holiday Packages',    icon: 'holidays',  placeholder: 'e.g., VacationWonders' },
  train:     { label: 'Trains',              icon: 'trains',  placeholder: 'e.g., RailTravel Express' },
  bus:       { label: 'Buses',               icon: 'buses',  placeholder: 'e.g., GoTravel Buses' },
  cab:       { label: 'Cabs',                icon: 'cabs',  placeholder: 'e.g., RideHub Cabs' },
  tour:      { label: 'Tours & Attractions', icon: 'tours',  placeholder: 'e.g., ExploreWorld Tours' },
  visa:      { label: 'Visa',                icon: 'visa',  placeholder: 'e.g., TravelVisa Services' },
  cruise:    { label: 'Cruise',              icon: 'cruise',  placeholder: 'e.g., SailingAdventures' },
  forex:     { label: 'Forex & Currency',    icon: 'forex',  placeholder: 'e.g., MoneyExchange Services' },
  insurance: { label: 'Travel Insurance',    icon: 'insurance', placeholder: 'e.g., SafeTravel Insurance' },
  multi:     { label: 'Multi-Service',       icon: 'flights',  placeholder: 'e.g., TravelMax Services' },
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'
const EMPTY_FORM = { name: '', email: '', password: '', phone: '', vendorType: 'flight' }

function VendorModal({ onClose, children }) {
  const { theme } = useTheme()
  return createPortal(
    <div
      data-theme={theme}
      className="admin-layout modal-backdrop-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 17, 23, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.95) translateY(12px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .modal-backdrop-overlay {
          animation: backdropFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .modal-inner-container {
          animation: modalScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .listing-card-premium {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                      box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                      border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .listing-card-premium:hover {
          transform: translateY(-3px);
          border-color: var(--accent) !important;
          box-shadow: var(--shadow-md) !important;
        }
        .modal-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .modal-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .modal-scroll-area::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
        .modal-scroll-area::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
      <div
        className="modal-inner-container"
        style={{
          maxHeight: '85vh',
          width: '100%',
          maxWidth: '640px',
          display: 'flex',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
        }}
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
  const [deletingVendorId, setDeletingVendorId] = useState(null)
  const [isDeleting, setIsDeleting]         = useState(false)

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
    console.log('[Vendor Registration] Form submission triggered', formData)
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      console.warn('[Vendor Registration] Missing fields:', {
        name: !formData.name,
        email: !formData.email,
        password: !formData.password,
        phone: !formData.phone
      })
      return toast.error('All fields are required')
    }
    if (formData.password.length < 8) {
      console.warn('[Vendor Registration] Password too short')
      return toast.error('Password must be at least 8 characters')
    }
    try {
      setSubmitting(true)
      const token = localStorage.getItem('adminToken')
      console.log('[Vendor Registration] Sending POST request to:', `${API_BASE_URL}/admin/vendors`)
      const res = await axios.post(`${API_BASE_URL}/admin/vendors`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('[Vendor Registration] Success response:', res.data)
      toast.success('Vendor registered successfully')
      setVendors([res.data.data.vendor, ...vendors])
      setFormData(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      console.error('[Vendor Registration] Error creating vendor:', err.response?.data || err.message)
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

  const handleDelete = (vendorId) => {
    setDeletingVendorId(vendorId)
  }

  const executeDelete = async () => {
    if (!deletingVendorId) return
    try {
      setIsDeleting(true)
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE_URL}/admin/vendors/${deletingVendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Vendor deleted')
      setVendors(vendors.filter(v => v.id !== deletingVendorId))
      setDeletingVendorId(null)
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to delete vendor') 
    } finally {
      setIsDeleting(false)
    }
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

        {/* Premium Header & Search Panel */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--fs-page-title)', fontWeight: 'var(--fw-page-title)', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Vendors</h2>
              <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Register and manage platform vendors across all categories</p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <RiAddLine style={{ width: '16px', height: '16px', strokeWidth: 2 }} /> Register New Vendor
            </button>
          </div>

          <div className="card-body">

          {/* Search bar inside the premium header card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              position: 'relative',
              flex: 1,
              maxWidth: '400px'
            }}>
              <RiSearchLine style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                width: '14px',
                height: '14px',
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search vendors by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 0,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RiCloseLine style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

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
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Vendor</th><th>Type</th><th>Phone</th><th>Status</th><th>Joined</th><th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(vendor => {
                      const t = VENDOR_TYPES[vendor.vendorType] || { label: vendor.vendorType, icon: 'flights' }
                      return (
                        <tr key={vendor.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsla(var(--p), 0.1)', color: 'hsl(var(--p))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                                {vendor.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{vendor.name}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{vendor.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-primary" style={{ textTransform: 'none', background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                              <span style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}><TabIcon id={t.icon} size={14} /></span> {t.label}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{vendor.phone}</td>
                          <td>
                            <span className={`badge ${vendor.vendorStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                              {vendor.vendorStatus}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button className="btn btn-sm btn-secondary" onClick={() => handleViewHotels(vendor)}>
                                <RiEyeLine /> View
                              </button>
                              <button className="btn btn-sm btn-danger" style={{ background: 'hsla(var(--er), 0.1)', color: 'hsl(var(--er))', border: '1px solid transparent' }} onClick={() => handleDelete(vendor.id)}>
                                <RiDeleteBinLine /> Delete
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
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, var(--accentSoft) 30%, transparent)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TabIcon id={VENDOR_TYPES[selectedVendor.vendorType]?.icon || 'flights'} size={24} />
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: selectedVendor.vendorStatus === 'ACTIVE' ? 'var(--accentSoft)' : 'rgba(255, 77, 79, 0.1)',
                    color: selectedVendor.vendorStatus === 'ACTIVE' ? 'var(--accent)' : '#ff4d4f',
                  }}>
                    {selectedVendor.vendorStatus} PARTNER
                  </span>
                </div>
                <h3 style={{ fontSize: 'var(--fs-section-heading)', fontWeight: 'var(--fw-section-heading)', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                  {selectedVendor.name}
                </h3>
                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {VENDOR_TYPES[selectedVendor.vendorType]?.label || 'Vendor'} · Listings and inventory status
                </p>
              </div>
              <button 
                onClick={() => setShowHotels(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.color = 'var(--accent)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                aria-label="Close"
              >
                <RiCloseLine style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Content */}
            <div className="modal-scroll-area" style={{ overflowY: 'auto', flex: 1, padding: '24px 28px' }}>
              {loadingHotels ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                  <span className="loading loading-spinner loading-lg text-primary" style={{ marginBottom: '16px', color: 'var(--accent)' }} />
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Retrieving listing records...</p>
                </div>
              ) : vendorHotels.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--surface2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    border: '1px solid var(--border)'
                  }}>
                    <RiStoreLine style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }} />
                  </div>
                  <p style={{ fontSize: '15px', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>No active listings</p>
                  <p style={{ fontSize: '12.5px', margin: '4px 0 0', color: 'var(--text-secondary)' }}>This vendor has not published any listings yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase', marginBottom: '-4px' }}>
                    Active Listings ({vendorHotels.length})
                  </div>
                  {vendorHotels.map(hotel => {
                    const isApproved = hotel.listingStatus === 'APPROVED'
                    const isPending = hotel.listingStatus === 'PENDING_APPROVAL'
                    const isRejected = hotel.listingStatus === 'REJECTED'

                    const badgeBg = isApproved ? 'rgba(46, 193, 88, 0.12)' : isPending ? 'rgba(255, 193, 7, 0.12)' : isRejected ? 'rgba(255, 77, 79, 0.12)' : 'var(--surface2)'
                    const badgeText = isApproved ? '#2ec158' : isPending ? '#d39e00' : isRejected ? '#ff4d4f' : 'var(--text-secondary)'

                    return (
                      <div key={hotel.id} className="listing-card-premium" style={{
                        padding: '20px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}>
                        {/* Info Header Row */}
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          {/* Thumbnail or placeholder */}
                          {hotel.image ? (
                            <img src={hotel.image} alt={hotel.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                          ) : (
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, var(--accentSoft) 0%, transparent 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                              border: '1px solid var(--border)',
                              flexShrink: 0
                            }}>
                              <TabIcon id={VENDOR_TYPES[selectedVendor.vendorType]?.icon || 'flights'} size={24} />
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: 'var(--fs-card-title)', fontWeight: 'var(--fw-card-title)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>
                                {hotel.name}
                              </h4>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                background: badgeBg,
                                color: badgeText,
                                display: 'inline-block'
                              }}>
                                {hotel.listingStatus?.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '14px' }}>📍</span> {hotel.city} {hotel.location ? `· ${hotel.location}` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          {[
                            { label: 'Price / Night', value: `₹${(hotel.pricePerNight || hotel.price || 0).toLocaleString()}` },
                            { label: 'Rooms Inventory', value: hotel.rooms || 0 },
                            { 
                              label: `${hotel.reviews || 0} reviews`, 
                              value: (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <span style={{ color: '#F59E0B' }}>★</span> {hotel.rating?.toFixed(1) || '0.0'}
                                </span>
                              )
                            }
                          ].map(({ label, value }) => (
                            <div key={label} style={{
                              background: 'var(--surface2)',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              padding: '10px 8px',
                              textAlign: 'center',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <p style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px', letterSpacing: '0.05em' }}>
                                {label}
                              </p>
                              <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Rejection Alert */}
                        {isRejected && hotel.rejectionReason && (
                          <div style={{
                            padding: '12px 14px',
                            background: 'rgba(255, 77, 79, 0.05)',
                            border: '1px dashed rgba(255, 77, 79, 0.3)',
                            borderRadius: '12px',
                            fontSize: '12.5px',
                            color: '#ff4d4f',
                            lineHeight: 1.5,
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ fontSize: '15px', marginTop: '1px' }}>⚠️</span>
                            <div>
                              <strong style={{ fontWeight: 600 }}>Rejection reason:</strong> {hotel.rejectionReason}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </VendorModal>
      )}
      {/* Delete Confirmation Modal */}
      {deletingVendorId && (
        <VendorModal onClose={() => !isDeleting && setDeletingVendorId(null)}>
          <div style={{ padding: '32px 24px', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  <RiDeleteBinLine />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Delete Vendor
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setDeletingVendorId(null)}
                disabled={isDeleting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <RiCloseLine style={{ fontSize: '24px' }} />
              </button>
            </div>

            <div style={{ marginBottom: '32px', color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.6 }}>
              Are you sure you want to delete this vendor? All associated data and listings will be permanently removed from the platform.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'auto' }}>
              <button
                className="btn btn-outline"
                onClick={() => setDeletingVendorId(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                style={{ background: '#ff4d4f', color: '#fff', border: 'none' }}
                onClick={executeDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-sm" style={{ marginRight: '8px' }}></span>
                ) : null}
                Delete Vendor
              </button>
            </div>
          </div>
        </VendorModal>
      )}

    </AdminLayout>
  )
}

export default AdminVendors
