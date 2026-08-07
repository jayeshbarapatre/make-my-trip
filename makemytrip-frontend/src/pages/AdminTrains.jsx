import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminTrainsService } from '../services/adminService'
import TrainForm from '../components/Admin/TrainForm'
import Icons from '../utils/icons'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const AdminTrains = () => {
  const confirm = useConfirm()
  const [trains, setTraines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingTrain, setEditingTrain] = useState(null)

  const fetchTraines = async () => {
    try {
      setLoading(true)
      const response = await adminTrainsService.getAll({ page, limit: 10, search })
      setTraines(response.data.data?.traines || response.data.data?.trains || [])
      setPagination(response.data.data?.pagination || {})
    } catch (_err) {
      setError('Failed to load trains')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTraines()
  }, [page, search])

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete this train?', message: 'The train is removed from search. This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) {
      try {
        await adminTrainsService.delete(id)
        setTraines(trains.filter(b => b.id !== id))
      } catch (_err) {
        setError('Failed to delete train')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminTrainsService.toggleStatus(id)
      setTraines(trains.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (train) => {
    setEditingTrain(train)
    setEditingId(train.id)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setEditingTrain(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        await adminTrainsService.update(editingId, formData)
        setTraines(trains.map(b => b.id === editingId ? { ...b, ...formData } : b))
      } else {
        const response = await adminTrainsService.create(formData)
        const newTrain = response.data.data.train
        setTraines([newTrain, ...trains])
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
          <h1>Traines Management</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.train({ size: 16 })} Add New Train
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <TrainForm key={editingTrain?.id ?? 'new'}
train={editingTrain} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
            </div>
          </div>
        )}

        <div className="search-bar">
          <input type="text" placeholder="Search trains..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>

        {loading ? (
          <div className="loading-container">Loading trains...</div>
        ) : trains.length === 0 ? (
          <div className="empty-state"><p>No trains found. Create your first train!</p></div>
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
                  {trains.map(train => (
                    <tr key={train.id}>
                      <td className="font-bold">{train.trainNumber}</td>
                      <td>{train.operatorName}</td>
                      <td>{train.type}</td>
                      <td>{train.departure?.city} → {train.arrival?.city}</td>
                      <td>₹{train.price.toLocaleString()}</td>
                      <td>{train.seatsAvailable}/{train.seats}</td>
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

export default AdminTrains
