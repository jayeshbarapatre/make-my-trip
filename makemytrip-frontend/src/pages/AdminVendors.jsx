import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import toast from 'react-hot-toast'
import axios from 'axios'
import './AdminFlights.css'

const AdminVendors = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
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
      setFormData({ name: '', email: '', password: '', phone: '' })
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor')
    } finally {
      setSubmitting(false)
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
              Register and manage hotel vendors
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
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Paradise Hotels"
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
                  <th>Hotels</th>
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
                      <span style={{ background: '#dbeafe', color: '#0c4a6e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                        {vendor._count?.hotels || 0} hotels
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
                    <td>
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
      </div>
    </AdminLayout>
  )
}

export default AdminVendors
