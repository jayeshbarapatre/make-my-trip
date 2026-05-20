import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import { RiPlaneLine, RiCheckboxCircleLine, RiCloseCircleLine, RiTimeLine } from 'react-icons/ri'

const AdminFlightApprovals = () => {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { fetchPendingFlights() }, [])

  const fetchPendingFlights = async () => {
    try {
      setLoading(true)
      const res = await adminService.getPendingFlights()
      setFlights(res.data.data.flights || [])
    } catch {
      toast.error('Failed to load pending flights')
    } finally {
      setLoading(false)
    }
  }

  const confirmApprove = async () => {
    if (!approvingId) return
    try {
      setProcessing(true)
      await adminService.approveFlight(approvingId)
      toast.success('Flight approved successfully')
      setFlights(flights.filter(f => f.id !== approvingId))
      setApprovingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve flight')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      setProcessing(true)
      await adminService.rejectFlight(rejectingId, { reason: rejectReason })
      toast.success('Flight rejected')
      setFlights(flights.filter(f => f.id !== rejectingId))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject flight')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Flight Approvals</h2>
            <p className="text-sm text-base-content/50 mt-0.5">Review and approve vendor flight submissions</p>
          </div>
          <span className="badge badge-warning badge-lg gap-1.5">
            <RiTimeLine className="w-3.5 h-3.5" />
            {flights.length} pending
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading pending approvals...</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiCheckboxCircleLine className="w-14 h-14 text-success/40 mb-3" />
              <p className="font-semibold text-base-content">All caught up!</p>
              <p className="text-sm text-base-content/50 mt-1">No pending flight approvals</p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>Flight</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Price</th>
                    <th>Seats</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map(flight => (
                    <tr key={flight.id} className="hover:bg-base-200/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                            <RiPlaneLine className="w-4 h-4 text-info" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-base-content">{flight.airline}</p>
                            <p className="text-[11px] text-base-content/50">{flight.flightNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-base-content/70">{flight.from} → {flight.to}</td>
                      <td className="text-xs text-base-content/60">{flight.departureTime}</td>
                      <td className="font-semibold text-sm text-base-content">₹{flight.price?.toLocaleString()}</td>
                      <td className="text-sm text-base-content/60">{flight.seatsAvailable}</td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn btn-success btn-xs gap-1"
                            onClick={() => setApprovingId(flight.id)}
                            disabled={processing}
                          >
                            <RiCheckboxCircleLine className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            className="btn btn-error btn-xs gap-1"
                            onClick={() => setRejectingId(flight.id)}
                            disabled={processing}
                          >
                            <RiCloseCircleLine className="w-3.5 h-3.5" />
                            Reject
                          </button>
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

      {/* Approve Modal */}
      {approvingId && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <RiCheckboxCircleLine className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-bold text-lg text-base-content">Approve Flight?</h3>
              <p className="text-sm text-base-content/60 mt-2">
                This flight will be published and visible to customers immediately.
              </p>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setApprovingId(null)} disabled={processing}>Cancel</button>
              <button className="btn btn-success btn-sm gap-2" onClick={confirmApprove} disabled={processing}>
                {processing && <span className="loading loading-spinner loading-xs" />}
                Approve
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !processing && setApprovingId(null)} />
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <RiCloseCircleLine className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-base-content">Reject Flight Listing</h3>
                <p className="text-xs text-base-content/50 mt-0.5">Provide feedback to the vendor</p>
              </div>
            </div>
            <label className="form-control">
              <div className="label py-1"><span className="label-text text-sm font-medium">Rejection reason *</span></div>
              <textarea
                className="textarea textarea-bordered w-full text-sm"
                rows={4}
                placeholder="Explain why this listing doesn't meet requirements..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                disabled={processing}
              />
            </label>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setRejectingId(null); setRejectReason('') }}
                disabled={processing}
              >Cancel</button>
              <button
                className="btn btn-error btn-sm gap-2"
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
              >
                {processing && <span className="loading loading-spinner loading-xs" />}
                Reject
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !processing && (setRejectingId(null), setRejectReason(''))} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminFlightApprovals
