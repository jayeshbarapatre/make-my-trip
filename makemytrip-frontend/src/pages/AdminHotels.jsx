import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminHotelsService } from '../services/adminService'
import HotelForm from '../components/Admin/HotelForm'
import './AdminFlights.css'

const AdminHotels = () => {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingHotel, setEditingHotel] = useState(null)

  useEffect(() => {
    fetchHotels()
  }, [page, search])

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const response = await adminHotelsService.getAll({ page, limit: 10, search })
      setHotels(response.data.data.hotels)
      setPagination(response.data.data.pagination)
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
        setHotels(hotels.filter(h => h._id !== id))
      } catch (err) {
        setError('Failed to delete hotel')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminHotelsService.toggleStatus(id)
      setHotels(hotels.map(h => h._id === id ? { ...h, isActive: !h.isActive } : h))
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (hotel) => {
    setEditingHotel(hotel)
    setEditingId(hotel._id)
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
        setHotels(hotels.map(h => h._id === editingId ? { ...h, ...formData } : h))
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
          <h1>Hotels Management</h1>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            🏨 Add New Hotel
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

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

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search hotels by name, city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

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
                    <tr key={hotel._id}>
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
                        <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(hotel._id)}>
                          {hotel.isActive ? '🔒' : '🔓'}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(hotel._id)}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
                <span>Page {page} of {pagination.pages}</span>
                <button disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminHotels
