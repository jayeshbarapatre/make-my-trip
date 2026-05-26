import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import './AdminFlights.css'

const AdminTrainApprovals = () => {
  const [trains, setTraines] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [approvingId, setApprovingId] = useState(null)

  useEffect(() => {
    fetchPendingTraines()
  }, [])

  const fetchPendingTraines = async () => {
    try {
      setLoading(true)
      const response = await adminService.getPendingTrains()
      setTraines(response.data.data.traines || response.data.data.trains || [])
    } catch (err) {
      toast.error('Failed to load pending trains')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const confirmApprove = async () => {
    if (!approvingId) return

    try {
      setProcessing(true)
      await adminService.approveTrain(approvingId)
      toast.success('Train approved successfully')
      setTraines(trains.filter(b => b.id !== approvingId))
      setApprovingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve train')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (trainId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      await adminService.rejectTrain(trainId, { reason: rejectReason })
      toast.success('Train rejected successfully')
      setTraines(trains.filter(b => b.id !== trainId))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject train')
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
            <h1>Train Approvals</h1>
            <p className="subtitle">Pending vendor train listings</p>
          </div>
        </div>

        {trains.length === 0 ? (
          <div className="empty-approval-state">
            <div className="animated-icon train-animation">
              <i className="fas fa-train"></i>
            </div>
            <h3>All Caught Up!</h3>
            <p>No pending train approvals at the moment.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Train Operator</th>
                  <th>Route</th>
                  <th>Vendor Name</th>
                  <th>Price</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trains.map(train => (
                  <tr key={train.id}>
                    <td className="font-bold">
                      {train.operatorName}
                      <div className="text-sm text-gray-500">{train.trainNumber}</div>
                    </td>
                    <td>{train.departure?.city} → {train.arrival?.city}</td>
                    <td>
                      <div>{train.vendor?.vendorName || train.vendor?.name}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>{train.vendor?.email}</div>
                    </td>
                    <td>₹{train.price}</td>
                    <td>{new Date(train.submittedAt || train.createdAt).toLocaleDateString()}</td>
                    <td>
                      {rejectingId === train.id ? (
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
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--error)' }}
                              onClick={() => handleReject(train.id)}
                              disabled={processing}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
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
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--success)', border: 'none' }}
                            onClick={() => setApprovingId(train.id)}
                            disabled={processing}
                          >
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--error)', borderColor: 'var(--error)' }}
                            onClick={() => setRejectingId(train.id)}
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
                <h3>Approve Train</h3>
                <button className="close-btn" onClick={() => !processing && setApprovingId(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p>Are you sure you want to approve this train listing? It will become visible to customers immediately.</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setApprovingId(null)} disabled={processing}>
                    Cancel
                  </button>
                  <button className="btn-primary" style={{ background: 'var(--success)', border: 'none' }} onClick={confirmApprove} disabled={processing}>
                    {processing ? 'Approving...' : 'Yes, Approve Train'}
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

export default AdminTrainApprovals
