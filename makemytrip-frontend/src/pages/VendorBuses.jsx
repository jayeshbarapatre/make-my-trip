import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorBusesService } from '../services/vendorService'
import toast from 'react-hot-toast'
import { RiBusLine, RiAddLine, RiEditLine, RiDeleteBinLine, RiSendPlaneLine } from 'react-icons/ri'

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

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">My Buses</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-base-content/50">
              <span>Total: <strong className="text-base-content">{buses.length}</strong></span>
              <span>Pending: <strong className="text-warning">{buses.filter(b => b.listingStatus === 'PENDING_APPROVAL').length}</strong></span>
              <span>Approved: <strong className="text-success">{buses.filter(b => b.listingStatus === 'APPROVED').length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm gap-2 w-fit" onClick={() => navigate('/vendor/buses/create')}>
            <RiAddLine className="w-4 h-4" /> Add Bus
          </button>
        </div>

        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading buses...</p>
          </div>
        ) : buses.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiBusLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No buses yet</p>
              <button className="btn btn-primary btn-sm gap-2 mt-4" onClick={() => navigate('/vendor/buses/create')}>
                <RiAddLine className="w-4 h-4" /> Add First Bus
              </button>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>Bus</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Price</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map(bus => (
                    <tr key={bus.id} className="hover:bg-base-200/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                            <RiBusLine className="w-4 h-4 text-warning" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-base-content">{bus.operator}</p>
                            <p className="text-[11px] text-base-content/50">{bus.type || 'AC'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-base-content/70">{bus.from} → {bus.to}</td>
                      <td className="text-xs text-base-content/60">{bus.departureTime}</td>
                      <td className="font-semibold text-sm text-base-content">₹{bus.price?.toLocaleString()}</td>
                      <td className="text-sm text-base-content/60">{bus.seatsAvailable}</td>
                      <td>
                        <span className={`badge badge-sm ${getStatusBadgeClass(bus.listingStatus)}`}>
                          {bus.listingStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn btn-ghost btn-xs gap-1" onClick={() => navigate(`/vendor/buses/${bus.id}/edit`)}>
                            <RiEditLine className="w-3.5 h-3.5" /> Edit
                          </button>
                          {['DRAFT', 'REJECTED'].includes(bus.listingStatus) && (
                            <>
                              <button className="btn btn-success btn-xs gap-1" onClick={() => handleSubmitForApproval(bus.id)}>
                                <RiSendPlaneLine className="w-3.5 h-3.5" /> Submit
                              </button>
                              <button className="btn btn-ghost btn-xs text-error hover:bg-error/10" onClick={() => handleDelete(bus.id)}>
                                <RiDeleteBinLine className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
