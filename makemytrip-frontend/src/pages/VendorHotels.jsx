import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService } from '../services/vendorService'
import toast from 'react-hot-toast'
import {
  RiHotelLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiSendPlaneLine, RiDoorOpenLine, RiTimeLine, RiCheckboxCircleLine,
  RiCloseCircleLine, RiDraftLine
} from 'react-icons/ri'

const STATUS_CONFIG = {
  DRAFT:            { label: 'Draft',          badge: 'badge-neutral',  Icon: RiDraftLine },
  PENDING_APPROVAL: { label: 'Pending Review', badge: 'badge-warning',  Icon: RiTimeLine },
  APPROVED:         { label: 'Approved',       badge: 'badge-success',  Icon: RiCheckboxCircleLine },
  REJECTED:         { label: 'Rejected',       badge: 'badge-error',    Icon: RiCloseCircleLine },
}

const VendorHotels = () => {
  const navigate = useNavigate()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => { fetchHotels() }, [])

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const res = await vendorHotelsService.getAll()
      setHotels(res.data.data.hotels || [])
      setError('')
    } catch {
      setError('Failed to load hotels')
    } finally {
      setLoading(false)
    }
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
        toast.success('Hotel deleted')
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

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">My Hotels</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-base-content/50">
              <span>Total: <strong className="text-base-content">{hotels.length}</strong></span>
              <span>Pending: <strong className="text-warning">{hotels.filter(h => h.listingStatus === 'PENDING_APPROVAL').length}</strong></span>
              <span>Approved: <strong className="text-success">{hotels.filter(h => h.listingStatus === 'APPROVED').length}</strong></span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm gap-2 w-fit"
            onClick={() => navigate('/vendor/hotels/create')}
          >
            <RiAddLine className="w-4 h-4" />
            Add Hotel
          </button>
        </div>

        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading hotels...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiHotelLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No hotels yet</p>
              <p className="text-sm text-base-content/50 mt-1">Create your first hotel listing to get started</p>
              <button
                className="btn btn-primary btn-sm gap-2 mt-4"
                onClick={() => navigate('/vendor/hotels/create')}
              >
                <RiAddLine className="w-4 h-4" />
                Add First Hotel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {hotels.map(hotel => {
              const statusCfg = STATUS_CONFIG[hotel.listingStatus] || STATUS_CONFIG.DRAFT
              const canEdit = ['DRAFT', 'REJECTED'].includes(hotel.listingStatus)
              return (
                <div key={hotel.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="card-body p-5">
                    {/* Hotel header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <RiHotelLine className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base-content text-sm truncate">{hotel.name}</h3>
                          <p className="text-xs text-base-content/50 mt-0.5">📍 {hotel.city}</p>
                        </div>
                      </div>
                      <span className={`badge badge-sm shrink-0 ${statusCfg.badge}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Rejection reason */}
                    {hotel.listingStatus === 'REJECTED' && hotel.rejectionReason && (
                      <div className="alert alert-error py-2 text-xs mb-3">
                        <RiCloseCircleLine className="w-3.5 h-3.5 shrink-0" />
                        <span><strong>Rejected:</strong> {hotel.rejectionReason}</span>
                      </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-base-200 rounded-lg">
                        <p className="text-[10px] uppercase font-semibold text-base-content/50">Price</p>
                        <p className="text-xs font-bold text-base-content mt-0.5">₹{hotel.pricePerNight?.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-base-200 rounded-lg">
                        <p className="text-[10px] uppercase font-semibold text-base-content/50">Rooms</p>
                        <p className="text-xs font-bold text-base-content mt-0.5">{hotel.rooms}</p>
                      </div>
                      <div className="text-center p-2 bg-base-200 rounded-lg">
                        <p className="text-[10px] uppercase font-semibold text-base-content/50">Rating</p>
                        <p className="text-xs font-bold text-base-content mt-0.5">⭐ {hotel.rating?.toFixed(1)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => navigate(`/vendor/hotels/${hotel.id}/edit`)}
                      >
                        <RiEditLine className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => navigate(`/vendor/hotels/${hotel.id}/rooms`)}
                      >
                        <RiDoorOpenLine className="w-3.5 h-3.5" /> Rooms
                      </button>
                      {canEdit && (
                        <>
                          <button
                            className="btn btn-success btn-xs gap-1"
                            onClick={() => setConfirmDialog({ type: 'submit', hotelId: hotel.id, title: 'Submit for Approval', message: 'Submit this hotel for admin review?' })}
                          >
                            <RiSendPlaneLine className="w-3.5 h-3.5" /> Submit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1"
                            onClick={() => setConfirmDialog({ type: 'delete', hotelId: hotel.id, title: 'Delete Hotel', message: 'Delete this hotel? This cannot be undone.' })}
                          >
                            <RiDeleteBinLine className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <div className="flex flex-col items-center text-center py-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                confirmDialog.type === 'delete' ? 'bg-error/10' : 'bg-success/10'
              }`}>
                {confirmDialog.type === 'delete'
                  ? <RiDeleteBinLine className="w-7 h-7 text-error" />
                  : <RiSendPlaneLine className="w-7 h-7 text-success" />
                }
              </div>
              <h3 className="font-bold text-lg text-base-content">{confirmDialog.title}</h3>
              <p className="text-sm text-base-content/60 mt-2">{confirmDialog.message}</p>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDialog(null)}
                disabled={processingId !== null}
              >
                Cancel
              </button>
              <button
                className={`btn btn-sm gap-2 ${confirmDialog.type === 'delete' ? 'btn-error' : 'btn-success'}`}
                onClick={confirmAction}
                disabled={processingId !== null}
              >
                {processingId === confirmDialog.hotelId && <span className="loading loading-spinner loading-xs" />}
                {confirmDialog.type === 'delete' ? 'Delete' : 'Submit'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !processingId && setConfirmDialog(null)} />
        </div>
      )}
    </VendorLayout>
  )
}

export default VendorHotels
