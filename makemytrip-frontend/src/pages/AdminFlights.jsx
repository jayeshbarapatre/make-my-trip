import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminFlightsService } from '../services/adminService'
import FlightForm from '../components/Admin/FlightForm'
import './AdminFlights.css'

const AdminFlights = () => {
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingFlight, setEditingFlight] = useState(null)

  useEffect(() => {
    fetchFlights()
  }, [page, search])

  const fetchFlights = async () => {
    try {
      setLoading(true)
      const response = await adminFlightsService.getAll({ page, limit: 10, search })
      setFlights(response.data.data.flights)
      setPagination(response.data.data.pagination)
      setError('')
    } catch (err) {
      setError('Failed to load flights')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this flight? This action cannot be undone.')) {
      try {
        await adminFlightsService.delete(id)
        setFlights(flights.filter(f => f._id !== id))
      } catch (err) {
        setError('Failed to delete flight')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminFlightsService.toggleStatus(id)
      setFlights(flights.map(f => f._id === id ? { ...f, isActive: !f.isActive } : f))
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (flight) => {
    setEditingFlight(flight)
    setEditingId(flight._id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setEditingFlight(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        await adminFlightsService.update(editingId, formData)
        setFlights(flights.map(f => f._id === editingId ? { ...f, ...formData } : f))
      } else {
        const response = await adminFlightsService.create(formData)
        setFlights([response.data.data.flight, ...flights])
      }
      handleCloseForm()
    } catch (err) {
      setError('Failed to save flight')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <h1>Flights Management</h1>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            ✈️ Add New Flight
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <FlightForm
                flight={editingFlight}
                onSubmit={handleFormSubmit}
                onClose={handleCloseForm}
              />
            </div>
          </div>
        )}

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search flights by airline, number, or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        {loading ? (
          <div className="loading">Loading flights...</div>
        ) : flights.length === 0 ? (
          <div className="empty-state">
            <p>No flights found. Create your first flight!</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Flight Number</th>
                    <th>Airline</th>
                    <th>Route</th>
                    <th>Price</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map(flight => (
                    <tr key={flight._id}>
                      <td className="font-bold">{flight.flightNumber}</td>
                      <td>{flight.airline}</td>
                      <td>{flight.departure?.city} → {flight.arrival?.city}</td>
                      <td>₹{flight.price.toLocaleString()}</td>
                      <td>{flight.seatsAvailable}/{flight.seats}</td>
                      <td>
                        <span className={`badge ${flight.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {flight.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="actions">
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(flight)}>✎ Edit</button>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(flight._id)}>
                          {flight.isActive ? '🔒' : '🔓'}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(flight._id)}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Previous
                </button>
                <span>Page {page} of {pagination.pages}</span>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminFlights
