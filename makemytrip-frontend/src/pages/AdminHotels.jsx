import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminHotelsService } from '../services/adminService'
import HotelForm from '../components/Admin/HotelForm'
import {
  RiHotelLine, RiAddLine, RiSearchLine, RiEditLine,
  RiDeleteBinLine, RiToggleLine, RiToggleFill
} from 'react-icons/ri'

const AdminHotels = () => {
  const [allHotels, setAllHotels] = useState([])
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingHotel, setEditingHotel] = useState(null)

  useEffect(() => { fetchHotels() }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    setHotels(q ? allHotels.filter(h =>
      h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
    ) : allHotels)
  }, [search, allHotels])

  const fetchHotels = async () => {
    try {
      setLoading(true)
      const res = await adminHotelsService.getAll()
      setAllHotels(res.data.data)
      setHotels(res.data.data)
      setError('')
    } catch {
      setError('Failed to load hotels')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hotel?')) return
    try {
      await adminHotelsService.delete(id)
      const updated = allHotels.filter(h => h.id !== id)
      setAllHotels(updated)
      setHotels(updated)
    } catch {
      setError('Failed to delete hotel')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await adminHotelsService.toggleStatus(id)
      const updated = allHotels.map(h => h.id === id ? { ...h, isActive: !h.isActive } : h)
      setAllHotels(updated)
      setHotels(updated)
    } catch {
      setError('Failed to update status')
    }
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingHotel) {
        await adminHotelsService.update(editingHotel.id, formData)
        const updated = allHotels.map(h => h.id === editingHotel.id ? { ...h, ...formData } : h)
        setAllHotels(updated)
        setHotels(updated)
      } else {
        const res = await adminHotelsService.create(formData)
        setAllHotels([res.data.data.hotel, ...allHotels])
        setHotels([res.data.data.hotel, ...hotels])
      }
      setShowForm(false)
      setEditingHotel(null)
    } catch {
      setError('Failed to save hotel')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Hotels</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-base-content/50">
              <span>Total: <strong className="text-base-content">{allHotels.length}</strong></span>
              <span>Active: <strong className="text-success">{allHotels.filter(h => h.isActive).length}</strong></span>
              <span>Inactive: <strong className="text-error">{allHotels.filter(h => !h.isActive).length}</strong></span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm gap-2 w-fit" onClick={() => { setEditingHotel(null); setShowForm(true) }}>
            <RiAddLine className="w-4 h-4" />
            Add Hotel
          </button>
        </div>

        {error && <div className="alert alert-error text-sm py-2">{error}</div>}

        {/* Search */}
        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <RiSearchLine className="w-4 h-4 text-base-content/40" />
          <input
            type="text"
            className="grow"
            placeholder="Search by name or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary mb-3" />
            <p className="text-sm text-base-content/50">Loading hotels...</p>
          </div>
        ) : hotels.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiHotelLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No hotels found</p>
              <p className="text-sm text-base-content/50 mt-1">
                {search ? 'Try a different search term' : 'Add your first hotel to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>Hotel</th>
                    <th>City</th>
                    <th>Rating</th>
                    <th>Price/Night</th>
                    <th>Rooms</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hotels.map(hotel => (
                    <tr key={hotel.id} className="hover:bg-base-200/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <RiHotelLine className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold text-sm text-base-content">{hotel.name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-base-content/60">{hotel.city}</td>
                      <td className="text-sm text-base-content/70">⭐ {hotel.rating}</td>
                      <td className="font-semibold text-sm text-base-content">₹{hotel.pricePerNight?.toLocaleString()}</td>
                      <td className="text-sm text-base-content/60">{hotel.roomsAvailable}/{hotel.rooms}</td>
                      <td>
                        <span className={`badge badge-sm ${hotel.isActive ? 'badge-success' : 'badge-error'}`}>
                          {hotel.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn btn-ghost btn-xs gap-1"
                            onClick={() => { setEditingHotel(hotel); setShowForm(true) }}
                          >
                            <RiEditLine className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs gap-1"
                            onClick={() => handleToggleStatus(hotel.id)}
                            title={hotel.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {hotel.isActive
                              ? <RiToggleFill className="w-4 h-4 text-success" />
                              : <RiToggleLine className="w-4 h-4 text-base-content/40" />
                            }
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1"
                            onClick={() => handleDelete(hotel.id)}
                          >
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

      {/* Hotel Form Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              className="btn btn-ghost btn-xs btn-circle absolute right-4 top-4"
              onClick={() => { setShowForm(false); setEditingHotel(null) }}
            >✕</button>
            <h3 className="font-bold text-lg mb-5">{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</h3>
            <HotelForm
              hotel={editingHotel}
              onSubmit={handleFormSubmit}
              onClose={() => { setShowForm(false); setEditingHotel(null) }}
            />
          </div>
          <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditingHotel(null) }} />
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminHotels
