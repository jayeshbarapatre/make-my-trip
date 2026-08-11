import { useState, useEffect } from 'react'
import { formatApiDate } from '../utils/date'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import './AdminFlights.css'

const AdminCabApprovals = () => {
  const [cabs, setCabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [approvingId, setApprovingId] = useState(null)

  const fetchPendingCabs = async () => {
    try {
      setLoading(true)
      const response = await adminService.getPendingCabs()
      setCabs(response.data.data.cabs || [])
    } catch (err) {
      toast.error('Failed to load pending cabs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingCabs()
  }, [])

  const confirmApprove = async () => {
    if (!approvingId) return

    try {
      setProcessing(true)
      await adminService.approveCab(approvingId)
      toast.success('Cab approved successfully')
      setCabs(cabs.filter(c => c.id !== approvingId))
      setApprovingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve cab')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (cabId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      await adminService.rejectCab(cabId, { reason: rejectReason })
      toast.success('Cab rejected successfully')
      setCabs(cabs.filter(c => c.id !== cabId))
      setRejectingId(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject cab')
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
            <h1>Cab Approvals</h1>
            <p className="subtitle">Pending vendor cab listings</p>
          </div>
        </div>

        {cabs.length === 0 ? (
          <div className="empty-approval-state">
            <div className="animated-icon cab-animation">
              <i className="fas fa-taxi"></i>
            </div>
            <h3>All Caught Up!</h3>
            <p>No pending cab approvals at the moment.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cab Operator</th>
                  <th>Type & Base City</th>
                  <th>Vendor Name</th>
                  <th>Base Fare</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cabs.map(cab => (
                  <tr key={cab.id}>
                    <td className="font-bold">
                      {cab.operatorName}
                      <div className="text-sm text-base-content/60">{cab.cabNumber}</div>
                    </td>
                    <td>
                      <div>{cab.type}</div>
                      <div className="text-sm text-base-content/60">{cab.currentCity || 'N/A'}</div>
                    </td>
                    <td>
                      <div>{cab.vendor?.vendorName || cab.vendor?.name}</div>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--bc) / 0.6)' }}>{cab.vendor?.email}</div>
                    </td>
                    <td>₹{cab.baseFare}</td>
                    <td>{formatApiDate(cab.submittedAt || cab.createdAt)}</td>
                    <td>
                      {rejectingId === cab.id ? (
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
                              onClick={() => handleReject(cab.id)}
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
                            onClick={() => setApprovingId(cab.id)}
                            disabled={processing}
                          >
                            <i className="fas fa-check"></i> Approve
                          </button>
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => setRejectingId(cab.id)}
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
                <h3>Approve Cab</h3>
                <button className="close-btn" onClick={() => !processing && setApprovingId(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p>Are you sure you want to approve this cab listing? It will become visible to customers immediately.</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setApprovingId(null)} disabled={processing}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={confirmApprove} disabled={processing}>
                    {processing ? 'Approving...' : 'Yes, Approve Cab'}
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

export default AdminCabApprovals
