import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import VendorHotelForm from '../components/Vendor/VendorHotelForm'
import { vendorHotelsService } from '../services/vendorService'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import './VendorHotels.css'

const VendorHotels = () => {
  const navigate = useNavigate()
  const { theme, accentColor } = useTheme()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingHotelId, setEditingHotelId] = useState(null)

  useEffect(() => {
    fetchHotels()
  }, [])

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const response = await vendorHotelsService.getAll()
      setHotels(response.data.data.hotels || [])
      setError('')
    } catch (err) {
      setError('Failed to load hotels')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForApproval = (id) => {
    setConfirmDialog({
      type: 'submit',
      hotelId: id,
      title: 'Submit for Approval',
      message: 'This will send your hotel for admin review. Are you sure you want to submit it?'
    })
  }

  const handleDelete = (id) => {
    setConfirmDialog({
      type: 'delete',
      hotelId: id,
      title: 'Delete Hotel',
      message: 'Are you sure you want to delete this hotel? This action is permanent and cannot be undone.'
    })
  }

  const confirmAction = async () => {
    if (!confirmDialog) return

    try {
      setProcessingId(confirmDialog.hotelId)
      if (confirmDialog.type === 'submit') {
        await vendorHotelsService.submit(confirmDialog.hotelId)
        toast.success('Hotel submitted for approval')
      } else if (confirmDialog.type === 'delete') {
        await vendorHotelsService.delete(confirmDialog.hotelId)
        toast.success('Hotel deleted successfully')
        setHotels(hotels.filter(h => h.id !== confirmDialog.hotelId))
      }
      fetchHotels()
      setConfirmDialog(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DRAFT': return 'badge-secondary'
      case 'PENDING_APPROVAL': return 'badge-warning'
      case 'APPROVED': return 'badge-success'
      case 'REJECTED': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  if (loading) {
    return (
      <VendorLayout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
          <span className="loading loading-spinner loading-lg text-primary" style={{ marginBottom: '16px', color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your hotels...</p>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div style={{ padding: '0 0 24px' }}>
        
        {/* Header Card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>My Hotels</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 24px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-chart-bar" style={{ color: 'var(--text-muted)' }}></i> Total: <strong style={{ color: 'var(--text-primary)' }}>{hotels.length}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-pencil-alt" style={{ color: 'var(--text-muted)' }}></i> Draft: <strong style={{ color: 'var(--text-primary)' }}>{hotels.filter(h => h.listingStatus === 'DRAFT').length}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-hourglass-half" style={{ color: '#d39e00' }}></i> Pending: <strong style={{ color: 'var(--text-primary)' }}>{hotels.filter(h => h.listingStatus === 'PENDING_APPROVAL').length}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-check-circle" style={{ color: '#2ec158' }}></i> Approved: <strong style={{ color: 'var(--text-primary)' }}>{hotels.filter(h => h.listingStatus === 'APPROVED').length}</strong>
                </span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingHotelId(null); setShowFormModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <i className="fas fa-plus"></i> Add New Hotel
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', background: 'rgba(255, 77, 79, 0.1)', border: '1px solid rgba(255, 77, 79, 0.3)', borderRadius: '12px', color: '#ff4d4f', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {hotels.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)' }}>
              <i className="fas fa-hotel" style={{ fontSize: '24px', color: 'var(--text-muted)' }}></i>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>No hotels found</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px', fontSize: '14px' }}>You haven't listed any hotels yet. Get started by adding your first property.</p>
            <button className="btn btn-primary" onClick={() => { setEditingHotelId(null); setShowFormModal(true); }} style={{ width: 'fit-content', margin: '0 auto' }}>
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i> Add New Hotel
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {hotels.map(hotel => (
              <div key={hotel.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
                  
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hotel.name}
                      </h3>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-map-marker-alt"></i> {hotel.city}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(hotel.listingStatus)}`} style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.04em', fontWeight: 700, padding: '4px 8px' }}>
                      {hotel.listingStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Rejection Alert */}
                  {hotel.listingStatus === 'REJECTED' && hotel.rejectionReason && (
                    <div style={{ padding: '12px', background: 'rgba(255, 77, 79, 0.05)', borderRadius: '10px', border: '1px dashed rgba(255, 77, 79, 0.3)', color: '#ff4d4f', fontSize: '12.5px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <i className="fas fa-exclamation-triangle" style={{ marginTop: '2px' }}></i>
                      <div>
                        <strong style={{ fontWeight: 600 }}>Rejection Reason:</strong> {hotel.rejectionReason}
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'var(--surface2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 600, letterSpacing: '0.04em' }}>Price / Night</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>₹{hotel.pricePerNight.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 600, letterSpacing: '0.04em' }}>Rooms</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{hotel.rooms}</p>
                    </div>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 600, letterSpacing: '0.04em' }}>Rating</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>⭐ {hotel.rating.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                    <button
                      className="btn btn-sm btn-outline btn-primary"
                      onClick={() => { setEditingHotelId(hotel.id); setShowFormModal(true); }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'transparent',
                        color: '#ed4a29',
                        border: '1px solid rgba(237, 74, 41, 0.25)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(237, 74, 41, 0.06)';
                        e.currentTarget.style.borderColor = '#ed4a29';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(237, 74, 41, 0.25)';
                      }}
                    >
                      <i className="fas fa-edit" style={{ fontSize: '12px' }}></i> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => navigate(`/vendor/hotels/${hotel.id}/rooms`)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-body)';
                        e.currentTarget.style.borderColor = 'var(--text-secondary)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <i className="fas fa-door-open" style={{ fontSize: '12px' }}></i> Rooms
                    </button>
                  </div>
                  {['DRAFT', 'REJECTED'].includes(hotel.listingStatus) && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-primary" onClick={() => handleSubmitForApproval(hotel.id)} style={{ flex: 2, display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        <i className="fas fa-paper-plane" style={{ opacity: 0.9 }}></i> Submit for Approval
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(hotel.id)} style={{ flex: 1, display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        <i className="fas fa-trash" style={{ opacity: 0.9 }}></i> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDialog && createPortal(
        <div 
          className="admin-layout modal-backdrop-overlay" 
          data-theme={theme}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(15, 17, 23, 0.65)', backdropFilter: 'blur(12px)', padding: '24px',
            '--accent': accentColor
          }}
          onClick={() => !processingId && setConfirmDialog(null)}
        >
          <style>{`
            @keyframes modalScaleUp {
              from { transform: scale(0.95) translateY(12px); opacity: 0; }
              to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .modal-inner-container {
              animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div 
            className="card modal-inner-container" 
            style={{ width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-body" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                  background: confirmDialog.type === 'delete' ? 'rgba(255, 77, 79, 0.12)' : 'rgba(46, 193, 88, 0.12)',
                  color: confirmDialog.type === 'delete' ? '#ff4d4f' : '#2ec158',
                  border: `1px solid ${confirmDialog.type === 'delete' ? 'rgba(255, 77, 79, 0.2)' : 'rgba(46, 193, 88, 0.2)'}`
                }}>
                  <i className={confirmDialog.type === 'delete' ? 'fas fa-trash-alt' : 'fas fa-paper-plane'}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                    {confirmDialog.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                    {confirmDialog.message}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '36px' }}>
                <button className="btn" onClick={() => !processingId && setConfirmDialog(null)} disabled={processingId !== null}>
                  Cancel
                </button>
                <button 
                  className={`btn ${confirmDialog.type === 'delete' ? 'btn-danger' : 'btn-primary'}`} 
                  onClick={confirmAction} 
                  disabled={processingId !== null}
                  style={{ minWidth: '130px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  {processingId === confirmDialog.hotelId ? (
                    <>
                      <span className="loading loading-spinner" style={{ width: '14px', height: '14px' }}></span> 
                      {confirmDialog.type === 'delete' ? 'Deleting...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <i className={confirmDialog.type === 'delete' ? 'fas fa-trash' : 'fas fa-paper-plane'} style={{ fontSize: '13px' }}></i>
                      {confirmDialog.type === 'delete' ? 'Delete Hotel' : 'Submit Hotel'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showFormModal && (
        <VendorHotelForm 
          hotelId={editingHotelId} 
          onClose={() => {
            setShowFormModal(false);
            setEditingHotelId(null);
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingHotelId(null);
            fetchHotels();
          }}
        />
      )}
    </VendorLayout>
  )
}

export default VendorHotels

