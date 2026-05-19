import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import './AdminFlights.css'

const AdminFlightApprovals = () => {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [approvingId, setApprovingId] = useState(null)

  useEffect(() => {
    fetchPendingFlights()
  }, [])

  const fetchPendingFlights = async () => {
    try {
      setLoading(true)
      const response = await adminService.getPendingFlights()
      setFlights(response.data.data.flights || [])
    } catch (err) {
      toast.error('Failed to load pending flights')
      console.error(err)
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

  const handleReject = async (flightId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      await adminService.rejectFlight(flightId, { reason: rejectReason })
      toast.success('Flight rejected successfully')
      setFlights(flights.filter(f => f.id !== flightId))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject flight')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16 text-base-content/60">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-3"></i>
          <p>Loading pending approvals...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-flights-page">
        <div className="page-header">
          <div>
            <h1>Flight Approvals</h1>
            <p className="subtitle">Pending vendor flight listings</p>
          </div>
        </div>

        {flights.length === 0 ? (
          <div className="text-center py-16 text-base-content/60">
            <p>No pending flight approvals</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Airline</th>
                  <th>Flight Number</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Price</th>
                  <th>Seats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flights.map(flight => (
                  <tr key={flight.id}>
                    <td>
                      <strong>{flight.airline}</strong>
                    </td>
                    <td>{flight.flightNumber}</td>
                    <td>{flight.from} → {flight.to}</td>
                    <td>{flight.departureTime}</td>
                    <td>₹{flight.price.toLocaleString()}</td>
                    <td>{flight.seatsAvailable}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => setApprovingId(flight.id)}
                          disabled={processing}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          onClick={() => setRejectingId(flight.id)}
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
                    Approve Flight Listing
                  </h3>
                  <p className="text-base-content/70 text-sm mt-1">
                    Flight will be visible to customers
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg mb-6 bg-success/5 border border-success/20">
                <p className="text-base-content">
                  Are you sure you want to approve this flight listing? It will be immediately published on the platform.
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
                    Reject Flight Listing
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

export default AdminFlightApprovals
