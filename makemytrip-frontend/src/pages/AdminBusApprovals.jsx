import { useState, useEffect } from 'react'
import { formatApiDate } from '../utils/date'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import './AdminFlights.css'

const AdminBusApprovals = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [approvingId, setApprovingId] = useState(null)

  const fetchPendingBuses = async () => {
    try {
      setLoading(true)
      const response = await adminService.getPendingBuses()
      setBuses(response.data.data.buses || [])
    } catch (err) {
      toast.error('Failed to load pending buses')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingBuses()
  }, [])

  const confirmApprove = async () => {
    if (!approvingId) return

    try {
      setProcessing(true)
      await adminService.approveBus(approvingId)
      toast.success('Bus approved successfully')
      setBuses(buses.filter(b => b.id !== approvingId))
      setApprovingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve bus')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (busId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      await adminService.rejectBus(busId, { reason: rejectReason })
      toast.success('Bus rejected successfully')
      setBuses(buses.filter(b => b.id !== busId))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject bus')
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
            <h1>Bus Approvals</h1>
            <p className="subtitle">Pending vendor bus listings</p>
          </div>
        </div>

        {buses.length === 0 ? (
          <div className="empty-approval-state">
            <div className="animated-icon bus-animation">
              <i className="fas fa-bus"></i>
            </div>
            <h3>All Caught Up!</h3>
            <p>No pending bus approvals at the moment.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bus Operator</th>
                  <th>Route</th>
                  <th>Vendor Name</th>
                  <th>Price</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map(bus => (
                  <tr key={bus.id}>
                    <td className="font-bold">
                      {bus.operatorName}
                      <div className="text-sm text-base-content/60">{bus.busNumber}</div>
                    </td>
                    <td>{(bus.from ?? bus.departure?.city ?? '—')} → {(bus.to ?? bus.arrival?.city ?? '—')}</td>
                    <td>
                      <div>{bus.vendor?.vendorName || bus.vendor?.name}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>{bus.vendor?.email}</div>
                    </td>
                    <td>₹{bus.price}</td>
                    <td>{formatApiDate(bus.submittedAt || bus.createdAt)}</td>
                    <td>
                      {rejectingId === bus.id ? (
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            disabled={processing}
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-sm btn-error"
                              onClick={() => handleReject(bus.id)}
                              disabled={processing}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => { setRejectingId(null); setRejectReason('') }}
                              disabled={processing}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => setApprovingId(bus.id)}
                            disabled={processing}
                          >
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => setRejectingId(bus.id)}
                            disabled={processing}
                          >
                            <i className="fas fa-times"></i> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {approvingId && (
          <div className="modal-overlay" onClick={() => !processing && setApprovingId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3>Approve Bus</h3>
                <button className="close-btn" onClick={() => !processing && setApprovingId(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p>Are you sure you want to approve this bus listing? It will become visible to customers immediately.</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setApprovingId(null)} disabled={processing}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={confirmApprove} disabled={processing}>
                    {processing ? 'Approving...' : 'Yes, Approve Bus'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminBusApprovals
