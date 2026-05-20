import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminFlightsService } from '../services/adminService'
import FlightForm from '../components/Admin/FlightForm'
import {
  RiPlaneLine, RiAddLine, RiSearchLine, RiEditLine,
  RiDeleteBinLine, RiToggleLine, RiToggleFill
} from 'react-icons/ri'

const AdminFlights = () => {
  const [allFlights, setAllFlights] = useState([])
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingFlight, setEditingFlight] = useState(null)

  useEffect(() => { fetchFlights() }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    setFlights(q ? allFlights.filter(f => {
      const dep = f.departure?.city || ''
      const arr = f.arrival?.city || ''
      return f.flightNumber?.toLowerCase().includes(q) ||
        dep.toLowerCase().includes(q) ||
        arr.toLowerCase().includes(q)
    }) : allFlights)
  }, [search, allFlights])

  const fetchFlights = async () => {
    try {
      setLoading(true)
      const res = await adminFlightsService.getAll()
      const parsed = res.data.data.flights.map(f => ({
        ...f,
        departure: typeof f.departure === 'string' ? JSON.parse(f.departure) : f.departure,
        arrival: typeof f.arrival === 'string' ? JSON.parse(f.arrival) : f.arrival,
      }))
      setAllFlights(parsed)
      setFlights(parsed)
      setError('')
    } catch {
      setError('Failed to load flights')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this flight?')) return
    try {
      await adminFlightsService.delete(id)
      const updated = allFlights.filter(f => f.id !== id)
      setAllFlights(updated)
      setFlights(updated)
    } catch {
      setError('Failed to delete flight')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminFlightsService.toggleStatus(id)
      const updated = allFlights.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f)
      setAllFlights(updated)
      setFlights(updated)
    } catch {
      setError('Failed to update status')
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingFlight) {
        await adminFlightsService.update(editingFlight.id, formData)
        const updated = allFlights.map(f => f.id === editingFlight.id ? { ...f, ...formData } : f)
        setAllFlights(updated)
        setFlights(updated)
      } else {
        const res = await adminFlightsService.create(formData)
        setAllFlights([res.data.data.flight, ...allFlights])
        setFlights([res.data.data.flight, ...flights])
      }
      setShowForm(false)
      setEditingFlight(null)
    } catch {
      setError('Failed to save flight')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Flights</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-base-content/50">
              <span>Total: <strong className="text-base-content">{allFlights.length}</strong></span>
              <span>Active: <strong className="text-success">{allFlights.filter(f => f.isActive).length}</strong></span>
              <span>Inactive: <strong className="text-error">{allFlights.filter(f => !f.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm gap-2 w-fit" onClick={() => { setEditingFlight(null); setShowForm(true) }}>
            <RiAddLine className="w-4 h-4" />
            Add Flight
          </button>
        </div>

        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <RiSearchLine className="w-4 h-4 text-base-content/40" />
          <input
            type="text"
            className="grow"
            placeholder="Search by flight number or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading flights...</p>
          </div>
        ) : flights.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiPlaneLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No flights found</p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>Flight</th>
                    <th>Route</th>
                    <th>Price</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map(flight => (
                    <tr key={flight.id} className="hover:bg-base-200/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                            <RiPlaneLine className="w-4 h-4 text-info" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-base-content">{flight.flightNumber}</p>
                            <p className="text-[11px] text-base-content/50">{flight.airline}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-base-content/70">
                        {flight.departure?.city} → {flight.arrival?.city}
                      </td>
                      <td className="font-semibold text-sm text-base-content">₹{flight.price?.toLocaleString()}</td>
                      <td className="text-sm text-base-content/60">{flight.seatsAvailable}/{flight.seats}</td>
                      <td>
                        <span className={`badge badge-sm ${flight.isActive ? 'badge-success' : 'badge-error'}`}>
                          {flight.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn btn-ghost btn-xs gap-1" onClick={() => { setEditingFlight(flight); setShowForm(true) }}>
                            <RiEditLine className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button className="btn btn-ghost btn-xs" onClick={() => handleToggleStatus(flight.id)}>
                            {flight.isActive
                              ? <RiToggleFill className="w-4 h-4 text-success" />
                              : <RiToggleLine className="w-4 h-4 text-base-content/40" />
                            }
                          </button>
                          <button className="btn btn-ghost btn-xs text-error hover:bg-error/10" onClick={() => handleDelete(flight.id)}>
                            <RiDeleteBinLine className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <button className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4" onClick={() => { setShowForm(false); setEditingFlight(null) }}>✕</button>
            <h3 className="font-bold text-lg mb-5">{editingFlight ? 'Edit Flight' : 'Add New Flight'}</h3>
            <FlightForm flight={editingFlight} onSubmit={handleFormSubmit} onClose={() => { setShowForm(false); setEditingFlight(null) }} />
          </div>
          <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditingFlight(null) }} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminFlights
