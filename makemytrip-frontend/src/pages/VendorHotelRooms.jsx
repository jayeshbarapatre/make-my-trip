import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import VendorLayout from '../components/Vendor/VendorLayout'
import { vendorHotelsService, vendorRoomsService } from '../services/vendorService'
import toast from 'react-hot-toast'
import './VendorHotelRooms.css'

const VendorHotelRooms = () => {
  const { hotelId } = useParams()
  const navigate = useNavigate()
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRoomId, setEditingRoomId] = useState(null)
  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    capacity: 2,
    totalRooms: '',
    basePrice: '',
    amenities: []
  })

  const fetchHotelAndRooms = async () => {
    try {
      setLoading(true)
      const [hotelRes, roomsRes] = await Promise.all([
        vendorHotelsService.getById(hotelId),
        vendorRoomsService.getByHotel(hotelId)
      ])
      setHotel(hotelRes.data.data.hotel)
      setRooms(roomsRes.data.data.rooms || [])
    } catch (_err) {
      toast.error('Failed to load hotel or rooms')
      navigate('/vendor/hotels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHotelAndRooms()
  }, [hotelId])

  const handleInputChange = (e) => {
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
      if (editingRoomId) {
        await vendorRoomsService.update(hotelId, editingRoomId, formData)
        toast.success('Room updated successfully')
      } else {
        await vendorRoomsService.create(hotelId, formData)
        toast.success('Room created successfully')
      }
      fetchHotelAndRooms()
      setShowForm(false)
      setFormData({
        categoryName: '',
        description: '',
        capacity: 2,
        totalRooms: '',
        basePrice: '',
        amenities: []
      })
      setEditingRoomId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room')
    }
  }

  const handleEdit = (room) => {
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
      toast.success('Room deleted successfully')
      setRooms(rooms.filter(r => r.id !== roomId))
    } catch (_err) {
      toast.error('Failed to delete room')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRoomId(null)
    setFormData({
      categoryName: '',
      description: '',
      capacity: 2,
      totalRooms: '',
      basePrice: '',
      amenities: []
    })
  }

  if (loading) {
    return (
      <VendorLayout>
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i> Loading rooms...
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="vendor-rooms-page">
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => navigate('/vendor/hotels')}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h1>{hotel?.name}</h1>
            <p className="subtitle">Room Categories</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <i className="fas fa-plus"></i> Add Room Category
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="form-header">
                <h2>{editingRoomId ? 'Edit Room Category' : 'Add Room Category'}</h2>
                <button className="btn-close" onClick={handleCloseForm}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="room-form">
                <div className="form-group">
                  <label htmlFor="categoryName">Room Type Name *</label>
                  <input
                    id="categoryName"
                    name="categoryName"
                    type="text"
                    value={formData.categoryName}
                    onChange={handleInputChange}
                    placeholder="e.g., Deluxe, Suite, Standard"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Room features and amenities"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="capacity">Max Capacity</label>
                    <input
                      id="capacity"
                      name="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="totalRooms">Total Rooms *</label>
                    <input
                      id="totalRooms"
                      name="totalRooms"
                      type="number"
                      value={formData.totalRooms}
                      onChange={handleInputChange}
                      placeholder="5"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="basePrice">Price per Night (₹) *</label>
                    <input
                      id="basePrice"
                      name="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={handleInputChange}
                      placeholder="2000"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    {editingRoomId ? 'Update Room' : 'Create Room'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={handleCloseForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="empty-state">
            <p>No room categories yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <h3>{room.categoryName}</h3>
                  <span className="room-capacity">
                    <i className="fas fa-users"></i> {room.capacity} guests
                  </span>
                </div>

                {room.description && (
                  <p className="room-description">{room.description}</p>
                )}

                <div className="room-details">
                  <div className="detail">
                    <span className="label">Available Rooms</span>
                    <span className="value">{room.availableRooms}/{room.totalRooms}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Price/Night</span>
                    <span className="value">₹{room.basePrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="room-actions">
                  <button className="btn-sm btn-edit" onClick={() => handleEdit(room)}>
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(room.id)}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </VendorLayout>
  )
}

export default VendorHotelRooms
