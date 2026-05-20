import { useState } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { RiGroupLine, RiSearchLine, RiEyeLine, RiDeleteBinLine } from 'react-icons/ri'

const AdminUsers = () => {
  const [search, setSearch] = useState('')
  const [users] = useState([
    { id: '1', name: 'John Doe',   email: 'john@example.com',  phone: '9876543210', bookings: 3, joinDate: '2026-01-15' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com',  phone: '9876543211', bookings: 5, joinDate: '2026-02-20' },
  ])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Users</h2>
            <p className="text-sm text-base-content/50 mt-0.5">Manage platform users and their activity</p>
          </div>
          <div className="badge badge-primary badge-lg">{users.length} total users</div>
        </div>

        {/* Search */}
        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <RiSearchLine className="w-4 h-4 text-base-content/40" />
          <input
            type="text"
            className="grow"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body flex flex-col items-center justify-center py-20">
              <RiGroupLine className="w-14 h-14 text-base-content/20 mb-3" />
              <p className="font-semibold text-base-content">No users found</p>
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                    <th>User</th>
                    <th>Phone</th>
                    <th>Bookings</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user.id} className="hover:bg-base-200/50 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="w-8 rounded-full bg-base-300 text-base-content text-xs font-bold">
                              <span>{user.name.charAt(0)}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-base-content">{user.name}</p>
                            <p className="text-[11px] text-base-content/50">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-base-content/60">{user.phone}</td>
                      <td>
                        <span className="badge badge-outline badge-sm">{user.bookings}</span>
                      </td>
                      <td className="text-xs text-base-content/50">{user.joinDate}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button className="btn btn-ghost btn-xs gap-1">
                            <RiEyeLine className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1">
                            <RiDeleteBinLine className="w-3.5 h-3.5" />
                            Delete
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
    </AdminLayout>
  )
}

export default AdminUsers
