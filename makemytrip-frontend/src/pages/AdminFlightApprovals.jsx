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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-success"
                          style={{ color: 'white' }}
                          onClick={() => setApprovingId(flight.id)}
                          disabled={processing}
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-error"
                          style={{ color: 'white' }}
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
          <div className="modal-overlay" onClick={() => !processing && setApprovingId(null)}>
            <div className="modal-content" style={{ maxWidth: '450px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(40, 167, 69, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '24px' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Approve Flight Listing
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Flight will be visible to customers
                    </p>
                  </div>
                </div>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => !processing && setApprovingId(null)}
                  disabled={processing}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(40, 167, 69, 0.05)', border: '1px solid rgba(40, 167, 69, 0.2)', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  Are you sure you want to approve this flight listing? It will be immediately published on the platform and visible to all users.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  className="btn-sm"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.625rem 1rem', fontSize: '0.9375rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                  onClick={() => setApprovingId(null)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1rem', fontSize: '0.9375rem', borderRadius: '0.5rem', cursor: 'pointer', border: 'none', color: '#fff' }}
                  onClick={confirmApprove}
                  disabled={processing}
                >
                  {processing ? (
                    <><i className="fas fa-spinner fa-spin"></i> Approving...</>
                  ) : (
                    <><i className="fas fa-check"></i> Approve Flight</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectingId && (
          <div className="modal-overlay" onClick={() => !processing && setRejectingId(null)}>
            <div className="modal-content" style={{ maxWidth: '450px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(220, 53, 69, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px' }}>
                    <i className="fas fa-times-circle" style={{ fontSize: '24px' }}></i>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Reject Flight Listing
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Provide feedback to the vendor
                    </p>
                  </div>
                </div>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => !processing && setRejectingId(null)}
                  disabled={processing}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Rejection Reason <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this listing doesn't meet requirements..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9375rem',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  disabled={processing}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  className="btn-sm"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.625rem 1rem', fontSize: '0.9375rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                  onClick={() => setRejectingId(null)}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ background: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.625rem 1rem', fontSize: '0.9375rem', borderRadius: '0.5rem', cursor: 'pointer', border: 'none', color: '#fff' }}
                  onClick={() => handleReject(rejectingId)}
                  disabled={processing || !rejectReason.trim()}
                >
                  {processing ? (
                    <><i className="fas fa-spinner fa-spin"></i> Rejecting...</>
                  ) : (
                    <><i className="fas fa-times"></i> Reject Flight</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminFlightApprovals
