import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminCabsService } from '../services/adminService'
import CabForm from '../components/Admin/CabForm'
import Icons from '../utils/icons'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const PAGE_SIZE = 10

const AdminCabs = () => {
  const confirm = useConfirm()
  const [allCabs, setAllCabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingCab, setEditingCab] = useState(null)

  const fetchCabs = async () => {
    try {
      setLoading(true)
      const response = await adminCabsService.getAll()
      setAllCabs(response.data.data.cabs ?? [])
      setError('')
    } catch (_err) {
      setError('Failed to load cabs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCabs() }, [])

  // Client-side search across number, operator, type and city
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allCabs
    return allCabs.filter(c =>
      (c.vehicleNumber ?? c.cabNumber ?? '').toLowerCase().includes(q) ||
      (c.driver ?? c.operatorName ?? '').toLowerCase().includes(q) ||
      (c.type ?? '').toLowerCase().includes(q) ||
      (c.from ?? c.currentCity ?? '').toLowerCase().includes(q)
    )
  }, [allCabs, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1) }

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete this cab?', message: 'The vehicle is removed from search. This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) {
      try {
        await adminCabsService.delete(id)
        setAllCabs(prev => prev.filter(c => c.id !== id))
      } catch (_err) {
        setError('Failed to delete cab')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminCabsService.toggleStatus(id)
      setAllCabs(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (cab) => { setEditingCab(cab); setEditingId(cab.id); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditingId(null); setEditingCab(null) }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        const res = await adminCabsService.update(editingId, formData)
        const saved = res.data.data.cab
        setAllCabs(prev => prev.map(c => c.id === editingId ? { ...c, ...saved } : c))
      } else {
        const res = await adminCabsService.create(formData)
        setAllCabs(prev => [res.data.data.cab, ...prev])
      }
      handleCloseForm()
      setError('')
    } catch (_err) {
      setError('Failed to save cab')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Cabs Management</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>📊 Total: <strong style={{ color: 'hsl(var(--bc))' }}>{allCabs.length}</strong></span>
              <span>✅ Active: <strong style={{ color: 'hsl(var(--su))' }}>{allCabs.filter(c => c.isActive).length}</strong></span>
              <span>⛔ Inactive: <strong style={{ color: 'hsl(var(--er))' }}>{allCabs.filter(c => !c.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.taxi({ size: 16 })} Add New Cab
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <CabForm key={editingCab?.id ?? 'new'} cab={editingCab} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
            </div>
          </div>
        )}

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by cab number, operator, type or city..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {loading ? (
          <div className="loading-container">Loading cabs...</div>
        ) : paginated.length === 0 ? (
          <div className="empty-state"><p>{search ? 'No cabs match your search.' : 'No cabs found. Create your first cab!'}</p></div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cab Number</th>
                    <th>Operator</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Base Fare</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(cab => (
                    <tr key={cab.id}>
                      <td className="font-bold">{cab.vehicleNumber ?? cab.cabNumber ?? '—'}</td>
                      <td>{cab.driver ?? cab.operatorName ?? '—'}</td>
                      <td>{cab.type ?? '—'}</td>
                      <td>{cab.from ?? cab.currentCity ?? '—'}</td>
                      <td>&#8377;{cab.price ?? cab.baseFare ?? '—'}</td>
                      <td>{cab.capacity ?? cab.cabs ?? '—'}</td>
                      <td><span className={`badge ${cab.isActive ? 'badge-active' : 'badge-inactive'}`}>{cab.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="actions">
                          <button className="btn-sm btn-edit" onClick={() => handleEdit(cab)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {Icons.edit({ size: 14 })} Edit
                          </button>
                          <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(cab.id)} title={cab.isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {cab.isActive ? Icons.toggleOn({ size: 14 }) : Icons.toggleOff({ size: 14 })}
                          </button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(cab.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
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
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} cab{filtered.length !== 1 ? 's' : ''}
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

export default AdminCabs
