import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import AdminLayout from '../components/Admin/AdminLayout'
import { useTheme } from '../context/ThemeContext'
import { adminDashboardService } from '../services/adminService'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const { theme } = useTheme()
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [greetingTime, setGreetingTime] = useState('Morning')

  useEffect(() => {
    fetchData()
    updateGreeting()
  }, [])

  const updateGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingTime('Morning')
    else if (hour < 18) setGreetingTime('Afternoon')
    else setGreetingTime('Evening')
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, revenueRes, availRes] = await Promise.all([
        adminDashboardService.getStats(),
        adminDashboardService.getRevenue(),
        adminDashboardService.getAvailability()
      ])

      setStats(statsRes.data.data)
      setRevenue(revenueRes.data.data)
      setAvailability(availRes.data.data)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getChartColors = () => ({
    area: theme === 'light' ? 'hsl(var(--p))' : 'hsl(var(--p))',
    text: theme === 'light' ? 'hsl(var(--bc) / 0.6)' : 'hsl(var(--bc) / 0.5)',
    grid: theme === 'light' ? 'hsl(var(--b3))' : 'hsl(var(--bc) / 0.65)'
  })

  const weeklyData = [
    { day: 'Sun', visits: 30 },
    { day: 'Mon', visits: 70 },
    { day: 'Tue', visits: 65 },
    { day: 'Wed', visits: 80 },
    { day: 'Thu', visits: 90 },
    { day: 'Fri', visits: 75 },
    { day: 'Sat', visits: 45 }
  ]

  const countryData = [
    { name: 'USA', flag: '🇺🇸', value: 35365, trend: 'Last Month 2.5%' },
    { name: 'Germany', flag: '🇩🇪', value: 24865, trend: 'Last Month 1.2%' },
    { name: 'India', flag: '🇮🇳', value: 18369, trend: 'Last Month 0.8%' },
    { name: 'Brazil', flag: '🇧🇷', value: 11325, trend: 'Last Month 2.5%' }
  ]

  const bookingChartData = [
    { type: 'Flights', count: stats?.bookingsBreakdown?.flight || 0 },
    { type: 'Hotels', count: stats?.bookingsBreakdown?.hotel || 0 },
    { type: 'Buses', count: stats?.bookingsBreakdown?.bus || 0 },
    { type: 'Cabs', count: stats?.bookingsBreakdown?.cab || 0 }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i> Loading dashboard...
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      </AdminLayout>
    )
  }

  const chartColors = getChartColors()

  return (
    <AdminLayout>
      <div className="dashboard">
        {/* Greeting Banner with Atmospheric Design */}
        <div className="greeting-banner" style={{
          background: `linear-gradient(135deg, var(--accent) 0%, #ff6b4a 100%)`,
          borderRadius: '12px',
          padding: '32px 24px',
          marginBottom: '0',
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
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: '700',
              fontFamily: "'Space Grotesk', serif"
            }}>
              Good {greetingTime}, {stats?.adminName || 'Admin'}! 👋
            </h1>
            <p style={{
              margin: 0,
              fontSize: '14px',
              opacity: 0.9
            }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <KPICard
            icon="fas fa-dollar-sign"
            label="Total Revenue"
            value={`₹${(stats?.summary?.totalRevenue || 0).toLocaleString()}`}
            color="hsl(var(--p))"
            trend="+12.5% from last month"
          />
          <KPICard
            icon="fas fa-plane"
            label="Active Flights"
            value={stats?.active?.activeFlights || 0}
            color="hsl(var(--p))"
            trend="+8 new this month"
          />
          <KPICard
            icon="fas fa-hotel"
            label="Total Hotels"
            value={stats?.summary?.totalHotels || 0}
            color="hsl(var(--p))"
            trend="+5 new this month"
          />
          <KPICard
            icon="fas fa-calendar-check"
            label="Total Bookings"
            value={(stats?.bookingsBreakdown?.flight || 0) + (stats?.bookingsBreakdown?.hotel || 0) + (stats?.bookingsBreakdown?.bus || 0) + (stats?.bookingsBreakdown?.cab || 0)}
            color="hsl(var(--p))"
            trend="+2.4% today"
          />
        </div>

        {/* Booking Types */}
        <div className="booking-section">
          <div className="booking-grid">
            <BookingCard icon="fas fa-plane" label="Flights Booked" value={stats?.bookingsBreakdown?.flight || 0} color="hsl(var(--p))" />
            <BookingCard icon="fas fa-bed" label="Hotels Booked" value={stats?.bookingsBreakdown?.hotel || 0} color="hsl(var(--p))" />
            <BookingCard icon="fas fa-bus" label="Buses Booked" value={stats?.bookingsBreakdown?.bus || 0} color="hsl(var(--p))" />
            <BookingCard icon="fas fa-taxi" label="Cabs Booked" value={stats?.bookingsBreakdown?.cab || 0} color="hsl(var(--p))" />
          </div>
        </div>

        {/* Revenue & New Visitors */}
        <div className="dashboard-row two-col-65-35">
          <div className="chart-container">
            <div className="chart-header">
              <h2>Audience Overview</h2>
              <select className="year-selector">
                <option>This Year</option>
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>
            {revenue && revenue.revenues.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenue.revenues.map((val, idx) => ({
                  name: revenue.labels[idx],
                  value: val
                }))}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.area} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColors.area} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" stroke={chartColors.text} style={{ fontSize: '12px' }} />
                  <YAxis stroke={chartColors.text} style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'light' ? 'hsl(var(--b1))' : 'hsl(var(--bc) / 0.8)',
                      border: `1px solid ${chartColors.grid}`,
                      borderRadius: '6px',
                      color: chartColors.text
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="value" stroke={chartColors.area} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">No revenue data available</div>
            )}
          </div>

          <div className="chart-container visitors-card">
            <h3 className="visitors-title">New Visitors</h3>
            <div className="visitor-count-box">
              <div className="visitor-count">1,282</div>
              <div className="visitor-avatars">
                <div className="avatar-group">
                  <div className="avatar" style={{ backgroundColor: 'hsl(var(--p))', zIndex: 4 }}>Y</div>
                  <div className="avatar" style={{ backgroundColor: 'hsl(var(--a))', zIndex: 3 }}>J</div>
                  <div className="avatar" style={{ backgroundColor: 'hsl(var(--a))', zIndex: 2 }}>K</div>
                  <div className="avatar" style={{ backgroundColor: 'hsl(var(--wa))', zIndex: 1 }}>M</div>
                  <div className="avatar-more">+6</div>
                </div>
                <span className="avatar-label">Logged Visitors</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke={chartColors.text} style={{ fontSize: '10px' }} />
                <YAxis stroke={chartColors.text} style={{ fontSize: '10px' }} width={25} />
                <Bar dataKey="visits" fill="var(--accent)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <button className="more-detail-btn">More Detail <i className="fas fa-arrow-right"></i></button>
          </div>
        </div>

        {/* World Map & Bookings */}
        <div className="dashboard-row two-col-50-50">
          <div className="chart-container map-container">
            <h2>Organic Traffic in World</h2>
            <SimpleWorldMap />
            <div className="map-legend">
              {countryData.map((country) => (
                <div key={country.name} className="legend-item">
                  <span className="flag">{country.flag}</span>
                  <div className="legend-info">
                    <div className="country-name">{country.name}</div>
                    <div className="country-value">{country.value.toLocaleString()}</div>
                  </div>
                  <span className="trend">{country.trend}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h2>Bookings by Type</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bookingChartData} layout="vertical">
                <XAxis type="number" stroke={chartColors.text} style={{ fontSize: '11px' }} />
                <YAxis dataKey="type" type="category" stroke={chartColors.text} style={{ fontSize: '11px' }} width={60} />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Availability */}
        {availability && (
          <div className="availability-container">
            <h2>Availability Status</h2>
            <div className="availability-grid">
              <AvailabilityCard
                title="Flight Seats"
                available={availability?.flights?.available || 0}
                total={availability?.flights?.total || 0}
                icon="fas fa-plane"
              />
              {availability?.hotels && (
                <AvailabilityCard
                  title="Hotel Rooms"
                  available={availability?.hotels?.available || 0}
                  total={availability?.hotels?.total || 0}
                  icon="fas fa-hotel"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

const KPICard = ({ icon, label, value, color, trend }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    position: 'relative'
  }} className="kpi-card-interactive" 
  onMouseEnter={e => {
    e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0, 0, 0, 0.08)'
    e.currentTarget.style.transform = 'translateY(-3px)'
    e.currentTarget.style.borderColor = 'rgba(237, 74, 41, 0.2)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
    e.currentTarget.style.transform = 'none'
    e.currentTarget.style.borderColor = 'var(--border)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <div style={{
        width: '40px',
        height: '40px',
        background: 'rgba(237, 74, 41, 0.1)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ed4a29',
        fontSize: '16px'
      }}>
        <i className={icon}></i>
      </div>
    </div>
    <div style={{ marginBottom: '12px' }}>
      <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
    {trend && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{
          fontSize: '12px',
          color: trend.includes('+') ? '#10b981' : '#ef4444',
          fontWeight: '600',
          background: trend.includes('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {trend.split(' ')[0]}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {trend.split(' ').slice(1).join(' ')}
        </span>
      </div>
    )}
  </div>
)

const BookingCard = ({ icon, label, value, color }) => (
  <div className="booking-card">
    <div className="booking-icon-container" style={{ backgroundColor: 'rgba(237, 74, 41, 0.1)', color: '#ed4a29' }}>
      <i className={icon}></i>
    </div>
    <div className="booking-content">
      <p className="booking-label">{label}</p>
      <p className="booking-value" style={{ color: 'var(--text-primary)' }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  </div>
)

const AvailabilityCard = ({ title, available, total, icon }) => {
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0
  return (
    <div className="availability-card">
      <div className="avail-header">
        <i className={`avail-icon ${icon}`}></i>
        <h3>{title}</h3>
      </div>
      <div className="avail-bar">
        <div className="avail-progress" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="avail-stats">
        <p className="avail-text">{available} of {total} available</p>
        <p className="avail-percentage">{percentage}%</p>
      </div>
    </div>
  )
}

const SimpleWorldMap = () => (
  <svg viewBox="0 0 960 600" className="world-map">
    <defs>
      <linearGradient id="landGradient">
        <stop offset="0%" stopColor="hsl(var(--b3))" stopOpacity="0.8" />
        <stop offset="100%" stopColor="hsl(var(--b3))" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Simplified world outline */}
    <rect width="960" height="600" fill="var(--bg-body)" />

    {/* Continents as simplified shapes */}
    <g id="continents">
      {/* North America */}
      <path d="M 100,150 L 200,100 L 250,200 L 150,300 Z" fill="url(#landGradient)" stroke="var(--border)" />
      {/* South America */}
      <path d="M 200,300 L 250,250 L 280,450 L 220,480 Z" fill="url(#landGradient)" stroke="var(--border)" />
      {/* Europe */}
      <path d="M 420,100 L 520,80 L 540,200 L 430,220 Z" fill="url(#landGradient)" stroke="var(--border)" />
      {/* Africa */}
      <path d="M 480,220 L 560,200 L 600,450 L 480,480 Z" fill="url(#landGradient)" stroke="var(--border)" />
      {/* Asia */}
      <path d="M 550,80 L 750,100 L 800,250 L 600,280 L 560,200 Z" fill="url(#landGradient)" stroke="var(--border)" />
      {/* Australia */}
      <path d="M 750,400 L 820,380 L 840,480 L 760,500 Z" fill="url(#landGradient)" stroke="var(--border)" />
    </g>

    {/* Country markers */}
    {/* USA */}
    <circle cx="150" cy="180" r="6" fill="var(--accent)" opacity="0.9" />
    {/* Germany */}
    <circle cx="470" cy="140" r="6" fill="var(--accent)" opacity="0.9" />
    {/* India */}
    <circle cx="600" cy="280" r="6" fill="var(--accent)" opacity="0.9" />
    {/* Brazil */}
    <circle cx="220" cy="350" r="6" fill="var(--accent)" opacity="0.9" />
    {/* China */}
    <circle cx="700" cy="200" r="6" fill="var(--accent)" opacity="0.9" />
    {/* Australia */}
    <circle cx="790" cy="440" r="6" fill="var(--accent)" opacity="0.9" />
  </svg>
)

export default AdminDashboard
