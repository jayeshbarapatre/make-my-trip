import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminDashboardService } from '../services/adminService'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

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

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-state">Loading dashboard...</div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-state">{error}</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <button className="refresh-btn" onClick={fetchData}>🔄 Refresh</button>
        </div>

        <div className="stats-grid">
          <StatCard
            icon="💰"
            label="Total Revenue"
            value={`₹${(stats?.summary?.totalRevenue || 0).toLocaleString()}`}
            color="#10b981"
          />
          <StatCard
            icon="✈️"
            label="Available Flights"
            value={stats?.active?.activeFlights || 0}
            color="#3b82f6"
          />
          <StatCard
            icon="🏨"
            label="Total Hotels"
            value={stats?.summary?.totalHotels || 0}
            color="#06b6d4"
          />
          <StatCard
            icon="🎫"
            label="Flights Booked"
            value={stats?.bookingsBreakdown?.flight || 0}
            color="#f59e0b"
          />
          <StatCard
            icon="🛏️"
            label="Hotels Booked"
            value={stats?.bookingsBreakdown?.hotel || 0}
            color="#8b5cf6"
          />
          <StatCard
            icon="🚌"
            label="Buses Booked"
            value={stats?.bookingsBreakdown?.bus || 0}
            color="#ec4899"
          />
          <StatCard
            icon="🚕"
            label="Cabs Booked"
            value={stats?.bookingsBreakdown?.cab || 0}
            color="#f43f5e"
          />
        </div>

        <div className="dashboard-row">
          <div className="chart-container">
            <h2>Revenue Trend (Last 12 Months)</h2>
            {revenue && (
              <div className="revenue-chart">
                <div className="chart-bars">
                  {revenue.revenues.map((val, idx) => {
                    const maxVal = Math.max(...revenue.revenues)
                    const height = (val / maxVal) * 100
                    return (
                      <div key={idx} className="chart-bar-wrapper">
                        <div
                          className="chart-bar"
                          style={{ height: `${height}%` }}
                          title={`₹${val.toLocaleString()}`}
                        ></div>
                        <span className="bar-label">{revenue.labels[idx]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-row">
          <div className="availability-container">
            <h2>Flight Seat Availability</h2>
            <div className="availability-grid">
              <AvailabilityCard
                title="Flights"
                available={availability?.flights?.available || 0}
                total={availability?.flights?.total || 0}
                icon="✈️"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  </div>
)

const AvailabilityCard = ({ title, available, total, icon }) => {
  const percentage = total > 0 ? Math.round((available / total) * 100) : 0
  return (
    <div className="availability-card">
      <div className="avail-header">
        <span className="avail-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="avail-bar">
        <div className="avail-progress" style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="avail-text">{available} of {total} available</p>
      <p className="avail-percentage">{percentage}%</p>
    </div>
  )
}

export default AdminDashboard
