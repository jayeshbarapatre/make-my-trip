import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminTrainsService } from '../services/adminService'
import TrainForm from '../components/Admin/TrainForm'
import Icons from '../utils/icons'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const PAGE_SIZE = 10

const AdminTrains = () => {
  const confirm = useConfirm()
  const [allTrains, setAllTrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingTrain, setEditingTrain] = useState(null)

  const fetchTrains = async () => {
    try {
      setLoading(true)
      const response = await adminTrainsService.getAll()
      setAllTrains(response.data.data?.trains ?? response.data.data?.traines ?? [])
      setError('')
    } catch (_err) {
      setError('Failed to load trains')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrains() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allTrains
    return allTrains.filter(t =>
      (t.trainNumber ?? '').toLowerCase().includes(q) ||
      (t.operatorName ?? '').toLowerCase().includes(q) ||
      (t.type ?? '').toLowerCase().includes(q) ||
      (t.departure?.city ?? '').toLowerCase().includes(q) ||
      (t.arrival?.city ?? '').toLowerCase().includes(q)
    )
  }, [allTrains, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1) }

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete this train?', message: 'The train is removed from search. This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) {
      try {
        await adminTrainsService.delete(id)
        setAllTrains(prev => prev.filter(t => t.id !== id))
      } catch (_err) {
        setError('Failed to delete train')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminTrainsService.toggleStatus(id)
      setAllTrains(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (train) => { setEditingTrain(train); setEditingId(train.id); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditingId(null); setEditingTrain(null) }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        await adminTrainsService.update(editingId, formData)
        setAllTrains(prev => prev.map(t => t.id === editingId ? { ...t, ...formData } : t))
      } else {
        const response = await adminTrainsService.create(formData)
        const newTrain = response.data.data.train
        setAllTrains(prev => [newTrain, ...prev])
      }
      handleCloseForm()
    } catch (_err) {
      setError('Failed to save train')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Trains Management</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>📊 Total: <strong style={{ color: 'hsl(var(--bc))' }}>{allTrains.length}</strong></span>
              <span>✅ Active: <strong style={{ color: 'hsl(var(--su))' }}>{allTrains.filter(t => t.isActive).length}</strong></span>
              <span>⛔ Inactive: <strong style={{ color: 'hsl(var(--er))' }}>{allTrains.filter(t => !t.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.train({ size: 16 })} Add New Train
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <TrainForm key={editingTrain?.id ?? 'new'} train={editingTrain} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
            </div>
          </div>
        )}

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by train number, operator, type or route..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {loading ? (
          <div className="loading-container">Loading trains...</div>
        ) : paginated.length === 0 ? (
          <div className="empty-state"><p>{search ? 'No trains match your search.' : 'No trains found. Create your first train!'}</p></div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Train Number</th>
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
                  {paginated.map(train => (
                    <tr key={train.id}>
                      <td className="font-bold">{train.trainNumber ?? '—'}</td>
                      <td>{train.operatorName ?? '—'}</td>
                      <td>{train.type ?? '—'}</td>
                      <td>{train.departure?.city ?? '—'} &#8594; {train.arrival?.city ?? '—'}</td>
                      <td>&#8377;{(train.price ?? 0).toLocaleString()}</td>
                      <td>{train.seatsAvailable ?? '—'}/{train.seats ?? '—'}</td>
                      <td>
                        <span className={`badge ${train.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {train.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn-sm btn-edit" onClick={() => handleEdit(train)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {Icons.edit({ size: 14 })} Edit
                          </button>
                          <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(train.id)} title={train.isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {train.isActive ? Icons.toggleOn({ size: 14 }) : Icons.toggleOff({ size: 14 })}
                          </button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(train.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
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
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} train{filtered.length !== 1 ? 's' : ''}
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

export default AdminTrains
