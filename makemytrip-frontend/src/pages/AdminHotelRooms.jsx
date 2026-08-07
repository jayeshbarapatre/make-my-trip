import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/Admin/AdminLayout'
import { RoomForm } from '../components/Admin/RoomForm'
import { adminRoomsService, adminHotelsService } from '../services/adminService'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const AdminHotelRooms = () => {
  const confirm = useConfirm()
  const { id: hotelId } = useParams()
  const navigate = useNavigate()

  const [rooms, setRooms] = useState([])
  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)

  useEffect(() => {
    const fetchHotelAndRooms = async () => {
      try {
        setLoading(true)
        setError(null)

        const hotelResponse = await adminHotelsService.getById(hotelId)
        setHotel(hotelResponse.data.data?.hotel || hotelResponse.data.hotel)

        const roomsResponse = await adminRoomsService.getRooms(hotelId)
        setRooms(roomsResponse.data.data || [])
      } catch (_err) {
        setError('Failed to fetch hotel or rooms')
      } finally {
        setLoading(false)
      }
    }

    if (hotelId) {
      fetchHotelAndRooms()
    }
  }, [hotelId])

  const handleCreateRoom = async (formData) => {
    try {
      const response = await adminRoomsService.createRoom(hotelId, formData)
      setRooms([...rooms, response.data.data.room])
      setShowForm(false)
    } catch (_err) {
      setError('Failed to add room')
    }
  }

  const handleUpdateRoom = async (formData) => {
    try {
      const response = await adminRoomsService.updateRoom(hotelId, editingRoom.id, formData)
      setRooms(rooms.map(r => (r.id === editingRoom.id ? response.data.data.room : r)))
      setShowForm(false)
      setEditingRoom(null)
    } catch (_err) {
      setError('Failed to update room')
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!await confirm({ title: 'Delete this room?', message: 'The room type is removed from the property. This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) return

    try {
      await adminRoomsService.deleteRoom(hotelId, roomId)
      setRooms(rooms.filter(r => r.id !== roomId))
    } catch (_err) {
      setError('Failed to delete room')
    }
  }

  const handleToggleStatus = async (roomId) => {
    try {
      const response = await adminRoomsService.toggleRoom(hotelId, roomId)
      setRooms(rooms.map(r => (r.id === roomId ? response.data.data.room : r)))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleSaveRoom = (formData) => {
    if (editingRoom) {
      handleUpdateRoom(formData)
    } else {
      handleCreateRoom(formData)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-content">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Manage Rooms - {hotel?.name}</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>🛏️ Total: <strong style={{ color: 'hsl(var(--bc))' }}>{rooms.length}</strong></span>
              <span>✅ Active: <strong style={{ color: 'hsl(var(--su))' }}>{rooms.filter(r => r.isActive).length}</strong></span>
              <span>⛔ Inactive: <strong style={{ color: 'hsl(var(--er))' }}>{rooms.filter(r => !r.isActive).length}</strong></span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingRoom(null)
              setShowForm(true)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ➕ Add New Room
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/admin/hotels')}
            style={{ padding: '8px 12px', fontSize: '14px', background: 'none', border: 'none', color: 'hsl(var(--p))', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Back to Hotels
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {rooms.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Capacity</th>
                  <th>Total Rooms</th>
                  <th>Available</th>
                  <th>Price/Night</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td>{room.categoryName}</td>
                    <td>{room.capacity} guests</td>
                    <td>{room.totalRooms}</td>
                    <td>{room.availableRooms}</td>
                    <td>₹{room.basePrice}</td>
                    <td>
                      <span className={`badge ${room.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>

                      <div className="actions">
                      <button
                        className="btn-sm btn-edit"
                        onClick={() => {
                          setEditingRoom(room)
                          setShowForm(true)
                        }}
                        title="Edit"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-sm btn-toggle"
                        onClick={() => handleToggleStatus(room.id)}
                        title={room.isActive ? 'Deactivate' : 'Activate'}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {room.isActive ? '✓' : '✗'}
                      </button>
                      <button
                        className="btn-sm btn-delete"
                        onClick={() => handleDeleteRoom(room.id)}
                        title="Delete"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        🗑️ Delete
                      </button>

                      </div>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No rooms added yet. Click "Add New Room" to create one.</p>
          </div>
        )}

        {showForm && (
          <div className="modal-overlay" onClick={() => {
            setShowForm(false)
            setEditingRoom(null)
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <RoomForm
                key={editingRoom?.id ?? 'new'}
                room={editingRoom}
                hotelId={hotelId}
                onSave={handleSaveRoom}
                onClose={() => {
                  setShowForm(false)
                  setEditingRoom(null)
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminHotelRooms
