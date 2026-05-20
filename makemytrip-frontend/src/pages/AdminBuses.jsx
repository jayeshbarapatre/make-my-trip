import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminBusesService } from '../services/adminService'
import BusForm from '../components/Admin/BusForm'
import {
  RiBusLine, RiAddLine, RiSearchLine, RiEditLine,
  RiDeleteBinLine, RiToggleLine, RiToggleFill
} from 'react-icons/ri'

const AdminBuses = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingBus, setEditingBus] = useState(null)

  useEffect(() => { fetchBuses() }, [page, search])

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const res = await adminBusesService.getAll({ page, limit: 10, search })
      setBuses(res.data.data || [])
      setPagination(res.data.pagination || {})
    } catch {
      setError('Failed to load buses')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bus?')) return
    try {
      await adminBusesService.delete(id)
      setBuses(buses.filter(b => b._id !== id))
    } catch {
      setError('Failed to delete bus')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminBusesService.toggleStatus(id)
      setBuses(buses.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b))
    } catch {
      setError('Failed to update status')
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingBus) {
        await adminBusesService.update(editingBus._id, formData)
        setBuses(buses.map(b => b._id === editingBus._id ? { ...b, ...formData } : b))
      } else {
        const res = await adminBusesService.create(formData)
        setBuses([res.data.data, ...buses])
      }
      setShowForm(false)
      setEditingBus(null)
    } catch {
      setError('Failed to save bus')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Buses</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-base-content/50">
              <span>Total: <strong className="text-base-content">{buses.length}</strong></span>
              <span>Active: <strong className="text-success">{buses.filter(b => b.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm gap-2 w-fit" onClick={() => { setEditingBus(null); setShowForm(true) }}>
            <RiAddLine className="w-4 h-4" />
            Add Bus
          </button>
        </div>

        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <RiSearchLine className="w-4 h-4 text-base-content/40" />
          <input
            type="text"
            className="grow"
            placeholder="Search buses..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </label>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading buses...</p>
          </div>
        ) : buses.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiBusLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No buses found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                      <th>Bus</th>
                      <th>Type</th>
                      <th>Route</th>
                      <th>Price</th>
                      <th>Seats</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buses.map(bus => (
                      <tr key={bus._id} className="hover:bg-base-200/50 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                              <RiBusLine className="w-4 h-4 text-warning" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-base-content">{bus.busNumber}</p>
                              <p className="text-[11px] text-base-content/50">{bus.operatorName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm text-base-content/60">{bus.type}</td>
                        <td className="text-sm text-base-content/70">{bus.departure?.city} → {bus.arrival?.city}</td>
                        <td className="font-semibold text-sm text-base-content">₹{bus.price?.toLocaleString()}</td>
                        <td className="text-sm text-base-content/60">{bus.seatsAvailable}/{bus.seats}</td>
                        <td>
                          <span className={`badge badge-sm ${bus.isActive ? 'badge-success' : 'badge-error'}`}>
                            {bus.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button className="btn btn-ghost btn-xs gap-1" onClick={() => { setEditingBus(bus); setShowForm(true) }}>
                              <RiEditLine className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => handleToggleStatus(bus._id)}>
                              {bus.isActive
                                ? <RiToggleFill className="w-4 h-4 text-success" />
                                : <RiToggleLine className="w-4 h-4 text-base-content/40" />
                              }
                            </button>
                            <button className="btn btn-ghost btn-xs text-error hover:bg-error/10" onClick={() => handleDelete(bus._id)}>
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

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
                <span className="text-sm text-base-content/60">Page {page} of {pagination.pages}</span>
                <button className="btn btn-outline btn-sm" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <button className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4" onClick={() => { setShowForm(false); setEditingBus(null) }}>✕</button>
            <h3 className="font-bold text-lg mb-5">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
            <BusForm bus={editingBus} onSubmit={handleFormSubmit} onClose={() => { setShowForm(false); setEditingBus(null) }} />
          </div>
          <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditingBus(null) }} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminBuses
