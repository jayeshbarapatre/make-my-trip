import { useState, useEffect, useMemo } from 'react'
import VendorLayout from '../components/Vendor/VendorLayout'
import { useTheme } from '../context/ThemeContext'
import { useVendor } from '../context/VendorContext'
import { vendorBookingsService } from '../services/vendorService'
import Icons from '../utils/icons'
import toast from 'react-hot-toast'
import './VendorDashboard.css'

const VendorBookings = () => {
  const { theme } = useTheme()
  const { vendor } = useVendor()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await vendorBookingsService.getAll()
      const fetchedBookings = res.data.data.map(b => {
        let details = 'Booking'
        if (b.type === 'hotel') details = b.hotelName || 'Hotel Booking'
        else if (b.type === 'bus') details = `${b.source || b.from || ''} to ${b.destination || b.to || ''}`
        else if (b.type === 'cab') details = `${b.pickupCity || ''} to ${b.dropCity || ''}`

        return {
          id: b.bookingId || b.id,
          user: { name: b.userName || 'Guest', email: b.userEmail || 'N/A' },
          type: b.type,
          amount: b.totalAmount || b.price || 0,
          status: (b.status || 'confirmed').toLowerCase(),
          createdAt: b.createdAt || new Date().toISOString(),
          details: details
        }
      })
      setBookings(fetchedBookings)
    } catch (err) {
      toast.error('Failed to load bookings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const stats = useMemo(() => {
    let hotelRev = 0, cabRev = 0, busRev = 0
    let hotelCount = 0, cabCount = 0, busCount = 0

    bookings.forEach(b => {
      if (b.status !== 'cancelled') {
        if (b.type === 'hotel') { hotelRev += b.amount; hotelCount++ }
        if (b.type === 'cab') { cabRev += b.amount; cabCount++ }
        if (b.type === 'bus') { busRev += b.amount; busCount++ }
      }
    })

    return { hotelRev, cabRev, busRev, hotelCount, cabCount, busCount }
  }, [bookings])

  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase()
    const idMatch = booking.id.toLowerCase().includes(query)
    const nameMatch = booking.user.name.toLowerCase().includes(query)
    const emailMatch = booking.user.email.toLowerCase().includes(query)
    const matchesSearch = !query || idMatch || nameMatch || emailMatch

    const matchesType = filterType === 'all' || booking.type === filterType

    return matchesSearch && matchesType
  })

  return (
    <VendorLayout>
      <div className="vendor-dashboard-wrapper">
        <div className="greeting-banner" style={{
          background: `linear-gradient(135deg, var(--accent) 0%, #ff6b4a 100%)`,
          borderRadius: '12px',
          padding: '32px 24px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
          boxShadow: '0 10px 15px -3px rgba(237, 74, 41, 0.15)'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', fontFamily: "'Space Grotesk', serif" }}>
              Your Bookings
            </h1>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              Manage all bookings for your listed inventory.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="vendor-hotels-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Total Bus Revenue</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>₹{stats.busRev.toLocaleString()}</p>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stats.busCount} Booking(s)</span>
          </div>
          <div className="vendor-hotels-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Total Cab Revenue</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>₹{stats.cabRev.toLocaleString()}</p>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stats.cabCount} Booking(s)</span>
          </div>
          <div className="vendor-hotels-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Total Hotel Revenue</h4>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>₹{stats.hotelRev.toLocaleString()}</p>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stats.hotelCount} Booking(s)</span>
          </div>
        </div>

        {/* Filters */}
        <div className="vendor-hotels-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              {Icons.search ? Icons.search({ size: 16 }) : '🔍'}
            </span>
            <input 
              type="text" 
              placeholder="Search by ID, Name or Email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', 
                border: '1px solid var(--border)', background: 'var(--bg-hover)',
                color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontSize: '14px'
              }}
            />
          </div>
          
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
              <option value="cab">Cabs</option>
              <option value="bus">Buses</option>
            </select>
          </div>

          {(searchQuery || filterType !== 'all') && (
            <button 
              onClick={() => { setSearchQuery(''); setFilterType('all'); }}
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

        {/* Bookings Table */}
        <div className="vendor-hotels-card">
          <h3 className="vendor-hotels-title">Recent Bookings</h3>
          {loading ? (
             <div className="vendor-loading" style={{ height: '200px' }}>
               <span className="loading loading-spinner loading-lg text-primary" />
             </div>
          ) : filteredBookings.length === 0 ? (
            <div className="vendor-empty-state">
              <p className="vendor-empty-title">No bookings found</p>
              <p className="vendor-empty-subtitle">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="vendor-table-container">
              <table className="vendor-table">
                <thead>
                  <tr className="vendor-table-header">
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Inventory Type</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(booking => (
                    <tr key={booking.id} className="vendor-table-row">
                      <td className="vendor-table-name" style={{ fontSize: '13px' }}>{booking.id}</td>
                      <td className="vendor-table-cell">
                        <div>{booking.user.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{booking.user.email}</div>
                      </td>
                      <td className="vendor-table-cell" style={{ textTransform: 'capitalize' }}>{booking.type}</td>
                      <td className="vendor-table-cell" style={{ fontSize: '13px' }}>{booking.details}</td>
                      <td className="vendor-table-cell">₹{booking.amount.toLocaleString()}</td>
                      <td>
                        <span className={`vendor-status-badge vendor-status-${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="vendor-table-cell">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  )
}

export default VendorBookings
