import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService, vendorRoomsService } from '../services/vendorService'
import toast from 'react-hot-toast'
import {
  RiArrowLeftLine, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiDoorOpenLine, RiGroupLine, RiMoneyDollarCircleLine
} from 'react-icons/ri'

const EMPTY_FORM = {
  categoryName: '',
  description: '',
  capacity: 2,
  totalRooms: '',
  basePrice: '',
  amenities: []
}

const VendorHotelRooms = () => {
  const { hotelId } = useParams()
  const navigate = useNavigate()
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  useEffect(() => { fetchData() }, [hotelId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [hotelRes, roomsRes] = await Promise.all([
        vendorHotelsService.getById(hotelId),
        vendorRoomsService.getByHotel(hotelId)
      ])
      setHotel(hotelRes.data.data.hotel)
      setRooms(roomsRes.data.data.rooms || [])
    } catch {
      toast.error('Failed to load hotel or rooms')
      navigate('/vendor/hotels')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['capacity', 'totalRooms', 'basePrice'].includes(name) ? Number(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.categoryName || !formData.totalRooms || !formData.basePrice) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      setSubmitting(true)
      if (editingRoomId) {
        await vendorRoomsService.update(hotelId, editingRoomId, formData)
        toast.success('Room updated')
      } else {
        await vendorRoomsService.create(hotelId, formData)
        toast.success('Room created')
      }
      fetchData()
      closeForm()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (room) => {
    setFormData({
      categoryName: room.categoryName,
      description: room.description || '',
      capacity: room.capacity,
      totalRooms: room.totalRooms,
      basePrice: room.basePrice,
      amenities: room.amenities || []
    })
    setEditingRoomId(room.id)
    setShowForm(true)
  }

  const handleDelete = async (roomId) => {
    if (!window.confirm('Delete this room category?')) return
    try {
      await vendorRoomsService.delete(hotelId, roomId)
      toast.success('Room deleted')
      setRooms(rooms.filter(r => r.id !== roomId))
    } catch {
      toast.error('Failed to delete room')
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingRoomId(null)
    setFormData(EMPTY_FORM)
  }

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => navigate('/vendor/hotels')}
            >
              <RiArrowLeftLine className="w-4 h-4" />
            </button>
            <div>
              {loading ? (
                <div className="skeleton h-6 w-40 rounded" />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-base-content">{hotel?.name}</h2>
                  <p className="text-sm text-base-content/50 mt-0.5">Room Categories</p>
                </>
              )}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm gap-2 w-fit"
            onClick={() => setShowForm(true)}
          >
            <RiAddLine className="w-4 h-4" />
            Add Room Category
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card bg-base-100 border border-base-200 shadow-sm">
                <div className="card-body p-5 space-y-3">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-8 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiDoorOpenLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No room categories yet</p>
              <p className="text-sm text-base-content/50 mt-1">Add room types to this hotel</p>
              <button className="btn btn-primary btn-sm gap-2 mt-4" onClick={() => setShowForm(true)}>
                <RiAddLine className="w-4 h-4" />
                Add First Room
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <RiDoorOpenLine className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base-content text-sm">{room.categoryName}</h3>
                        <div className="flex items-center gap-1 text-xs text-base-content/50 mt-0.5">
                          <RiGroupLine className="w-3 h-3" />
                          {room.capacity} guests max
                        </div>
                      </div>
                    </div>
                  </div>

                  {room.description && (
                    <p className="text-xs text-base-content/60 mb-3 line-clamp-2">{room.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 bg-base-200 rounded-lg text-center">
                      <p className="text-[10px] uppercase font-semibold text-base-content/50">Available</p>
                      <p className="text-sm font-bold text-base-content mt-0.5">
                        {room.availableRooms}/{room.totalRooms}
                      </p>
                    </div>
                    <div className="p-2 bg-base-200 rounded-lg text-center">
                      <p className="text-[10px] uppercase font-semibold text-base-content/50">Price/Night</p>
                      <p className="text-sm font-bold text-primary mt-0.5">
                        ₹{room.basePrice?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-xs gap-1 flex-1"
                      onClick={() => openEdit(room)}
                    >
                      <RiEditLine className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1 flex-1"
                      onClick={() => handleDelete(room.id)}
                    >
                      <RiDeleteBinLine className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Form Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <button
              className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4"
              onClick={closeForm}
              disabled={submitting}
            >✕</button>
            <h3 className="font-bold text-lg mb-5">
              {editingRoomId ? 'Edit Room Category' : 'Add Room Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="form-control">
                <div className="label py-1">
                  <span className="label-text text-sm font-medium">Room Type Name *</span>
                </div>
                <input
                  type="text"
                  name="categoryName"
                  className="input input-bordered input-sm"
                  placeholder="e.g., Deluxe, Suite, Standard"
                  value={formData.categoryName}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </label>

              <label className="form-control">
                <div className="label py-1">
                  <span className="label-text text-sm font-medium">Description</span>
                </div>
                <textarea
                  name="description"
                  className="textarea textarea-bordered textarea-sm"
                  placeholder="Room features and amenities..."
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="form-control">
                  <div className="label py-1">
                    <span className="label-text text-xs font-medium">Capacity</span>
                  </div>
                  <input
                    type="number"
                    name="capacity"
                    className="input input-bordered input-sm"
                    min={1}
                    value={formData.capacity}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1">
                    <span className="label-text text-xs font-medium">Total Rooms *</span>
                  </div>
                  <input
                    type="number"
                    name="totalRooms"
                    className="input input-bordered input-sm"
                    placeholder="5"
                    value={formData.totalRooms}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                </label>
                <label className="form-control">
                  <div className="label py-1">
                    <span className="label-text text-xs font-medium">Price/Night *</span>
                  </div>
                  <input
                    type="number"
                    name="basePrice"
                    className="input input-bordered input-sm"
                    placeholder="2000"
                    value={formData.basePrice}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  />
                </label>
              </div>

              <div className="modal-action pt-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={submitting}>
                  {submitting && <span className="loading loading-spinner loading-xs" />}
                  {editingRoomId ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => !submitting && closeForm()} />
        </div>
      )}
    </VendorLayout>
  )
}

export default VendorHotelRooms
