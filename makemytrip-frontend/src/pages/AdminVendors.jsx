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
    vendorType: 'hotel'
  })
  const [submitting, setSubmitting] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

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
      setFormData({ name: '', email: '', password: '', phone: '', vendorType: 'hotel' })
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
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'hsl(var(--p))' }}></i>
          <p style={{ marginTop: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Loading vendors...</p>
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
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Register and manage hotel & flight vendors
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fas fa-plus"></i> Register New Vendor
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => !submitting && setShowForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Register New Vendor</h2>
                <button
                  className="modal-header button"
                  onClick={() => !submitting && setShowForm(false)}
                  disabled={submitting}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                      Vendor Type *
                    </label>
                    <select
                      name="vendorType"
                      value={formData.vendorType}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="hotel">Hotel Vendor</option>
                      <option value="flight">Flight Vendor</option>
                      <option value="multi">Multi-Service</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., SkyAirways Airlines"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="vendor@example.com"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#374151' }}>
                      Password (min 8 characters) *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter secure password"
                      required
                      minLength="8"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        background: '#1a73e8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        opacity: submitting ? 0.6 : 1
                      }}
                    >
                      {submitting ? 'Creating...' : 'Register Vendor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={submitting}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        background: '#e5e7eb',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {vendors.length === 0 ? (
          <div
            className="empty-state"
            style={{ minHeight: '400px', background: 'white', borderRadius: '8px' }}
          >
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }}></i>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>No vendors registered yet</p>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Click "Register New Vendor" to get started</p>
            </div>
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
                      <span style={{ background: vendor.vendorType === 'flight' ? '#fce7f3' : vendor.vendorType === 'multi' ? '#e0e7ff' : '#dbeafe', color: vendor.vendorType === 'flight' ? '#831843' : vendor.vendorType === 'multi' ? '#3730a3' : '#0c4a6e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                        {vendor.vendorType === 'flight' ? '✈️ Flight' : vendor.vendorType === 'multi' ? '🌐 Multi' : '🏨 Hotel'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: vendor.vendorStatus === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                          color: vendor.vendorStatus === 'ACTIVE' ? '#166534' : '#991b1b'
                        }}
                      >
                        {vendor.vendorStatus}
                      </span>
                    </td>
                    <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-sm"
                        onClick={() => handleViewHotels(vendor)}
                        style={{
                          background: '#dbeafe',
                          color: '#0c4a6e',
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDelete(vendor.id)}
                        style={{
                          background: '#fee2e2',
                          color: '#991b1b',
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showHotels && selectedVendor && (
          <div className="modal-overlay" onClick={() => !loadingHotels && setShowHotels(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedVendor.name}'s Hotels</h2>
                <button
                  onClick={() => setShowHotels(false)}
                  disabled={loadingHotels}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                {loadingHotels ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#1a73e8', marginBottom: '12px' }}></i>
                    <p style={{ color: '#6b7280' }}>Loading hotels...</p>
                  </div>
                ) : vendorHotels.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <p>No hotels added yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {vendorHotels.map(hotel => (
                      <div
                        key={hotel.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '16px',
                          background: '#f9fafb'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', color: '#1a1f36', fontSize: '14px', fontWeight: '700' }}>
                              {hotel.name}
                            </h4>
                            <p style={{ margin: '0', color: '#6b7280', fontSize: '13px' }}>
                              📍 {hotel.city}
                            </p>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background:
                                hotel.listingStatus === 'APPROVED'
                                  ? '#dcfce7'
                                  : hotel.listingStatus === 'PENDING_APPROVAL'
                                  ? '#fef3c7'
                                  : hotel.listingStatus === 'REJECTED'
                                  ? '#fee2e2'
                                  : '#e5e7eb',
                              color:
                                hotel.listingStatus === 'APPROVED'
                                  ? '#166534'
                                  : hotel.listingStatus === 'PENDING_APPROVAL'
                                  ? '#78350f'
                                  : hotel.listingStatus === 'REJECTED'
                                  ? '#991b1b'
                                  : '#374151'
                            }}
                          >
                            {hotel.listingStatus.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px' }}>
                          <div>
                            <span style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' }}>Price/Night</span>
                            <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1a1f36' }}>
                              ₹{hotel.pricePerNight.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' }}>Rooms</span>
                            <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1a1f36' }}>
                              {hotel.rooms}
                            </p>
                          </div>
                          <div>
                            <span style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' }}>Rating</span>
                            <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#1a1f36' }}>
                              ⭐ {hotel.rating.toFixed(1)}
                            </p>
                          </div>
                        </div>

                        {hotel.listingStatus === 'REJECTED' && hotel.rejectionReason && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#fee2e2', borderRadius: '4px', fontSize: '12px', color: '#991b1b' }}>
                            <strong>Rejection Reason:</strong> {hotel.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminVendors
