import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorBusesService } from '../services/vendorService'
import toast from 'react-hot-toast'
import './VendorBuses.css'

const VendorBuses = () => {
  const navigate = useNavigate()
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchBuses()
  }, [])

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const response = await vendorBusesService.getAll()
      setBuses(response.data.data.buses || [])
      setError('')
    } catch (err) {
      setError('Failed to load buses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = (id) => {
    setConfirmDialog({
      type: 'submit',
      busId: id,
      title: 'Submit for Approval',
      message: 'Submit this bus for admin review?'
    })
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      type: 'delete',
      busId: id,
      title: 'Delete Bus',
      message: 'Delete this bus? This action cannot be undone.'
    })
  }

  const confirmAction = async () => {
    if (!confirmDialog) return

    try {
      setProcessingId(confirmDialog.busId)
      if (confirmDialog.type === 'submit') {
        await vendorBusesService.submit(confirmDialog.busId)
        toast.success('Bus submitted for approval')
      } else if (confirmDialog.type === 'delete') {
        await vendorBusesService.delete(confirmDialog.busId)
        toast.success('Bus deleted successfully')
        setBuses(buses.filter(b => b.id !== confirmDialog.busId))
      }
      fetchBuses()
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
        <div className="flex items-center justify-center gap-4 py-16 text-base-content/60">
          <i className="fas fa-spinner fa-spin text-xl text-primary"></i>
          <span>Loading buses...</span>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="vendor-buses-page">
        <div className="page-header">
          <div>
            <h1>My Buses</h1>
            <div className="flex gap-6 mt-2 text-sm text-base-content/60">
              <span>📊 Total: <strong className="text-base-content">{buses.length}</strong></span>
              <span>✏️ Draft: <strong className="text-base-content">{buses.filter(b => b.listingStatus === 'DRAFT').length}</strong></span>
              <span>⏳ Pending: <strong className="text-warning">{buses.filter(b => b.listingStatus === 'PENDING_APPROVAL').length}</strong></span>
              <span>✅ Approved: <strong className="text-success">{buses.filter(b => b.listingStatus === 'APPROVED').length}</strong></span>
            </div>
          </div>
          <button className="btn btn-success" onClick={() => navigate('/vendor/buses/create')}>
            <i className="fas fa-plus"></i> Add New Bus
          </button>
        </div>

        {error && <div className="alert alert-error mb-6"><i className="fas fa-exclamation-circle"></i>{error}</div>}

        {buses.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            <p className="text-lg">No buses yet. Create your first bus listing!</p>
          </div>
        ) : (
          <div className="bus-list">
            {buses.map(bus => (
              <div key={bus.id} className="bus-card">
                <div className="bus-header">
                  <div className="bus-info">
                    <h3 className="bus-name">{bus.operator}</h3>
                    <p className="bus-route">{bus.from} → {bus.to}</p>
                  </div>
                  <div className="bus-badges">
                    <span className={`badge ${bus.type ? 'bus-type-badge' : ''}`}>{bus.type || 'AC'}</span>
                    <span className={`badge ${getStatusBadgeClass(bus.listingStatus)}`}>
                      {bus.listingStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {bus.listingStatus === 'REJECTED' && bus.rejectionReason && (
                  <div className="rejection-reason">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span><strong>Rejection Reason:</strong> {bus.rejectionReason}</span>
                  </div>
                )}

                <div className="bus-details">
                  <div className="detail-item">
                    <span className="detail-label">Departure:</span>
                    <span className="detail-value">{bus.departureTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Arrival:</span>
                    <span className="detail-value">{bus.arrivalTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{bus.durationMinutes} min</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">₹{bus.price.toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Seats:</span>
                    <span className="detail-value">{bus.seatsAvailable}</span>
                  </div>
                </div>

                <div className="bus-actions">
                  <button className="btn btn-sm btn-info" onClick={() => navigate(`/vendor/buses/${bus.id}/edit`)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  {['DRAFT', 'REJECTED'].includes(bus.listingStatus) && (
                    <button className="btn btn-sm btn-success" onClick={() => handleSubmitForApproval(bus.id)}>
                      <i className="fas fa-paper-plane"></i> Submit
                    </button>
                  )}
                  {['DRAFT', 'REJECTED'].includes(bus.listingStatus) && (
                    <button className="btn btn-sm btn-error" onClick={() => handleDelete(bus.id)}>
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
                  {confirmDialog.type === 'delete' ? 'This action is permanent' : 'This will send your bus for admin review'}
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
                {processingId === confirmDialog.busId && (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>
                  {processingId === confirmDialog.busId
                    ? (confirmDialog.type === 'delete' ? 'Deleting...' : 'Submitting...')
                    : (confirmDialog.type === 'delete' ? 'Delete Bus' : 'Submit Bus')}
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

export default VendorBuses
