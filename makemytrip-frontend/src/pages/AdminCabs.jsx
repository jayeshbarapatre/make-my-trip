import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminCabsService } from '../services/adminService'
import CabForm from '../components/Admin/CabForm'
import {
  RiTaxiLine, RiAddLine, RiSearchLine, RiEditLine,
  RiDeleteBinLine, RiToggleLine, RiToggleFill
} from 'react-icons/ri'

const AdminCabs = () => {
  const [cabs, setCabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingCab, setEditingCab] = useState(null)

  useEffect(() => { fetchCabs() }, [page, search])

  const fetchCabs = async () => {
    try {
      setLoading(true)
      const res = await adminCabsService.getAll({ page, limit: 10, search })
      setCabs(res.data.data.cabs || [])
      setPagination(res.data.data.pagination || {})
    } catch {
      setError('Failed to load cabs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this cab?')) return
    try {
      await adminCabsService.delete(id)
      setCabs(cabs.filter(c => c._id !== id))
    } catch {
      setError('Failed to delete cab')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminCabsService.toggleStatus(id)
      setCabs(cabs.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c))
    } catch {
      setError('Failed to update status')
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingCab) {
        await adminCabsService.update(editingCab._id, formData)
        setCabs(cabs.map(c => c._id === editingCab._id ? { ...c, ...formData } : c))
      } else {
        const res = await adminCabsService.create(formData)
        setCabs([res.data.data.cab, ...cabs])
      }
      setShowForm(false)
      setEditingCab(null)
    } catch {
      setError('Failed to save cab')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Cabs</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-base-content/50">
              <span>Total: <strong className="text-base-content">{cabs.length}</strong></span>
              <span>Active: <strong className="text-success">{cabs.filter(c => c.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm gap-2 w-fit" onClick={() => { setEditingCab(null); setShowForm(true) }}>
            <RiAddLine className="w-4 h-4" />
            Add Cab
          </button>
        </div>

        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <RiSearchLine className="w-4 h-4 text-base-content/40" />
          <input
            type="text"
            className="grow"
            placeholder="Search cabs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </label>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading cabs...</p>
          </div>
        ) : cabs.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiTaxiLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No cabs found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                      <th>Cab</th>
                      <th>Type</th>
                      <th>City</th>
                      <th>Base Fare</th>
                      <th>Available</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cabs.map(cab => (
                      <tr key={cab._id} className="hover:bg-base-200/50 transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
                              <RiTaxiLine className="w-4 h-4 text-error" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-base-content">{cab.cabNumber}</p>
                              <p className="text-[11px] text-base-content/50">{cab.operatorName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm text-base-content/60">{cab.type}</td>
                        <td className="text-sm text-base-content/60">{cab.currentCity}</td>
                        <td className="font-semibold text-sm text-base-content">₹{cab.baseFare}</td>
                        <td className="text-sm text-base-content/60">{cab.cabs_available}/{cab.cabs}</td>
                        <td>
                          <span className={`badge badge-sm ${cab.isActive ? 'badge-success' : 'badge-error'}`}>
                            {cab.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button className="btn btn-ghost btn-xs gap-1" onClick={() => { setEditingCab(cab); setShowForm(true) }}>
                              <RiEditLine className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => handleToggleStatus(cab._id)}>
                              {cab.isActive
                                ? <RiToggleFill className="w-4 h-4 text-success" />
                                : <RiToggleLine className="w-4 h-4 text-base-content/40" />
                              }
                            </button>
                            <button className="btn btn-ghost btn-xs text-error hover:bg-error/10" onClick={() => handleDelete(cab._id)}>
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
            <button className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4" onClick={() => { setShowForm(false); setEditingCab(null) }}>✕</button>
            <h3 className="font-bold text-lg mb-5">{editingCab ? 'Edit Cab' : 'Add New Cab'}</h3>
            <CabForm cab={editingCab} onSubmit={handleFormSubmit} onClose={() => { setShowForm(false); setEditingCab(null) }} />
          </div>
          <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditingCab(null) }} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminCabs
