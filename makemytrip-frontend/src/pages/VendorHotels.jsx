import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService } from '../services/vendorService'
import toast from 'react-hot-toast'
import './VendorHotels.css'

const VendorHotels = () => {
  const navigate = useNavigate()
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
      setError('Failed to load hotels')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = async (id) => {
    if (!window.confirm('Submit this hotel for admin review?')) return

    try {
      await vendorHotelsService.submit(id)
      toast.success('Hotel submitted for approval')
      fetchHotels()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit hotel')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hotel? This action cannot be undone.')) return

    try {
      await vendorHotelsService.delete(id)
      toast.success('Hotel deleted successfully')
      setHotels(hotels.filter(h => h.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete hotel')
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'badge-secondary'
      case 'PENDING_APPROVAL':
        return 'badge-warning'
      case 'APPROVED':
        return 'badge-success'
      case 'REJECTED':
        return 'badge-error'
      default:
        return 'badge-secondary'
    }
  }

  if (loading) {
    return (
      <VendorLayout>
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i> Loading hotels...
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="vendor-hotels-page">
        <div className="page-header">
          <div>
            <h1>My Hotels</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>📊 Total: <strong style={{ color: 'hsl(var(--bc))' }}>{hotels.length}</strong></span>
              <span>✏️ Draft: <strong style={{ color: 'hsl(var(--bc))' }}>{hotels.filter(h => h.listingStatus === 'DRAFT').length}</strong></span>
              <span>⏳ Pending: <strong style={{ color: 'hsl(var(--wa))' }}>{hotels.filter(h => h.listingStatus === 'PENDING_APPROVAL').length}</strong></span>
              <span>✅ Approved: <strong style={{ color: 'hsl(var(--su))' }}>{hotels.filter(h => h.listingStatus === 'APPROVED').length}</strong></span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/vendor/hotels/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-plus"></i> Add New Hotel
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {hotels.length === 0 ? (
          <div className="empty-state">
            <p>No hotels yet. Create your first hotel listing!</p>
          </div>
        ) : (
          <div className="hotels-list">
            {hotels.map(hotel => (
              <div key={hotel.id} className="hotel-card">
                <div className="hotel-header">
                  <div className="hotel-info">
                    <h3 className="hotel-name">{hotel.name}</h3>
                    <p className="hotel-city">{hotel.city}</p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(hotel.listingStatus)}`}>
                    {hotel.listingStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {hotel.listingStatus === 'REJECTED' && hotel.rejectionReason && (
                  <div className="rejection-reason">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span><strong>Rejection Reason:</strong> {hotel.rejectionReason}</span>
                  </div>
                )}

                <div className="hotel-details">
                  <div className="detail-item">
                    <span className="detail-label">Price/Night:</span>
                    <span className="detail-value">₹{hotel.pricePerNight.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Rooms:</span>
                    <span className="detail-value">{hotel.rooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rating:</span>
                    <span className="detail-value">⭐ {hotel.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="hotel-actions">
                  <button className="btn-sm btn-edit" onClick={() => navigate(`/vendor/hotels/${hotel.id}/edit`)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="btn-sm btn-rooms" onClick={() => navigate(`/vendor/hotels/${hotel.id}/rooms`)}>
                    <i className="fas fa-door-open"></i> Rooms
                  </button>
                  {['DRAFT', 'REJECTED'].includes(hotel.listingStatus) && (
                    <button className="btn-sm btn-submit" onClick={() => handleSubmitForApproval(hotel.id)}>
                      <i className="fas fa-paper-plane"></i> Submit for Approval
                    </button>
                  )}
                  {['DRAFT', 'REJECTED'].includes(hotel.listingStatus) && (
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(hotel.id)}>
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </VendorLayout>
  )
}

export default VendorHotels
