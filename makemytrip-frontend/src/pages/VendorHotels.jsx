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
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [processingId, setProcessingId] = useState(null)

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

  const handleSubmitForApproval = (id) => {
    setConfirmDialog({
      type: 'submit',
      hotelId: id,
      title: 'Submit for Approval',
      message: 'Submit this hotel for admin review?'
    })
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      type: 'delete',
      hotelId: id,
      title: 'Delete Hotel',
      message: 'Delete this hotel? This action cannot be undone.'
    })
  }

  const confirmAction = async () => {
    if (!confirmDialog) return

    try {
      setProcessingId(confirmDialog.hotelId)
      if (confirmDialog.type === 'submit') {
        await vendorHotelsService.submit(confirmDialog.hotelId)
        toast.success('Hotel submitted for approval')
      } else if (confirmDialog.type === 'delete') {
        await vendorHotelsService.delete(confirmDialog.hotelId)
        toast.success('Hotel deleted successfully')
        setHotels(hotels.filter(h => h.id !== confirmDialog.hotelId))
      }
      fetchHotels()
      setConfirmDialog(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setProcessingId(null)
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

      {confirmDialog && (
        <div className="modal modal-open">
          <div className="modal-box shadow-2xl">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 hover:bg-base-300"
              onClick={() => !processingId && setConfirmDialog(null)}
              disabled={processingId !== null}
            >
              ✕
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-full ${confirmDialog.type === 'delete' ? 'bg-error/10' : 'bg-success/10'}`}>
                {confirmDialog.type === 'delete' ? (
                  <i className="fas fa-exclamation-triangle text-error text-2xl"></i>
                ) : (
                  <i className="fas fa-paper-plane text-success text-2xl"></i>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-xl ${confirmDialog.type === 'delete' ? 'text-error' : 'text-success'}`}>
                  {confirmDialog.title}
                </h3>
                <p className="text-base-content/70 text-sm mt-1">
                  {confirmDialog.type === 'delete' ? 'This action is permanent' : 'This will send your hotel for admin review'}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg mb-6 ${confirmDialog.type === 'delete' ? 'bg-error/5 border border-error/20' : 'bg-success/5 border border-success/20'}`}>
              <p className="text-base-content">
                {confirmDialog.message}
              </p>
            </div>

            <div className="modal-action pt-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setConfirmDialog(null)}
                disabled={processingId !== null}
              >
                Cancel
              </button>
              <button
                className={`btn btn-sm gap-2 ${confirmDialog.type === 'delete' ? 'btn-error' : 'btn-success'}`}
                onClick={confirmAction}
                disabled={processingId !== null}
              >
                {processingId === confirmDialog.hotelId && (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>
                  {processingId === confirmDialog.hotelId
                    ? (confirmDialog.type === 'delete' ? 'Deleting...' : 'Submitting...')
                    : (confirmDialog.type === 'delete' ? 'Delete Hotel' : 'Submit Hotel')}
                </span>
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => !processingId && setConfirmDialog(null)}>
            <button disabled={processingId !== null} />
          </form>
        </div>
      )}
    </VendorLayout>
  )
}

export default VendorHotels
