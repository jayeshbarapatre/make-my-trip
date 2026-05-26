import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { adminUsersService } from '../services/adminService'
import Icons from '../utils/icons'
import toast from 'react-hot-toast'
import './AdminUsers.css'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const fetchUsers = useCallback(async (q = search, p = page) => {
    try {
      setLoading(true)
      const res = await adminUsersService.getAll({ search: q, page: p, limit: 15 })
      const data = res.data?.data
      setUsers(data?.users || [])
      setTotal(data?.total || 0)
      setTotalPages(data?.totalPages || 1)
    } catch (err) {
      toast.error('Failed to load users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchUsers()
  }, [page])

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
      fetchUsers(searchInput, 1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const openDetail = async (user) => {
    setSelectedUser(user)
    setDetailLoading(true)
    try {
      const res = await adminUsersService.getById(user.id)
      setUserDetail(res.data?.data)
    } catch {
      toast.error('Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await adminUsersService.delete(deleteTarget.id)
      toast.success(`User "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setTotal(prev => prev - 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const getBookingTypeBadge = (type) => {
    const map = {
      flight: { color: '#3b82f6', icon: 'fa-plane', label: 'Flight' },
      hotel: { color: '#f59e0b', icon: 'fa-hotel', label: 'Hotel' },
      train: { color: '#10b981', icon: 'fa-train', label: 'Train' },
      bus: { color: '#8b5cf6', icon: 'fa-bus', label: 'Bus' },
      cab: { color: '#f97316', icon: 'fa-taxi', label: 'Cab' },
    }
    return map[type] || { color: '#6b7280', icon: 'fa-ticket-alt', label: type }
  }

  return (
    <AdminLayout>
      <div className="admin-users-page">

        {/* Page Header */}
        <div className="users-page-header">
          <div>
            <h1 className="users-title">User Management</h1>
            <p className="users-subtitle">
              {loading ? 'Loading...' : `${total.toLocaleString()} registered user${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="users-search-bar">
          <div className="users-search-wrap">
            <i className="fas fa-search users-search-icon" />
            <input
              type="text"
              className="users-search-input"
              placeholder="Search by name, email, or phone..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="users-search-clear" onClick={() => setSearchInput('')}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="users-table-wrap">
          {loading ? (
            <div className="users-loading">
              <i className="fas fa-spinner fa-spin" />
              <span>Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="users-empty">
              <i className="fas fa-users" />
              <h3>No users found</h3>
              <p>{searchInput ? `No results for "${searchInput}"` : 'No registered users yet'}</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Bookings</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} className="users-table-row">
                    <td className="users-idx">{(page - 1) * 15 + idx + 1}</td>
                    <td>
                      <div className="users-info">
                        <div className="users-avatar">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="users-name">{user.name}</div>
                          <div className="users-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="users-phone">{user.phone || '—'}</td>
                    <td>
                      <span className="users-booking-badge">
                        <i className="fas fa-ticket-alt" />
                        {user._count?.bookings ?? 0}
                      </span>
                    </td>
                    <td className="users-date">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="users-actions">
                        <button
                          className="users-btn users-btn-view"
                          title="View Details"
                          onClick={() => openDetail(user)}
                        >
                          {Icons.eye({ size: 14 })} View
                        </button>
                        <button
                          className="users-btn users-btn-delete"
                          title="Delete User"
                          onClick={() => setDeleteTarget(user)}
                        >
                          {Icons.delete({ size: 14 })} Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="users-pagination">
            <button
              className="users-page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <i className="fas fa-chevron-left" /> Prev
            </button>
            <span className="users-page-info">Page {page} of {totalPages}</span>
            <button
              className="users-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="users-modal-overlay" onClick={() => { setSelectedUser(null); setUserDetail(null) }}>
            <div className="users-modal" onClick={e => e.stopPropagation()}>
              <div className="users-modal-header">
                <div className="users-modal-avatar">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="users-modal-name">{selectedUser.name}</h2>
                  <p className="users-modal-email">{selectedUser.email}</p>
                </div>
                <button className="users-modal-close" onClick={() => { setSelectedUser(null); setUserDetail(null) }}>
                  <i className="fas fa-times" />
                </button>
              </div>

              <div className="users-modal-body">
                {detailLoading ? (
                  <div className="users-modal-loading">
                    <i className="fas fa-spinner fa-spin" /> Loading details...
                  </div>
                ) : userDetail ? (
                  <>
                    {/* User Meta */}
                    <div className="users-meta-grid">
                      <div className="users-meta-item">
                        <span className="users-meta-label">Phone</span>
                        <span className="users-meta-value">{userDetail.phone || '—'}</span>
                      </div>
                      <div className="users-meta-item">
                        <span className="users-meta-label">Joined</span>
                        <span className="users-meta-value">
                          {new Date(userDetail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="users-meta-item">
                        <span className="users-meta-label">Total Bookings</span>
                        <span className="users-meta-value users-meta-highlight">{userDetail.bookings?.length ?? 0}</span>
                      </div>
                    </div>

                    {/* Booking History */}
                    <h3 className="users-bookings-heading">Recent Bookings</h3>
                    {userDetail.bookings?.length === 0 ? (
                      <p className="users-no-bookings">No bookings yet</p>
                    ) : (
                      <div className="users-bookings-list">
                        {userDetail.bookings.map(b => {
                          const badge = getBookingTypeBadge(b.type)
                          return (
                            <div key={b.id} className="users-booking-row">
                              <span className="users-booking-type-badge" style={{ background: badge.color + '22', color: badge.color }}>
                                <i className={`fas ${badge.icon}`} /> {badge.label}
                              </span>
                              <div className="users-booking-route">
                                <span>{b.fromCity}</span>
                                <i className="fas fa-arrow-right" style={{ fontSize: '10px', opacity: 0.5 }} />
                                <span>{b.toCity}</span>
                              </div>
                              <span className="users-booking-date">{b.departureDate}</span>
                              <span className={`users-booking-status users-booking-status-${b.status}`}>{b.status}</span>
                              <span className="users-booking-amount">₹{b.totalAmount?.toLocaleString('en-IN')}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="users-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
            <div className="users-confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="users-confirm-icon">
                <i className="fas fa-trash-alt" />
              </div>
              <h3>Delete User?</h3>
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will also delete all their bookings and cannot be undone.</p>
              <div className="users-confirm-actions">
                <button
                  className="users-confirm-cancel"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="users-confirm-delete"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? <><i className="fas fa-spinner fa-spin" /> Deleting...</> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  )
}

export default AdminUsers
