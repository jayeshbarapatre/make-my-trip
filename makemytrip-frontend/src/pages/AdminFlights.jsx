import { useState, useEffect, useMemo } from 'react'

const PAGE_SIZE = 10
import AdminLayout from '../components/Admin/AdminLayout'
import { adminFlightsService } from '../services/adminService'
import FlightForm from '../components/Admin/FlightForm'
import Icons from '../utils/icons'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const AdminFlights = () => {
  const confirm = useConfirm()
  const [allFlights, setAllFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingFlight, setEditingFlight] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allFlights
    return allFlights.filter(f => {
      const depCity = f.departure?.city ?? ''
      const arrCity = f.arrival?.city ?? ''
      return (
        (f.flightNumber ?? '').toLowerCase().includes(q) ||
        (f.airline ?? '').toLowerCase().includes(q) ||
        depCity.toLowerCase().includes(q) ||
        arrCity.toLowerCase().includes(q)
      )
    })
  }, [search, allFlights])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const fetchFlights = async () => {
    try {
      setLoading(true)
      const response = await adminFlightsService.getAll()
      const parsedFlights = response.data.data.flights.map(f => ({
        ...f,
        departure: typeof f.departure === 'string' ? JSON.parse(f.departure) : f.departure,
        arrival: typeof f.arrival === 'string' ? JSON.parse(f.arrival) : f.arrival
      }))
      setAllFlights(parsedFlights)
      setError('')
    } catch (err) {
      setError('Failed to load flights')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlights()
  }, [])

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete this flight?', message: 'The flight is removed from search. This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) {
      try {
        await adminFlightsService.delete(id)
        setAllFlights(prev => prev.filter(f => f.id !== id))
      } catch (_err) {
        setError('Failed to delete flight')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminFlightsService.toggleStatus(id)
      setAllFlights(prev => prev.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (flight) => {
    setEditingFlight(flight)
    setEditingId(flight.id)
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
        setAllFlights(prev => prev.map(f => f.id === editingId ? { ...f, ...formData } : f))
      } else {
        const response = await adminFlightsService.create(formData)
        setAllFlights(prev => [response.data.data.flight, ...prev])
      }
      handleCloseForm()
    } catch (_err) {
      setError('Failed to save flight')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Flights Management</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>📊 Total: <strong style={{ color: 'hsl(var(--bc))' }}>{allFlights.length}</strong></span>
              <span>✅ Active: <strong style={{ color: 'hsl(var(--su))' }}>{allFlights.filter(f => f.isActive).length}</strong></span>
              <span>⛔ Inactive: <strong style={{ color: 'hsl(var(--er))' }}>{allFlights.filter(f => !f.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.plane({ size: 16 })} Add New Flight
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <FlightForm key={editingFlight?.id ?? 'new'}
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
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {loading ? (
          <div className="loading-container">Loading flights...</div>
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <p>{search ? 'No flights match your search.' : 'No flights found. Create your first flight!'}</p>
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
                  {paginated.map(flight => (
                    <tr key={flight.id}>
                      <td className="font-bold">{flight.flightNumber}</td>
                      <td>{flight.airline}</td>
                      <td>{flight.departure?.city} &#8594; {flight.arrival?.city}</td>
                      <td>&#8377;{(flight.price ?? 0).toLocaleString()}</td>
                      <td>{flight.seatsAvailable}/{flight.seats}</td>
                      <td>
                        <span className={`badge ${flight.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {flight.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn-sm btn-edit" onClick={() => handleEdit(flight)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {Icons.edit({ size: 14 })} Edit
                          </button>
                          <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(flight.id)} title={flight.isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {flight.isActive ? Icons.toggleOn({ size: 14 }) : Icons.toggleOff({ size: 14 })}
                          </button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(flight.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {Icons.delete({ size: 14 })} Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
              <span style={{ fontSize: '13px', color: 'hsl(var(--bc) / 0.6)' }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} flight{filtered.length !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button disabled={page === 1} onClick={() => setPage(1)}>First</button>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                <button disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminFlights
