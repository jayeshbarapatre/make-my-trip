import { useState, useEffect } from 'react'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService } from '../services/vendorService'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import {
  RiHotelLine, RiCheckLine, RiFileTextLine, RiTimeLine, RiCloseLine,
  RiStarLine, RiAddLine
} from 'react-icons/ri'
import './VendorDashboard.css'

const VendorDashboard = () => {
  const { theme } = useTheme()
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
        {/* Header */}
        <div className="vendor-header">
          <div>
            <h2 className="vendor-title">Good {greetingTime}! 👋</h2>
            <p className="vendor-subtitle">Here's your hotel inventory overview</p>
          </div>
          <button className="btn btn-primary btn-sm gap-2">
            <RiAddLine className="icon-sm" /> Add Hotel
          </button>
        </div>

        {error && <div className="vendor-error">{error}</div>}

        {/* KPI Cards */}
        <div className="vendor-kpi-grid">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon
            return (
              <div key={idx} className="vendor-kpi-card">
                <div className="vendor-kpi-content">
                  <p className="vendor-kpi-label">{kpi.label}</p>
                  <p className="vendor-kpi-value">{kpi.value}</p>
                </div>
                <Icon className="vendor-kpi-icon" />
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
                <div key={idx} className="vendor-metric-card">
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

        {/* Charts Row */}
        {stats.approved > 0 && bookingData.length > 0 && (
          <div className="vendor-charts-grid">
            {/* Booking Trend */}
            <div className="vendor-chart-card">
              <h3 className="vendor-chart-title">Weekly Booking Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={bookingData}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.area} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.area} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="date" stroke={chartColors.text} style={{ fontSize: '12px' }} />
                  <YAxis stroke={chartColors.text} style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b1))', border: '1px solid hsl(var(--bc) / 0.1))' }} />
                  <Area type="monotone" dataKey="bookings" stroke={chartColors.area} fillOpacity={1} fill="url(#colorBookings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Hotel */}
            <div className="vendor-chart-card">
              <h3 className="vendor-chart-title">Revenue Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="hotel" stroke={chartColors.text} style={{ fontSize: '12px' }} />
                  <YAxis stroke={chartColors.text} style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--b1))', border: '1px solid hsl(var(--bc) / 0.1))' }} />
                  <Bar dataKey="revenue" fill={chartColors.area} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
      </div>
    </VendorLayout>
  )
}

export default VendorDashboard
