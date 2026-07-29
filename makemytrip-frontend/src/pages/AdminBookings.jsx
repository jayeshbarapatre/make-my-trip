import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminBookingsService } from '../services/adminService'
import Icons from '../utils/icons'
import './AdminFlights.css'

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await adminBookingsService.getAll()
      if (res.data.success && res.data.data) {
        setBookings(res.data.data)
      } else if (res.data) {
        setBookings(res.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(booking => {
    // 1. Text Search Filter
    const query = searchQuery.toLowerCase()
    const idMatch = (booking.bookingId || booking.id || '').toLowerCase().includes(query)
    const nameMatch = (booking.user?.name || '').toLowerCase().includes(query)
    const emailMatch = (booking.user?.email || '').toLowerCase().includes(query)
    const matchesSearch = !query || idMatch || nameMatch || emailMatch

    // 2. Type Dropdown Filter
    const matchesType = filterType === 'all' || (booking.type || '').toLowerCase() === filterType.toLowerCase()

    // 3. Date Picker Filter
    let matchesDate = true
    if (filterDate) {
      const bDate = new Date(booking.createdAt).toISOString().split('T')[0]
      matchesDate = bDate === filterDate
    }

    return matchesSearch && matchesType && matchesDate
  })

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Bookings Management</h1>
          </div>
        </div>
          
          {/* Advanced Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', boxSizing: 'border-box' }}>
            
            {/* Search Input with Icon */}
            <div style={{ position: 'relative', minWidth: '300px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                {Icons.search ? Icons.search({ size: 16 }) : '🔍'}
              </span>
              <input 
                type="text" 
                placeholder="Search by User, Email, or Booking ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', 
                  border: '1px solid var(--border)', background: 'var(--bg-hover)',
                  color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontSize: '14px'
                }}
              />
            </div>

            {/* Type Dropdown */}
            <div style={{ minWidth: '150px' }}>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px', 
                  border: '1px solid var(--border)', background: 'var(--bg-hover)',
                  color: 'var(--text-primary)', outline: 'none', fontSize: '14px', cursor: 'pointer'
                }}
              >
                <option value="all">All Types</option>
                <option value="hotel">Hotels</option>
                <option value="flight">Flights</option>
                <option value="cab">Cabs</option>
                <option value="bus">Buses</option>
                <option value="train">Trains</option>
              </select>
            </div>

            {/* Date Picker */}
            <div style={{ minWidth: '150px' }}>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px', 
                  border: '1px solid var(--border)', background: 'var(--bg-hover)',
                  color: 'var(--text-primary)', outline: 'none', fontSize: '14px', cursor: 'pointer'
                }}
              />
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || filterType !== 'all' || filterDate) && (
              <button 
                onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterDate(''); }}
                style={{
                  padding: '10px 16px', borderRadius: '8px', border: 'none',
                  background: 'hsl(var(--er) / 0.1)', color: 'hsl(var(--er))',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

        {error && <div className="error-message">{error}</div>}

        <div className="table-container">
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading bookings...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No bookings found.</td></tr>
                ) : (
                  filteredBookings.map(booking => (
                    <tr key={booking.id}>
                      <td className="font-bold">{booking.bookingId || booking.id.substring(0, 8)}</td>
                      <td>
                        <div>{booking.user?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: 'gray' }}>{booking.user?.email || 'N/A'}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{booking.type}</td>
                      <td>₹{booking.totalAmount?.toLocaleString() || booking.amount?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`badge ${booking.status === 'confirmed' ? 'badge-active' : 'badge-inactive'}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td>

                        <div className="actions">
                        <button className="btn-sm btn-edit" title="View">
                          {Icons.eye ? Icons.eye({ size: 14 }) : '👁'} View
                        </button>
                        {booking.status !== 'confirmed' && (
                          <button className="btn-sm btn-toggle" title="Confirm">
                            {Icons.check ? Icons.check({ size: 14 }) : '✓'} Confirm
                          </button>
                        )}
                        {booking.status !== 'cancelled' && (
                          <button className="btn-sm btn-delete" title="Cancel">
                            {Icons.close ? Icons.close({ size: 14 }) : '✕'} Cancel
                          </button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminBookings
