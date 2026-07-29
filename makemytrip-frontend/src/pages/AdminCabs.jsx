import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminCabsService } from '../services/adminService'
import CabForm from '../components/Admin/CabForm'
import Icons from '../utils/icons'
import './AdminFlights.css'

const AdminCabs = () => {
  const [cabs, setCabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingCab, setEditingCab] = useState(null)

  const fetchCabs = async () => {
    try {
      setLoading(true)
      const response = await adminCabsService.getAll({ page, limit: 10, search })
      setCabs(response.data.data.cabs)
      setPagination(response.data.data.pagination)
    } catch (_err) {
      setError('Failed to load cabs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCabs()
  }, [page, search])

  const handleDelete = async (id) => {
    if (window.confirm('Delete this cab?')) {
      try {
        await adminCabsService.delete(id)
        setCabs(cabs.filter(c => c._id !== id))
      } catch (_err) {
        setError('Failed to delete cab')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminCabsService.toggleStatus(id)
      setCabs(cabs.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (cab) => {
    setEditingCab(cab)
    setEditingId(cab._id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setEditingCab(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        await adminCabsService.update(editingId, formData)
        setCabs(cabs.map(c => c._id === editingId ? { ...c, ...formData } : c))
      } else {
        const response = await adminCabsService.create(formData)
        setCabs([response.data.data.cab, ...cabs])
      }
      handleCloseForm()
    } catch (_err) {
      setError('Failed to save cab')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <h1>Cabs Management</h1>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.taxi({ size: 16 })} Add New Cab
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <CabForm cab={editingCab} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
            </div>
          </div>
        )}

        <div className="search-bar">
          <input type="text" placeholder="Search cabs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>

        {loading ? (
          <div className="loading-container">Loading cabs...</div>
        ) : cabs.length === 0 ? (
          <div className="empty-state"><p>No cabs found. Create your first cab!</p></div>
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
                    <th>Available</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cabs.map(cab => (
                    <tr key={cab._id}>
                      <td className="font-bold">{cab.cabNumber}</td>
                      <td>{cab.operatorName}</td>
                      <td>{cab.type}</td>
                      <td>{cab.currentCity}</td>
                      <td>₹{cab.baseFare}</td>
                      <td>{cab.cabs_available}/{cab.cabs}</td>
                      <td><span className={`badge ${cab.isActive ? 'badge-active' : 'badge-inactive'}`}>{cab.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>

                        <div className="actions">
                        <button className="btn-sm btn-edit" onClick={() => handleEdit(cab)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {Icons.edit({ size: 14 })} Edit
                        </button>
                        <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(cab._id)} title={cab.isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {cab.isActive ? Icons.toggleOn({ size: 14 }) : Icons.toggleOff({ size: 14 })}
                        </button>
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(cab._id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {Icons.delete({ size: 14 })} Delete
                        </button>

                        </div>

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

export default AdminCabs
