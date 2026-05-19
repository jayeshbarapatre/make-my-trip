import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminFlightsService } from '../services/adminService'
import FlightForm from '../components/Admin/FlightForm'
import Icons from '../utils/icons'
import './AdminFlights.css'

const AdminFlights = () => {
  const [flights, setFlights] = useState([])
  const [allFlights, setAllFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingFlight, setEditingFlight] = useState(null)
  const [seatsModalFlight, setSeatsModalFlight] = useState(null)
  const [seatsInput, setSeatsInput] = useState('')

  useEffect(() => {
    fetchFlights()
  }, [])

  useEffect(() => {
    if (search.trim() === '') {
      setFlights(allFlights)
    } else {
      const filtered = allFlights.filter(f => {
        const depCity = typeof f.departure === 'string' ? JSON.parse(f.departure)?.city : f.departure?.city
        const arrCity = typeof f.arrival === 'string' ? JSON.parse(f.arrival)?.city : f.arrival?.city

        return (
          f.flightNumber.toLowerCase().includes(search.toLowerCase()) ||
          depCity?.toLowerCase().includes(search.toLowerCase()) ||
          arrCity?.toLowerCase().includes(search.toLowerCase())
        )
      })
      setFlights(filtered)
    }
  }, [search, allFlights])

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
      setFlights(parsedFlights)
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
        setFlights(flights.filter(f => f.id !== id))
      } catch (err) {
        setError('Failed to delete flight')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminFlightsService.toggleStatus(id)
      setFlights(flights.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f))
    } catch (err) {
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
        setFlights(flights.map(f => f.id === editingId ? { ...f, ...formData } : f))
      } else {
        const response = await adminFlightsService.create(formData)
        setFlights([response.data.data.flight, ...flights])
      }
      handleCloseForm()
    } catch (err) {
      setError('Failed to save flight')
    }
  }

  const handleOpenSeatsModal = (flight) => {
    setSeatsModalFlight(flight)
    setSeatsInput(flight.seatsAvailable.toString())
  }

  const handleCloseSeatsModal = () => {
    setSeatsModalFlight(null)
    setSeatsInput('')
  }

  const handleUpdateSeats = async () => {
    if (!seatsModalFlight || seatsInput === '') return

    const newSeats = parseInt(seatsInput)
    if (isNaN(newSeats) || newSeats < 0 || newSeats > seatsModalFlight.seats) {
      setError(`Seats must be between 0 and ${seatsModalFlight.seats}`)
      return
    }

    try {
      await adminFlightsService.updateSeats(seatsModalFlight.id, newSeats)
      setFlights(flights.map(f => f.id === seatsModalFlight.id ? { ...f, seatsAvailable: newSeats } : f))
      handleCloseSeatsModal()
    } catch (err) {
      setError('Failed to update seats')
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
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.plane({ size: 16 })} Add New Flight
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
            onChange={(e) => setSearch(e.target.value)}
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
                    <tr key={flight.id}>
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
                        <button className="btn-sm btn-seats" onClick={() => handleOpenSeatsModal(flight)} title="Update Seats" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          ✈️ Seats
                        </button>
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(flight)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {Icons.edit({ size: 14 })} Edit
                        </button>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(flight.id)} title={flight.isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {flight.isActive ? Icons.toggleOn({ size: 14 }) : Icons.toggleOff({ size: 14 })}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(flight.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {Icons.delete({ size: 14 })} Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {seatsModalFlight && (
          <div className="modal-overlay" onClick={handleCloseSeatsModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div style={{ padding: '24px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Update Available Seats</h2>
                <p style={{ marginBottom: '16px', color: 'hsl(var(--bc) / 0.7)' }}>
                  {seatsModalFlight.flightNumber} - {seatsModalFlight.airline}
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Available Seats (0-{seatsModalFlight.seats})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={seatsModalFlight.seats}
                    value={seatsInput}
                    onChange={(e) => setSeatsInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid hsl(var(--bc) / 0.2)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'hsl(var(--info) / 0.1)', borderRadius: '6px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--bc) / 0.8)' }}>
                    Current: <strong>{seatsModalFlight.seatsAvailable}/{seatsModalFlight.seats}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-secondary"
                    onClick={handleCloseSeatsModal}
                    style={{ padding: '8px 16px', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleUpdateSeats}
                    style={{ padding: '8px 16px', borderRadius: '6px' }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminFlights
