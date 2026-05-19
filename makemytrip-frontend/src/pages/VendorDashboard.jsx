import { useState, useEffect } from 'react'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService } from '../services/vendorService'
import './VendorDashboard.css'

const VendorDashboard = () => {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHotels()
  }, [])

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

  const getStatusStats = () => {
    const stats = {
      total: hotels.length,
      draft: hotels.filter(h => h.listingStatus === 'DRAFT').length,
      pending: hotels.filter(h => h.listingStatus === 'PENDING_APPROVAL').length,
      approved: hotels.filter(h => h.listingStatus === 'APPROVED').length,
      rejected: hotels.filter(h => h.listingStatus === 'REJECTED').length
    }
    return stats
  }

  const stats = getStatusStats()

  const StatCard = ({ title, count, icon, color }) => (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="stat-content">
        <div className="stat-value">{count}</div>
        <div className="stat-label">{title}</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <VendorLayout>
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i> Loading dashboard...
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="vendor-dashboard">
        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-header">
          <h1>Welcome Back! 👋</h1>
          <p>Here's your hotel inventory overview</p>
        </div>

        <div className="stats-grid">
          <StatCard title="Total Hotels" count={stats.total} icon="fa-hotel" color="primary" />
          <StatCard title="Draft" count={stats.draft} icon="fa-file" color="secondary" />
          <StatCard title="Pending Review" count={stats.pending} icon="fa-hourglass-half" color="warning" />
          <StatCard title="Approved" count={stats.approved} icon="fa-check-circle" color="success" />
          <StatCard title="Rejected" count={stats.rejected} icon="fa-times-circle" color="error" />
        </div>

        <div className="dashboard-section">
          <h2>Recent Hotels</h2>
          {hotels.length === 0 ? (
            <div className="empty-state">
              <p>No hotels yet. Create your first hotel to get started!</p>
            </div>
          ) : (
            <div className="hotels-preview">
              {hotels.slice(0, 5).map(hotel => (
                <div key={hotel.id} className="hotel-preview-card">
                  <div className="hotel-name">{hotel.name}</div>
                  <div className="hotel-city">{hotel.city}</div>
                  <div className={`status-badge status-${hotel.listingStatus.toLowerCase()}`}>
                    {hotel.listingStatus.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  )
}

export default VendorDashboard
