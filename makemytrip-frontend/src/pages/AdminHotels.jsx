import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminHotelsService } from '../services/adminService'
import HotelForm from '../components/Admin/HotelForm'
import './AdminFlights.css'

const AdminHotels = () => {
  const [hotels, setHotels] = useState([])
  const [allHotels, setAllHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingHotel, setEditingHotel] = useState(null)

  useEffect(() => {
    fetchHotels()
  }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setHotels(allHotels)
    } else {
      const filtered = allHotels.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase())
      )
      setHotels(filtered)
    }
  }, [search, allHotels])

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const response = await adminHotelsService.getAll()
      setAllHotels(response.data.data)
      setHotels(response.data.data)
      setError('')
    } catch (err) {
      setError('Failed to load hotels')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this hotel?')) {
      try {
        await adminHotelsService.delete(id)
        setHotels(hotels.filter(h => h.id !== id))
      } catch (err) {
        setError('Failed to delete hotel')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminHotelsService.toggleStatus(id)
      setHotels(hotels.map(h => h.id === id ? { ...h, isActive: !h.isActive } : h))
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (hotel) => {
    setEditingHotel(hotel)
    setEditingId(hotel.id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setEditingHotel(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        await adminHotelsService.update(editingId, formData)
        setHotels(hotels.map(h => h.id === editingId ? { ...h, ...formData } : h))
      } else {
        const response = await adminHotelsService.create(formData)
        setHotels([response.data.data.hotel, ...hotels])
      }
      handleCloseForm()
    } catch (err) {
      setError('Failed to save hotel')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Hotels Management</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
              <span>📊 Total: <strong style={{ color: '#0f172a' }}>{allHotels.length}</strong></span>
              <span>✅ Active: <strong style={{ color: '#10b981' }}>{allHotels.filter(h => h.isActive).length}</strong></span>
              <span>⛔ Inactive: <strong style={{ color: '#ef4444' }}>{allHotels.filter(h => !h.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            🏨 Add New Hotel
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search hotels by name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <HotelForm
                hotel={editingHotel}
                onSubmit={handleFormSubmit}
                onClose={handleCloseForm}
              />
            </div>
          </div>
        )}


        {loading ? (
          <div className="loading">Loading hotels...</div>
        ) : hotels.length === 0 ? (
          <div className="empty-state"><p>No hotels found. Create your first hotel!</p></div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hotel Name</th>
                    <th>City</th>
                    <th>Rating</th>
                    <th>Price/Night</th>
                    <th>Rooms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.map(hotel => (
                    <tr key={hotel.id}>
                      <td className="font-bold">{hotel.name}</td>
                      <td>{hotel.city}</td>
                      <td>⭐ {hotel.rating}</td>
                      <td>₹{hotel.pricePerNight.toLocaleString()}</td>
                      <td>{hotel.roomsAvailable}/{hotel.rooms}</td>
                      <td>
                        <span className={`badge ${hotel.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {hotel.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions">
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(hotel)}>✎ Edit</button>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(hotel.id)}>
                          {hotel.isActive ? '🔒' : '🔓'}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(hotel.id)}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminHotels
