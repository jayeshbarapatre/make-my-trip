import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import { RoomForm } from '../components/Admin/RoomForm';
import { adminRoomsService, adminHotelsService } from '../services/adminService';
import '../pages/AdminFlights.css';

export const AdminHotelRooms = () => {
  const { id: hotelId } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    const fetchHotelAndRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        const hotelResponse = await adminHotelsService.getHotel(hotelId);
        setHotel(hotelResponse.data.data?.hotel || hotelResponse.data.hotel);

        const roomsResponse = await adminRoomsService.getRooms(hotelId);
        setRooms(roomsResponse.data.data || []);
      } catch (err) {
        setError('Failed to fetch hotel or rooms');
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchHotelAndRooms();
    }
  }, [hotelId]);

  const handleCreateRoom = async (formData) => {
    try {
      const response = await adminRoomsService.createRoom(hotelId, formData);
      setRooms([...rooms, response.data.data.room]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to add room');
    }
  };

  const handleUpdateRoom = async (formData) => {
    try {
      const response = await adminRoomsService.updateRoom(hotelId, editingRoom.id, formData);
      setRooms(rooms.map(r => (r.id === editingRoom.id ? response.data.data.room : r)));
      setShowForm(false);
      setEditingRoom(null);
    } catch (err) {
      setError('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      await adminRoomsService.deleteRoom(hotelId, roomId);
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (err) {
      setError('Failed to delete room');
    }
  };

  const handleToggleStatus = async (roomId) => {
    try {
      const response = await adminRoomsService.toggleRoom(hotelId, roomId);
      setRooms(rooms.map(r => (r.id === roomId ? response.data.data.room : r)));
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleSaveRoom = (formData) => {
    if (editingRoom) {
      handleUpdateRoom(formData);
    } else {
      handleCreateRoom(formData);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-content">
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/admin/hotels')} className="breadcrumb-link">
            Hotels
          </button>
          <span> &gt; </span>
          <span>{hotel?.name || 'Hotel'}</span>
          <span> &gt; </span>
          <span>Rooms</span>
        </div>

        {/* Header */}
        <div className="content-header">
          <h1>Manage Rooms - {hotel?.name}</h1>
          <button
            className="btn-add"
            onClick={() => {
              setEditingRoom(null);
              setShowForm(true);
            }}
          >
            + Add Room
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Rooms Table */}
        {rooms.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
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
                      <span className={`status-badge ${room.isActive ? 'active' : 'inactive'}`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setEditingRoom(room);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-toggle"
                        onClick={() => handleToggleStatus(room.id)}
                      >
                        {room.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No rooms added yet. Click "Add Room" to create one.</p>
          </div>
        )}

        {/* Room Form Modal */}
        {showForm && (
          <RoomForm
            room={editingRoom}
            hotelId={hotelId}
            onSave={handleSaveRoom}
            onClose={() => {
              setShowForm(false);
              setEditingRoom(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};
