import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import './AdminFlights.css'

const AdminApprovals = () => {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [approvingId, setApprovingId] = useState(null)

  useEffect(() => {
    fetchPendingHotels()
  }, [])

  const fetchPendingHotels = async () => {
    try {
      setLoading(true)
      const response = await adminService.getPendingHotels()
      setHotels(response.data.data.hotels || [])
    } catch (err) {
      toast.error('Failed to load pending hotels')
      console.error(err)
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

  const handleReject = async (hotelId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      await adminService.rejectHotel(hotelId, { reason: rejectReason })
      toast.success('Hotel rejected successfully')
      setHotels(hotels.filter(h => h.id !== hotelId))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject hotel')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: 'hsl(var(--p))' }}></i>
          <p style={{ marginTop: '12px', color: 'hsl(var(--bc) / 0.6)' }}>Loading pending approvals...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-flights-page">
        <div className="page-header">
          <div>
            <h1>Hotel Approvals</h1>
            <p className="subtitle">Pending vendor hotel listings</p>
          </div>
        </div>

        {hotels.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'hsl(var(--bc) / 0.6))' }}>
            <p style={{ margin: 0 }}>No pending hotel approvals</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>City</th>
                  <th>Vendor Name</th>
                  <th>Vendor Email</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map(hotel => (
                  <tr key={hotel.id}>
                    <td>
                      <strong>{hotel.name}</strong>
                    </td>
                    <td>{hotel.city}</td>
                    <td>{hotel.vendor?.name || 'N/A'}</td>
                    <td>{hotel.vendor?.email || 'N/A'}</td>
                    <td>{hotel.submittedAt ? new Date(hotel.submittedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-sm btn-success"
                          onClick={() => setApprovingId(hotel.id)}
                          disabled={processing}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button
                          className="btn-sm btn-error"
                          onClick={() => setRejectingId(hotel.id)}
                          disabled={processing}
                        >
                          <i className="fas fa-times"></i> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {approvingId && (
          <div className="modal modal-open">
            <div className="modal-box shadow-2xl">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 hover:bg-base-300"
                onClick={() => !processing && setApprovingId(null)}
                disabled={processing}
              >
                ✕
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-full bg-success/10">
                  <i className="fas fa-check-circle text-success text-2xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-success">
                    Approve Hotel Listing
                  </h3>
                  <p className="text-base-content/70 text-sm mt-1">
                    Hotel will be visible to customers
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg mb-6 bg-success/5 border border-success/20">
                <p className="text-base-content">
                  Are you sure you want to approve this hotel listing? It will be immediately published on the platform.
                </p>
              </div>

              <div className="modal-action pt-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setApprovingId(null)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success btn-sm gap-2"
                  onClick={confirmApprove}
                  disabled={processing}
                >
                  {processing && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  <span>
                    {processing ? 'Approving...' : 'Approve'}
                  </span>
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={() => !processing && setApprovingId(null)}>
              <button disabled={processing} />
            </form>
          </div>
        )}

        {rejectingId && (
          <div className="modal modal-open">
            <div className="modal-box shadow-2xl max-w-md">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 hover:bg-base-300"
                onClick={() => !processing && setRejectingId(null)}
                disabled={processing}
              >
                ✕
              </button>

              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-full bg-error/10">
                  <i className="fas fa-times-circle text-error text-2xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-error">
                    Reject Hotel Listing
                  </h3>
                  <p className="text-base-content/70 text-sm mt-1">
                    Provide feedback to the vendor
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-base-content/80">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this listing doesn't meet requirements..."
                  rows="4"
                  className="textarea textarea-bordered w-full"
                  disabled={processing}
                />
              </div>

              <div className="modal-action pt-2">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setRejectingId(null)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error btn-sm gap-2"
                  onClick={() => handleReject(rejectingId)}
                  disabled={processing || !rejectReason.trim()}
                >
                  {processing && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  <span>
                    {processing ? 'Rejecting...' : 'Reject'}
                  </span>
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={() => !processing && setRejectingId(null)}>
              <button disabled={processing} />
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminApprovals
