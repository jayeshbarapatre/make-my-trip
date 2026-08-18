import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminBookingsService } from '../services/adminService'
import Icons from '../utils/icons'
import { toLocalDateStr, formatApiDate } from '../utils/date'
import './AdminFlights.css'

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)

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
      const bDate = toLocalDateStr(booking.createdAt)
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
                        <div>{booking.userName || booking.user?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: 'gray' }}>{booking.userEmail || booking.user?.email || 'N/A'}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{booking.type}</td>
                      <td>₹{booking.totalAmount?.toLocaleString() || booking.amount?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`badge ${booking.status === 'confirmed' ? 'badge-active' : 'badge-inactive'}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>{formatApiDate(booking.createdAt)}</td>
                      <td>
                        <div className="actions" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                          <button className="btn-sm btn-edit" title="View" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }} onClick={() => setSelectedBooking(booking)}>
                            {Icons.eye ? Icons.eye({ size: 14 }) : '👁'} View
                          </button>
                          {booking.status !== 'confirmed' && (
                            <button className="btn-sm btn-toggle" title="Confirm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                              {Icons.check ? Icons.check({ size: 14 }) : '✓'} Confirm
                            </button>
                          )}
                          {booking.status !== 'cancelled' && (
                            <button className="btn-sm btn-delete" title="Cancel" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
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

      {/* View Booking Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Booking Details</h2>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Booking ID</div>
                  <div style={{ fontWeight: 600 }}>{selectedBooking.bookingId || selectedBooking.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                  <span className={`badge ${selectedBooking.status === 'confirmed' ? 'badge-active' : 'badge-inactive'}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                  <div>{formatApiDate(selectedBooking.createdAt, { withTime: true })}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</div>
                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>₹{selectedBooking.totalAmount?.toLocaleString() || selectedBooking.amount?.toLocaleString() || 0}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>User Details</div>
                <div><strong>Name:</strong> {selectedBooking.userName || selectedBooking.user?.name || 'N/A'}</div>
                <div><strong>Email:</strong> {selectedBooking.userEmail || selectedBooking.user?.email || 'N/A'}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Service Details ({selectedBooking.type})</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                  {selectedBooking.type === 'flight' && (
                    <>
                      <div><strong>Airline:</strong> {selectedBooking.airline} ({selectedBooking.flightNumber})</div>
                      <div><strong>Route:</strong> {selectedBooking.fromCity} → {selectedBooking.toCity}</div>
                      <div><strong>Date:</strong> {selectedBooking.departureDate}</div>
                      <div><strong>Seats:</strong> {selectedBooking.seatCount}</div>
                    </>
                  )}
                  {selectedBooking.type === 'hotel' && (
                    <>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Hotel:</strong> {selectedBooking.hotelName}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Location:</strong> {selectedBooking.hotelLocality || selectedBooking.toCity}</div>
                      <div><strong>Check-In:</strong> {selectedBooking.checkIn}</div>
                      <div><strong>Check-Out:</strong> {selectedBooking.checkOut}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Room:</strong> {selectedBooking.roomName} ({selectedBooking.rooms} Room{selectedBooking.rooms > 1 ? 's' : ''})</div>
                    </>
                  )}
                  {selectedBooking.type === 'bus' && (
                    <>
                      <div><strong>Operator:</strong> {selectedBooking.busOperator}</div>
                      <div><strong>Bus Type:</strong> {selectedBooking.busType}</div>
                      <div><strong>Route:</strong> {selectedBooking.fromCity} → {selectedBooking.toCity}</div>
                      <div><strong>Date:</strong> {selectedBooking.departureDate}</div>
                    </>
                  )}
                  {selectedBooking.type === 'cab' && (
                    <>
                      <div><strong>Cab Type:</strong> {selectedBooking.cabType} ({selectedBooking.cabModel})</div>
                      <div><strong>Date:</strong> {selectedBooking.travelDate}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Pickup:</strong> {selectedBooking.pickupLocation}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong>Drop:</strong> {selectedBooking.dropLocation}</div>
                      {selectedBooking.driver && <div><strong>Driver:</strong> {selectedBooking.driver.name} ({selectedBooking.driver.phone})</div>}
                      {selectedBooking.licensePlate && <div><strong>Plate:</strong> {selectedBooking.licensePlate}</div>}
                    </>
                  )}
                  {selectedBooking.type === 'train' && (
                    <>
                      <div><strong>Train:</strong> {selectedBooking.trainName} ({selectedBooking.trainNumber})</div>
                      <div><strong>Route:</strong> {selectedBooking.fromCity} → {selectedBooking.toCity}</div>
                      <div><strong>Date:</strong> {selectedBooking.departureDate || selectedBooking.travelDate}</div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Payment Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                  {selectedBooking.baseFare !== undefined && <div><strong>Base Fare:</strong> ₹{selectedBooking.baseFare}</div>}
                  {selectedBooking.taxes !== undefined && <div><strong>Taxes:</strong> ₹{selectedBooking.taxes}</div>}
                  {selectedBooking.convenience !== undefined && <div><strong>Convenience:</strong> ₹{selectedBooking.convenience}</div>}
                  {selectedBooking.discount !== undefined && <div><strong>Discount:</strong> ₹{selectedBooking.discount}</div>}
                  <div><strong>Total Paid:</strong> ₹{selectedBooking.totalAmount || selectedBooking.amount}</div>
                  <div><strong>Method:</strong> <span style={{ textTransform: 'uppercase' }}>{selectedBooking.paymentMethod || 'N/A'}</span></div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedBooking(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminBookings
