import { useState, useEffect } from 'react'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService } from '../services/vendorService'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { useVendor } from '../context/VendorContext'
import {
  RiHotelLine, RiCheckLine, RiFileTextLine, RiTimeLine, RiCloseLine,
  RiStarLine, RiAddLine
} from 'react-icons/ri'
import './VendorDashboard.css'

const VendorDashboard = () => {
  const { theme } = useTheme()
  const { vendor } = useVendor()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [greetingTime, setGreetingTime] = useState('Morning')

  useEffect(() => {
    fetchHotels()
    updateGreeting()
  }, [])

  const updateGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingTime('Morning')
    else if (hour < 18) setGreetingTime('Afternoon')
    else setGreetingTime('Evening')
  }

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const response = await vendorHotelsService.getAll()
      setHotels(response.data.data.hotels || [])
      setError('')
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusStats = () => ({
    total: hotels.length,
    draft: hotels.filter(h => h.listingStatus === 'DRAFT').length,
    pending: hotels.filter(h => h.listingStatus === 'PENDING_APPROVAL').length,
    approved: hotels.filter(h => h.listingStatus === 'APPROVED').length,
    rejected: hotels.filter(h => h.listingStatus === 'REJECTED').length
  })

  const getPerformanceMetrics = () => {
    const approved = hotels.filter(h => h.listingStatus === 'APPROVED')
    const totalRating = approved.reduce((sum, h) => sum + (h.rating || 0), 0)
    const avgRating = approved.length > 0 ? (totalRating / approved.length).toFixed(1) : 0
    const totalRooms = hotels.reduce((sum, h) => sum + (h.rooms || 0), 0)
    const avgPrice = approved.length > 0
      ? (approved.reduce((sum, h) => sum + (h.pricePerNight || 0), 0) / approved.length).toFixed(0)
      : 0
    return { avgRating, totalRooms, avgPrice, approvedCount: approved.length }
  }

  const generateChartData = () => {
    if (hotels.length === 0) return { bookingData: [], revenueData: [] }

    const bookingData = hotels.slice(0, 7).map((hotel, idx) => ({
      date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx],
      bookings: Math.floor(Math.random() * 30)
    }))

    const revenueData = hotels.slice(0, 4).map(hotel => ({
      hotel: hotel.name.substring(0, 10),
      revenue: (hotel.pricePerNight || 0) * Math.floor(Math.random() * 10)
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
    { icon: RiHotelLine, label: 'Total Hotels', value: stats.total, color: 'primary' },
    { icon: RiCheckLine, label: 'Approved', value: stats.approved, color: 'success' },
    { icon: RiTimeLine, label: 'Pending', value: stats.pending, color: 'warning' },
    { icon: RiFileTextLine, label: 'Draft', value: stats.draft, color: 'info' },
    { icon: RiCloseLine, label: 'Rejected', value: stats.rejected, color: 'error' }
  ]

  const metricCards = [
    { icon: RiStarLine, label: 'Avg Rating', value: metrics.avgRating, suffix: '⭐' },
    { icon: RiHotelLine, label: 'Total Rooms', value: metrics.totalRooms, suffix: '' },
    { icon: RiCheckLine, label: 'Avg Price/Night', value: `₹${metrics.avgPrice}`, suffix: '' }
  ]

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
        {/* Greeting Banner with Atmospheric Design */}
        <div className="greeting-banner" style={{
          background: `linear-gradient(135deg, var(--accent) 0%, #ff6b4a 100%)`,
          borderRadius: '12px',
          padding: '32px 24px',
          marginBottom: '4px',
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
          boxShadow: '0 10px 15px -3px rgba(237, 74, 41, 0.15)'
        }}>
          {/* Atmospheric background circles */}
          <svg style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            opacity: 0.1
          }} viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="white" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="1" />
          </svg>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '700',
                fontFamily: "'Space Grotesk', serif"
              }}>
                Good {greetingTime}, {vendor?.name || 'Vendor'}! 👋
              </h1>
              <p style={{
                margin: 0,
                fontSize: '14px',
                opacity: 0.9
              }}>
                Here's your hotel inventory overview for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button className="btn btn-sm gap-2" style={{ width: 'fit-content', flex: 'none', background: 'white', color: '#ed4a29', border: 'none', borderRadius: '99px', fontWeight: '700', padding: '10px 20px', height: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <RiAddLine className="icon-sm" /> Add Hotel
            </button>
          </div>
        </div>

        {error && <div className="vendor-error">{error}</div>}

        {/* KPI Cards */}
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
                style={{
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid var(--border)'
                }}
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

        {/* Performance Metrics */}
        {stats.approved > 0 && (
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
                  style={{
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--border)'
                  }}
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

        {/* Recent Hotels */}
        <div className="vendor-hotels-card">
          <h3 className="vendor-hotels-title">Recent Hotels</h3>
          {hotels.length === 0 ? (
            <div className="vendor-empty-state">
              <RiHotelLine className="vendor-empty-icon" />
              <p className="vendor-empty-title">No hotels yet</p>
              <p className="vendor-empty-subtitle">Create your first hotel to get started</p>
            </div>
          ) : (
            <div className="vendor-table-container">
              <table className="vendor-table">
                <thead>
                  <tr className="vendor-table-header">
                    <th>Hotel</th>
                    <th>City</th>
                    <th>Rooms</th>
                    <th>Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.slice(0, 5).map(hotel => (
                    <tr key={hotel.id} className="vendor-table-row">
                      <td className="vendor-table-name">{hotel.name}</td>
                      <td className="vendor-table-cell">{hotel.city}</td>
                      <td className="vendor-table-cell">{hotel.rooms}</td>
                      <td className="vendor-table-cell">{hotel.rating ? `⭐ ${hotel.rating.toFixed(1)}` : '-'}</td>
                      <td>
                        <span className={`vendor-status-badge vendor-status-${hotel.listingStatus?.toLowerCase().replace(/_/g, '-')}`}>
                          {hotel.listingStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Charts Row */}
        {stats.approved > 0 && bookingData.length > 0 && (
          <div className="vendor-charts-grid">
            {/* Booking Trend */}
            <div className="vendor-chart-card">
              <h3 className="vendor-chart-title">Weekly Booking Trend</h3>
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
                    <YAxis stroke={chartColors.text} />
                    <Tooltip />
                    <Area type="monotone" dataKey="bookings" stroke={chartColors.area} fillOpacity={1} fill="url(#colorBookings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Hotel */}
            <div className="vendor-chart-card">
              <h3 className="vendor-chart-title">Revenue Distribution</h3>
              <div className="vendor-chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="hotel" stroke={chartColors.text} />
                    <YAxis stroke={chartColors.text} />
                    <Tooltip />
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
