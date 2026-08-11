import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminBusesService } from '../services/adminService'
import BusForm from '../components/Admin/BusForm'
import Icons from '../utils/icons'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const PAGE_SIZE = 10

const AdminBuses = () => {
  const confirm = useConfirm()
  const [allBuses, setAllBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingBus, setEditingBus] = useState(null)

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const response = await adminBusesService.getAll()
      setAllBuses(response.data.data?.buses ?? [])
      setError('')
    } catch (_err) {
      setError('Failed to load buses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBuses() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allBuses
    return allBuses.filter(b =>
      (b.busNumber ?? '').toLowerCase().includes(q) ||
      (b.operatorName ?? b.busName ?? '').toLowerCase().includes(q) ||
      (b.type ?? b.busType ?? '').toLowerCase().includes(q) ||
      (b.from ?? b.departure?.city ?? '').toLowerCase().includes(q) ||
      (b.to ?? b.arrival?.city ?? '').toLowerCase().includes(q)
    )
  }, [allBuses, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1) }

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete this bus?', message: 'The bus is removed from search. This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) {
      try {
        await adminBusesService.delete(id)
        setAllBuses(prev => prev.filter(b => b.id !== id))
      } catch (_err) {
        setError('Failed to delete bus')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminBusesService.toggleStatus(id)
      setAllBuses(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (bus) => { setEditingBus(bus); setEditingId(bus.id); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditingId(null); setEditingBus(null) }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        await adminBusesService.update(editingId, formData)
        setAllBuses(prev => prev.map(b => b.id === editingId ? { ...b, ...formData } : b))
      } else {
        const response = await adminBusesService.create(formData)
        const newBus = response.data.data.bus
        setAllBuses(prev => [newBus, ...prev])
      }
      handleCloseForm()
    } catch (_err) {
      setError('Failed to save bus')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Buses Management</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>📊 Total: <strong style={{ color: 'hsl(var(--bc))' }}>{allBuses.length}</strong></span>
              <span>✅ Active: <strong style={{ color: 'hsl(var(--su))' }}>{allBuses.filter(b => b.isActive).length}</strong></span>
              <span>⛔ Inactive: <strong style={{ color: 'hsl(var(--er))' }}>{allBuses.filter(b => !b.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.bus({ size: 16 })} Add New Bus
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <BusForm key={editingBus?.id ?? 'new'} bus={editingBus} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
            </div>
          </div>
        )}

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by bus number, operator, type or route..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {loading ? (
          <div className="loading-container">Loading buses...</div>
        ) : paginated.length === 0 ? (
          <div className="empty-state"><p>{search ? 'No buses match your search.' : 'No buses found. Create your first bus!'}</p></div>
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
                  {paginated.map(bus => (
                    <tr key={bus.id}>
                      <td className="font-bold">{bus.busNumber ?? '—'}</td>
                      <td>{bus.operatorName ?? bus.busName ?? '—'}</td>
                      <td>{bus.type ?? bus.busType ?? '—'}</td>
                      <td>{(bus.from ?? bus.departure?.city ?? '—')} &#8594; {(bus.to ?? bus.arrival?.city ?? '—')}</td>
                      <td>&#8377;{(bus.price ?? 0).toLocaleString()}</td>
                      <td>{bus.seatsAvailable ?? '—'}/{bus.totalSeats ?? bus.seats ?? '—'}</td>
                      <td><span className={`badge ${bus.isActive ? 'badge-active' : 'badge-inactive'}`}>{bus.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn-sm btn-edit" onClick={() => handleEdit(bus)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {Icons.edit({ size: 14 })} Edit
                          </button>
                          <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(bus.id)} title={bus.isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {bus.isActive ? Icons.toggleOn({ size: 14 }) : Icons.toggleOff({ size: 14 })}
                          </button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(bus.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
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
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} bus{filtered.length !== 1 ? 'es' : ''}
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

export default AdminBuses
