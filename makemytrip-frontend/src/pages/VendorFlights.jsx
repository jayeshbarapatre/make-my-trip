import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorFlightsService } from '../services/vendorService'
import toast from 'react-hot-toast'
import './VendorFlights.css'

const VendorFlights = () => {
  const navigate = useNavigate()
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchFlights()
  }, [])

  const fetchFlights = async () => {
    try {
      setLoading(true)
      const response = await vendorFlightsService.getAll()
      setFlights(response.data.data.flights || [])
      setError('')
    } catch (err) {
      setError('Failed to load flights')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = (id) => {
    setConfirmDialog({
      type: 'submit',
      flightId: id,
      title: 'Submit for Approval',
      message: 'Submit this flight for admin review?'
    })
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      type: 'delete',
      flightId: id,
      title: 'Delete Flight',
      message: 'Delete this flight? This action cannot be undone.'
    })
  }

  const confirmAction = async () => {
    if (!confirmDialog) return

    try {
      setProcessingId(confirmDialog.flightId)
      if (confirmDialog.type === 'submit') {
        await vendorFlightsService.submit(confirmDialog.flightId)
        toast.success('Flight submitted for approval')
      } else if (confirmDialog.type === 'delete') {
        await vendorFlightsService.delete(confirmDialog.flightId)
        toast.success('Flight deleted successfully')
        setFlights(flights.filter(f => f.id !== confirmDialog.flightId))
      }
      fetchFlights()
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
          <i className="fas fa-spinner fa-spin"></i> Loading flights...
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="vendor-flights-page">
        <div className="page-header">
          <div>
            <h1>My Flights</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>📊 Total: <strong style={{ color: 'hsl(var(--bc))' }}>{flights.length}</strong></span>
              <span>✏️ Draft: <strong style={{ color: 'hsl(var(--bc))' }}>{flights.filter(f => f.listingStatus === 'DRAFT').length}</strong></span>
              <span>⏳ Pending: <strong style={{ color: 'hsl(var(--wa))' }}>{flights.filter(f => f.listingStatus === 'PENDING_APPROVAL').length}</strong></span>
              <span>✅ Approved: <strong style={{ color: 'hsl(var(--su))' }}>{flights.filter(f => f.listingStatus === 'APPROVED').length}</strong></span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/vendor/flights/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-plus"></i> Add New Flight
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {flights.length === 0 ? (
          <div className="empty-state">
            <p>No flights yet. Create your first flight listing!</p>
          </div>
        ) : (
          <div className="flights-list">
            {flights.map(flight => (
              <div key={flight.id} className="flight-card">
                <div className="flight-header">
                  <div className="flight-info">
                    <h3 className="flight-name">{flight.airline} - {flight.flightNumber}</h3>
                    <p className="flight-route">{flight.from} → {flight.to}</p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(flight.listingStatus)}`}>
                    {flight.listingStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                {flight.listingStatus === 'REJECTED' && flight.rejectionReason && (
                  <div className="rejection-reason">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span><strong>Rejection Reason:</strong> {flight.rejectionReason}</span>
                  </div>
                )}

                <div className="flight-details">
                  <div className="detail-item">
                    <span className="detail-label">Departure:</span>
                    <span className="detail-value">{flight.departureTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Arrival:</span>
                    <span className="detail-value">{flight.arrivalTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{flight.durationMinutes} min</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">₹{flight.price.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Seats:</span>
                    <span className="detail-value">{flight.seatsAvailable}</span>
                  </div>
                </div>

                <div className="flight-actions">
                  <button className="btn-sm btn-edit" onClick={() => navigate(`/vendor/flights/${flight.id}/edit`)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  {['DRAFT', 'REJECTED'].includes(flight.listingStatus) && (
                    <button className="btn-sm btn-submit" onClick={() => handleSubmitForApproval(flight.id)}>
                      <i className="fas fa-paper-plane"></i> Submit for Approval
                    </button>
                  )}
                  {['DRAFT', 'REJECTED'].includes(flight.listingStatus) && (
                    <button className="btn-sm btn-delete" onClick={() => handleDelete(flight.id)}>
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
                  {confirmDialog.type === 'delete' ? 'This action is permanent' : 'This will send your flight for admin review'}
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
                {processingId === confirmDialog.flightId && (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>
                  {processingId === confirmDialog.flightId
                    ? (confirmDialog.type === 'delete' ? 'Deleting...' : 'Submitting...')
                    : (confirmDialog.type === 'delete' ? 'Delete Flight' : 'Submit Flight')}
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

export default VendorFlights
