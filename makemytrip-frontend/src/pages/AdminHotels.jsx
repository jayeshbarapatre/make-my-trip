import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminHotelsService } from '../services/adminService'
import HotelForm from '../components/Admin/HotelForm'
import Icons from '../utils/icons'
import './AdminFlights.css'
import { useConfirm } from '../context/ConfirmContext'

const PAGE_SIZE = 10

const AdminHotels = () => {
  const confirm = useConfirm()
  const [allHotels, setAllHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingHotel, setEditingHotel] = useState(null)

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const response = await adminHotelsService.getAll()
      setAllHotels(response.data.data?.hotels ?? [])
      setError('')
    } catch (_err) {
      setError('Failed to load hotels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHotels() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allHotels
    return allHotels.filter(h =>
      (h.name ?? '').toLowerCase().includes(q) ||
      (h.city ?? '').toLowerCase().includes(q) ||
      (h.location ?? '').toLowerCase().includes(q)
    )
  }, [allHotels, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1) }

  const handleDelete = async (id) => {
    if (await confirm({ title: 'Delete this hotel?', message: 'The property is removed from search. This cannot be undone.', confirmLabel: 'Delete', tone: 'danger' })) {
      try {
        await adminHotelsService.delete(id)
        setAllHotels(prev => prev.filter(h => h.id !== id))
      } catch (_err) {
        setError('Failed to delete hotel')
      }
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminHotelsService.toggleStatus(id)
      setAllHotels(prev => prev.map(h => h.id === id ? { ...h, isActive: !h.isActive } : h))
    } catch (_err) {
      setError('Failed to update status')
    }
  }

  const handleEdit = (hotel) => { setEditingHotel(hotel); setEditingId(hotel.id); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditingId(null); setEditingHotel(null) }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingId) {
        const response = await adminHotelsService.update(editingId, formData)
        const saved = response.data.data.hotel
        setAllHotels(prev => prev.map(h => h.id === editingId ? saved : h))
      } else {
        const response = await adminHotelsService.create(formData)
        setAllHotels(prev => [response.data.data.hotel, ...prev])
      }
      handleCloseForm()
    } catch (_err) {
      setError('Failed to save hotel')
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1>Hotels Management</h1>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: 'hsl(var(--bc) / 0.55)' }}>
              <span>📊 Total: <strong style={{ color: 'hsl(var(--bc))' }}>{allHotels.length}</strong></span>
              <span>✅ Active: <strong style={{ color: 'hsl(var(--su))' }}>{allHotels.filter(h => h.isActive).length}</strong></span>
              <span>⛔ Inactive: <strong style={{ color: 'hsl(var(--er))' }}>{allHotels.filter(h => !h.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icons.plus({ size: 16 })} Add New Hotel
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search hotels by name, city or location..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <HotelForm key={editingHotel?.id ?? 'new'} hotel={editingHotel} onSubmit={handleFormSubmit} onClose={handleCloseForm} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container">Loading hotels...</div>
        ) : paginated.length === 0 ? (
          <div className="empty-state"><p>{search ? 'No hotels match your search.' : 'No hotels found. Create your first hotel!'}</p></div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hotel Name</th>
                    <th>City</th>
                    <th>Rating</th>
                    <th>Price/Night</th>
                    <th>Rooms</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(hotel => (
                    <tr key={hotel.id}>
                      <td className="font-bold">{hotel.name}</td>
                      <td>{hotel.city}</td>
                      <td>&#9733; {hotel.rating}</td>
                      <td>&#8377;{(hotel.pricePerNight ?? hotel.price ?? 0).toLocaleString()}</td>
                      <td>{hotel.roomsAvailable ?? '—'}/{hotel.rooms ?? '—'}</td>
                      <td>
                        <span className={`badge ${hotel.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {hotel.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn-sm btn-edit" onClick={() => handleEdit(hotel)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            {Icons.edit({ size: 14 })} Edit
                          </button>
                          <button className="btn-sm btn-toggle" onClick={() => handleToggleStatus(hotel.id)} title={hotel.isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {hotel.isActive ? Icons.toggleOn({ size: 14 }) : Icons.toggleOff({ size: 14 })}
                          </button>
                          <button className="btn-sm btn-delete" onClick={() => handleDelete(hotel.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
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
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} hotel{filtered.length !== 1 ? 's' : ''}
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

export default AdminHotels
