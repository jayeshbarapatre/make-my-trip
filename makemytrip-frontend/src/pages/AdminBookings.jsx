import { useState } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import { RiCalendarCheckLine, RiEyeLine, RiCheckLine, RiCloseLine } from 'react-icons/ri'

const AdminBookings = () => {
  const [bookings] = useState([
    { id: '1', userName: 'John Doe',   email: 'john@example.com',  type: 'Flight', amount: 5000, status: 'Confirmed', date: '2026-05-10' },
    { id: '2', userName: 'Jane Smith', email: 'jane@example.com',  type: 'Hotel',  amount: 8000, status: 'Pending',   date: '2026-05-11' },
  ])

  const statusBadge = (status) => {
    const map = {
      Confirmed: 'badge-success',
      Pending:   'badge-warning',
      Cancelled: 'badge-error',
    }
    return map[status] || 'badge-neutral'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Bookings</h2>
            <p className="text-sm text-base-content/50 mt-0.5">View and manage all platform bookings</p>
          </div>
          <div className="badge badge-primary badge-lg">{bookings.length} total</div>
        </div>

        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-xs text-base-content/50 uppercase tracking-wider bg-base-200">
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-base-200/50 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="w-8 rounded-full bg-base-300 text-base-content text-xs font-bold">
                            <span>{b.userName.charAt(0)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-base-content">{b.userName}</p>
                          <p className="text-[11px] text-base-content/50">{b.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline badge-sm">{b.type}</span>
                    </td>
                    <td className="font-semibold text-sm text-base-content">₹{b.amount.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-sm ${statusBadge(b.status)}`}>{b.status}</span>
                    </td>
                    <td className="text-xs text-base-content/50">{b.date}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-ghost btn-xs gap-1">
                          <RiEyeLine className="w-3.5 h-3.5" /> View
                        </button>
                        <button className="btn btn-ghost btn-xs text-success hover:bg-success/10 gap-1">
                          <RiCheckLine className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1">
                          <RiCloseLine className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminBookings
