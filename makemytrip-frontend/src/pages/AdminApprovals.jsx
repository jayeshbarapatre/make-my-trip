import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminService } from '../services/adminService'
import toast from 'react-hot-toast'
import '../components/Admin/AdminFlights.css'

const AdminApprovals = () => {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

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

  const handleApprove = async (hotelId) => {
    if (!window.confirm('Approve this hotel listing?')) return

    try {
      setProcessing(true)
      await adminService.approveHotel(hotelId)
      toast.success('Hotel approved successfully')
      setHotels(hotels.filter(h => h.id !== hotelId))
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
                          onClick={() => handleApprove(hotel.id)}
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

        {rejectingId && (
          <div className="modal-overlay" onClick={() => !processing && setRejectingId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Reject Hotel Listing</h2>
                <button
                  className="btn-close"
                  onClick={() => !processing && setRejectingId(null)}
                  disabled={processing}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="modal-body">
                <p style={{ color: 'hsl(var(--bc) / 0.7))' }}>
                  Please provide a reason for rejection. The vendor will see this feedback.
                </p>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid hsl(var(--bc) / 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: 'hsl(var(--bc))',
                    background: 'hsl(var(--b2))',
                    resize: 'vertical',
                    marginTop: '12px'
                  }}
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    className="btn-error"
                    onClick={() => handleReject(rejectingId)}
                    disabled={processing || !rejectReason.trim()}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: 'hsl(var(--er))',
                      color: 'hsl(var(--erc))',
                      opacity: (!rejectReason.trim() || processing) ? 0.6 : 1
                    }}
                  >
                    {processing ? 'Rejecting...' : 'Reject'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setRejectingId(null)}
                    disabled={processing}
                    style={{
                      flex: 1,
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: 'hsl(var(--bc) / 0.1)',
                      color: 'hsl(var(--bc))'
                    }}
                  >
                    Cancel
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

export default AdminApprovals
