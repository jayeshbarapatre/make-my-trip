import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminBusesService } from '../services/adminService'
import BusForm from '../components/Admin/BusForm'
import './AdminFlights.css'

const AdminBuses = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingBus, setEditingBus] = useState(null)

  useEffect(() => {
    fetchBuses()
  }, [page, search])

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const response = await adminBusesService.getAll({ page, limit: 10, search })
      setBuses(response.data.data.buses)
      setPagination(response.data.data.pagination)
    } catch (err) {
      setError('Failed to load buses')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this bus?')) {
      try {
        await adminBusesService.delete(id)
        setBuses(buses.filter(b => b._id !== id))
      } catch (err) {
        setError('Failed to delete bus')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminBusesService.toggleStatus(id)
      setBuses(buses.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b))
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (bus) => {
    setEditingBus(bus)
    setEditingId(bus._id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setEditingBus(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        await adminBusesService.update(editingId, formData)
        setBuses(buses.map(b => b._id === editingId ? { ...b, ...formData } : b))
      } else {
        const response = await adminBusesService.create(formData)
        setBuses([response.data.data.bus, ...buses])
      }
      handleCloseForm()
    } catch (err) {
      setError('Failed to save bus')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <h1>Buses Management</h1>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            🚌 Add New Bus
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <BusForm bus={editingBus} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
            </div>
          </div>
        )}

        <div className="search-bar">
          <input type="text" placeholder="Search buses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>

        {loading ? (
          <div className="loading">Loading buses...</div>
        ) : buses.length === 0 ? (
          <div className="empty-state"><p>No buses found. Create your first bus!</p></div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bus Number</th>
                    <th>Operator</th>
                    <th>Type</th>
                    <th>Route</th>
                    <th>Price</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map(bus => (
                    <tr key={bus._id}>
                      <td className="font-bold">{bus.busNumber}</td>
                      <td>{bus.operatorName}</td>
                      <td>{bus.type}</td>
                      <td>{bus.departure?.city} → {bus.arrival?.city}</td>
                      <td>₹{bus.price.toLocaleString()}</td>
                      <td>{bus.seatsAvailable}/{bus.seats}</td>
                      <td><span className={`badge ${bus.isActive ? 'badge-active' : 'badge-inactive'}`}>{bus.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="actions">
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(bus)}>✎ Edit</button>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(bus._id)}>{bus.isActive ? '🔒' : '🔓'}</button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(bus._id)}>🗑️ Delete</button>
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

export default AdminBuses
