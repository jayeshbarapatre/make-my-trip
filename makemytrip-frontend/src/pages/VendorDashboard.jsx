import { useState, useEffect } from 'react'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService, vendorBusesService, vendorCabsService, vendorBookingsService } from '../services/vendorService'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useVendor } from '../context/VendorContext'
import {
  RiHotelLine, RiCheckLine, RiFileTextLine, RiTimeLine, RiCloseLine,
  RiStarLine, RiAddLine, RiBusFill, RiCarFill, RiBuilding2Line
} from 'react-icons/ri'
import './VendorDashboard.css'

const VendorDashboard = () => {
  const { theme } = useTheme()
  const { vendor } = useVendor()
  
  const [activeTab, setActiveTab] = useState('bookings') // 'hotels', 'buses', 'cabs', 'bookings'
  
  const [hotels, setHotels] = useState([])
  const [buses, setBuses] = useState([])
  const [cabs, setCabs] = useState([])
  const [bookings, setBookings] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [greetingTime, setGreetingTime] = useState('Morning')

  const updateGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingTime('Morning')
    else if (hour < 18) setGreetingTime('Afternoon')
    else setGreetingTime('Evening')
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const [hotelsRes, busesRes, cabsRes, bookingsRes] = await Promise.all([
        vendorHotelsService.getAll().catch(() => ({ data: { data: { hotels: [] } } })),
        vendorBusesService.getAll().catch(() => ({ data: { data: { buses: [] } } })),
        vendorCabsService.getAll().catch(() => ({ data: { data: { cabs: [] } } })),
        vendorBookingsService.getAll().catch(() => ({ data: { data: [] } }))
      ])

      setHotels(hotelsRes.data?.data?.hotels || [])
      setBuses(busesRes.data?.data?.buses || [])
      setCabs(cabsRes.data?.data?.cabs || [])
      
      const fetchedBookings = (bookingsRes.data?.data || []).map(b => {
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
      
      setError('')
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    updateGreeting()
  }, [])

  const getStatusStats = () => {
    const allListings = [...hotels, ...buses, ...cabs]
    return {
      total: allListings.length,
      draft: allListings.filter(h => h.listingStatus === 'DRAFT').length,
      pending: allListings.filter(h => h.listingStatus === 'PENDING_APPROVAL').length,
      approved: allListings.filter(h => h.listingStatus === 'APPROVED').length,
      rejected: allListings.filter(h => h.listingStatus === 'REJECTED').length
    }
  }

  const getPerformanceMetrics = () => {
    if (activeTab === 'bookings') {
      let hotelRev = 0, cabRev = 0, busRev = 0
      bookings.forEach(b => {
        if (b.status !== 'cancelled') {
          if (b.type === 'hotel') hotelRev += b.amount
          if (b.type === 'cab') cabRev += b.amount
          if (b.type === 'bus') busRev += b.amount
        }
      })
      const totalRev = hotelRev + cabRev + busRev
      return { 
        avgRating: 0, 
        totalCapacity: bookings.length, 
        avgPrice: totalRev, 
        approvedCount: bookings.length, 
        capacityLabel: 'Total Bookings',
        isRevenue: true
      }
    }

    let currentListings = []
    if (activeTab === 'hotels') currentListings = hotels
    if (activeTab === 'buses') currentListings = buses
    if (activeTab === 'cabs') currentListings = cabs

    const approved = currentListings.filter(h => h.listingStatus === 'APPROVED')
    const totalRating = approved.reduce((sum, h) => sum + (h.rating || 0), 0)
    const avgRating = approved.length > 0 ? (totalRating / approved.length).toFixed(1) : 0
    
    let totalCapacity = 0
    let avgPrice = 0
    let capacityLabel = 'Total Rooms'
    
    if (activeTab === 'hotels') {
      totalCapacity = currentListings.reduce((sum, h) => sum + (h.rooms || 0), 0)
      avgPrice = approved.length > 0
        ? (approved.reduce((sum, h) => sum + (h.pricePerNight || 0), 0) / approved.length).toFixed(0)
        : 0
    } else if (activeTab === 'buses') {
      capacityLabel = 'Total Seats'
      totalCapacity = currentListings.reduce((sum, b) => sum + (b.totalSeats || b.seatingCapacity || 0), 0)
      avgPrice = approved.length > 0
        ? (approved.reduce((sum, b) => sum + (b.price || b.baseFare || 0), 0) / approved.length).toFixed(0)
        : 0
    } else if (activeTab === 'cabs') {
      capacityLabel = 'Total Vehicles'
      totalCapacity = currentListings.reduce((sum, c) => sum + (c.availableCount || c.available || 0), 0)
      avgPrice = approved.length > 0
        ? (approved.reduce((sum, c) => sum + (c.price || c.baseFare || 0), 0) / approved.length).toFixed(0)
        : 0
    }

    return { avgRating, totalCapacity, avgPrice, approvedCount: approved.length, capacityLabel, isRevenue: false }
  }

  const generateChartData = () => {
    let hotelRev = 0, cabRev = 0, busRev = 0
    bookings.forEach(b => {
      if (b.status !== 'cancelled') {
        if (b.type === 'hotel') hotelRev += b.amount
        if (b.type === 'cab') cabRev += b.amount
        if (b.type === 'bus') busRev += b.amount
      }
    })

    const revenueData = [
      { listing: 'Hotels', revenue: hotelRev },
      { listing: 'Buses', revenue: busRev },
      { listing: 'Cabs', revenue: cabRev }
    ].filter(item => item.revenue > 0)

    const daysMap = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 }
    bookings.forEach(b => {
      const date = new Date(b.createdAt)
      if (!isNaN(date)) {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
        daysMap[dayName] += b.amount
      }
    })

    const bookingData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(date => ({
      date,
      revenue: daysMap[date]
    }))

    return { bookingData, revenueData }
  }

  const getChartColors = () => ({
    area: theme === 'light' ? 'hsl(var(--p))' : 'hsl(var(--p))',
    text: theme === 'light' ? 'hsl(var(--bc) / 0.6)' : 'hsl(var(--bc) / 0.5)',
    grid: theme === 'light' ? 'hsl(var(--b3))' : 'hsl(var(--bc) / 0.65)'
  })

  const stats = getStatusStats()
  const metrics = getPerformanceMetrics()
  const chartColors = getChartColors()
  const { bookingData, revenueData } = generateChartData()

  const kpiCards = [
    { icon: RiBuilding2Line, label: 'Total Listings', value: stats.total, color: 'primary' },
    { icon: RiCheckLine, label: 'Approved', value: stats.approved, color: 'success' },
    { icon: RiTimeLine, label: 'Pending', value: stats.pending, color: 'warning' },
    { icon: RiFileTextLine, label: 'Draft', value: stats.draft, color: 'info' },
    { icon: RiCloseLine, label: 'Rejected', value: stats.rejected, color: 'error' }
  ]

  const metricCards = metrics.isRevenue ? [
    { icon: RiBuilding2Line, label: 'Total Bookings', value: metrics.totalCapacity, suffix: '' },
    { icon: RiCheckLine, label: 'Total Revenue', value: `₹${metrics.avgPrice.toLocaleString()}`, suffix: '' }
  ] : [
    { icon: RiStarLine, label: 'Avg Rating', value: metrics.avgRating, suffix: '⭐' },
    { icon: RiHotelLine, label: metrics.capacityLabel, value: metrics.totalCapacity, suffix: '' },
    { icon: RiCheckLine, label: 'Avg Price', value: `₹${metrics.avgPrice}`, suffix: '' }
  ]

  const renderRecentTable = () => {
    if (activeTab === 'bookings') {
      if (bookings.length === 0) {
        return (
          <div className="vendor-empty-state">
            <RiFileTextLine className="vendor-empty-icon" />
            <p className="vendor-empty-title">No bookings yet</p>
            <p className="vendor-empty-subtitle">When users book your inventory, they will appear here.</p>
          </div>
        )
      }

      return (
        <div className="vendor-table-container">
          <table className="vendor-table">
            <thead>
              <tr className="vendor-table-header">
                <th>Customer</th>
                <th>Service Type</th>
                <th>Details</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 10).map(booking => (
                <tr key={booking.id} className="vendor-table-row">
                  <td className="vendor-table-cell">
                    <div>{booking.user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{booking.user.email}</div>
                  </td>
                  <td className="vendor-table-cell" style={{ textTransform: 'capitalize' }}>{booking.type}</td>
                  <td className="vendor-table-cell" style={{ fontSize: '13px' }}>{booking.details}</td>
                  <td className="vendor-table-cell" style={{ fontWeight: 'bold' }}>₹{booking.amount.toLocaleString()}</td>
                  <td>
                    <span className={`vendor-status-badge vendor-status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    let currentListings = []
    if (activeTab === 'hotels') currentListings = hotels
    if (activeTab === 'buses') currentListings = buses
    if (activeTab === 'cabs') currentListings = cabs

    if (currentListings.length === 0) {
      return (
        <div className="vendor-empty-state">
          {activeTab === 'hotels' && <RiHotelLine className="vendor-empty-icon" />}
          {activeTab === 'buses' && <RiBusFill className="vendor-empty-icon" />}
          {activeTab === 'cabs' && <RiCarFill className="vendor-empty-icon" />}
          <p className="vendor-empty-title">No {activeTab} yet</p>
          <p className="vendor-empty-subtitle">Create your first listing to get started</p>
        </div>
      )
    }

    return (
      <div className="vendor-table-container">
        <table className="vendor-table">
          <thead>
            <tr className="vendor-table-header">
              <th>Name / Operator</th>
              <th>Route / City</th>
              <th>Capacity</th>
              <th>Rating</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentListings.slice(0, 5).map(listing => {
              const name = listing.name || listing.operatorName || listing.cabName
              const route = listing.city || `${listing.from} - ${listing.to}`
              const capacity = listing.rooms || listing.totalSeats || listing.availableCount || listing.available || '-'
              return (
                <tr key={listing.id} className="vendor-table-row">
                  <td className="vendor-table-name">{name}</td>
                  <td className="vendor-table-cell">{route}</td>
                  <td className="vendor-table-cell">{capacity}</td>
                  <td className="vendor-table-cell">{listing.rating ? `⭐ ${listing.rating.toFixed(1)}` : '-'}</td>
                  <td>
                    <span className={`vendor-status-badge vendor-status-${listing.listingStatus?.toLowerCase().replace(/_/g, '-')}`}>
                      {listing.listingStatus?.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return (
      <VendorLayout>
        <div className="vendor-loading">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </VendorLayout>
    )
  }

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
          <svg style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', opacity: 0.1 }} viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="white" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="1" />
          </svg>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', fontFamily: "'Space Grotesk', serif" }}>
                Good {greetingTime}, {vendor?.name || 'Vendor'}! 👋
              </h1>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                Here's your inventory overview for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-sm gap-2" style={{ background: 'white', color: '#ed4a29', border: 'none', borderRadius: '99px', fontWeight: '700', padding: '10px 20px', height: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <RiAddLine className="icon-sm" /> Add Listing
              </button>
            </div>
          </div>
        </div>

        {error && <div className="vendor-error">{error}</div>}

        <div className="vendor-kpi-grid">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon
            return (
              <div
                key={idx}
                className="vendor-kpi-card"
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.borderColor = 'rgba(237, 74, 41, 0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
                style={{ transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid var(--border)' }}
              >
                <div className="vendor-kpi-content">
                  <p className="vendor-kpi-label">{kpi.label}</p>
                  <p className="vendor-kpi-value">{kpi.value}</p>
                </div>
                <Icon className={`vendor-kpi-icon vendor-kpi-icon-${kpi.color}`} />
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <button 
            onClick={() => setActiveTab('bookings')}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'bookings' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'bookings' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <RiFileTextLine /> Revenue & Bookings
          </button>
          <button 
            onClick={() => setActiveTab('hotels')}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'hotels' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'hotels' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <RiHotelLine /> Hotels ({hotels.length})
          </button>
          <button 
            onClick={() => setActiveTab('buses')}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'buses' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'buses' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <RiBusFill /> Buses ({buses.length})
          </button>
          <button 
            onClick={() => setActiveTab('cabs')}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s',
              background: activeTab === 'cabs' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'cabs' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <RiCarFill /> Cabs ({cabs.length})
          </button>
        </div>

        {(metrics.approvedCount > 0 || metrics.isRevenue) && (
          <div className="vendor-metrics-grid">
            {metricCards.map((metric, idx) => {
              const Icon = metric.icon
              return (
                <div
                  key={idx}
                  className="vendor-metric-card"
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0, 0, 0, 0.06)'
                    e.currentTarget.style.borderColor = 'rgba(237, 74, 41, 0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                  style={{ transition: 'all 0.2s ease', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="vendor-metric-label">{metric.label}</p>
                    <p className="vendor-metric-value">{metric.value} {metric.suffix}</p>
                  </div>
                  <Icon className="vendor-metric-icon" />
                </div>
              )
            })}
          </div>
        )}

        <div className="vendor-hotels-card">
          <h3 className="vendor-hotels-title" style={{ textTransform: 'capitalize' }}>
            {activeTab === 'bookings' ? 'Recent User Bookings' : `Recent ${activeTab}`}
          </h3>
          {renderRecentTable()}
        </div>
        
        {bookings.length > 0 && revenueData.length > 0 && (
          <div className="vendor-charts-grid">
            <div className="vendor-chart-card">
              <h3 className="vendor-chart-title">Weekly Revenue Trend</h3>
              <div className="vendor-chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={bookingData}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.area} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.area} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="date" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke={chartColors.area} fillOpacity={1} fill="url(#colorBookings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="vendor-chart-card">
              <h3 className="vendor-chart-title">Revenue by Service</h3>
              <div className="vendor-chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="listing" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill={chartColors.area} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  )
}

export default VendorDashboard
