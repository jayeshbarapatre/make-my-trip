import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import {
  RiCheckboxCircleLine, RiCloseCircleLine, RiHotelLine,
  RiTimeLine, RiUserLine, RiCalendarLine
} from 'react-icons/ri'

const AdminApprovals = () => {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { fetchPendingHotels() }, [])

  const fetchPendingHotels = async () => {
    try {
      setLoading(true)
      const res = await adminService.getPendingHotels()
      setHotels(res.data.data.hotels || [])
    } catch {
      toast.error('Failed to load pending hotels')
    } finally {
      setLoading(false)
    }
  }

  const confirmApprove = async () => {
    if (!approvingId) return
    try {
      setProcessing(true)
      await adminService.approveHotel(approvingId)
      toast.success('Hotel approved successfully')
      setHotels(hotels.filter(h => h.id !== approvingId))
      setApprovingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve hotel')
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
      await adminService.rejectHotel(rejectingId, { reason: rejectReason })
      toast.success('Hotel rejected')
      setHotels(hotels.filter(h => h.id !== rejectingId))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject hotel')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Hotel Approvals</h2>
            <p className="text-sm text-base-content/50 mt-0.5">Review and approve vendor hotel submissions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-warning badge-lg gap-1.5">
              <RiTimeLine className="w-3.5 h-3.5" />
              {hotels.length} pending
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading pending approvals...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiCheckboxCircleLine className="w-14 h-14 text-success/40 mb-3" />
              <p className="font-semibold text-base-content">All caught up!</p>
              <p className="text-sm text-base-content/50 mt-1">No pending hotel approvals</p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>Hotel</th>
                    <th>City</th>
                    <th>Vendor</th>
                    <th>Submitted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.map(hotel => (
                    <tr key={hotel.id} className="hover:bg-base-200/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <RiHotelLine className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold text-sm text-base-content">{hotel.name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-base-content/60">{hotel.city}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder">
                            <div className="w-6 rounded-full bg-base-300 text-base-content text-[10px] font-bold">
                              <span>{hotel.vendor?.name?.charAt(0) || '?'}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-base-content">{hotel.vendor?.name || 'N/A'}</p>
                            <p className="text-[11px] text-base-content/50">{hotel.vendor?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-base-content/50">
                        {hotel.submittedAt ? new Date(hotel.submittedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn btn-success btn-xs gap-1"
                            onClick={() => setApprovingId(hotel.id)}
                            disabled={processing}
                          >
                            <RiCheckboxCircleLine className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            className="btn btn-error btn-xs gap-1"
                            onClick={() => setRejectingId(hotel.id)}
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
              <h3 className="font-bold text-lg text-base-content">Approve Hotel?</h3>
              <p className="text-sm text-base-content/60 mt-2">
                This hotel will be published and visible to customers immediately.
              </p>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setApprovingId(null)} disabled={processing}>
                Cancel
              </button>
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
                <h3 className="font-bold text-base-content">Reject Hotel Listing</h3>
                <p className="text-xs text-base-content/50 mt-0.5">Provide feedback to the vendor</p>
              </div>
            </div>
            <label className="form-control">
              <div className="label py-1">
                <span className="label-text text-sm font-medium">Rejection reason *</span>
              </div>
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
              >
                Cancel
              </button>
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

export default AdminApprovals
