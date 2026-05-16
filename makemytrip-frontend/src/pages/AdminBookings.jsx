import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import './AdminFlights.css'

const AdminBookings = () => {
  const [bookings] = useState([
    {
      id: '1',
      userName: 'John Doe',
      email: 'john@example.com',
      type: 'Flight',
      amount: 5000,
      status: 'Confirmed',
      date: '2026-05-10'
    },
    {
      id: '2',
      userName: 'Jane Smith',
      email: 'jane@example.com',
      type: 'Hotel',
      amount: 8000,
      status: 'Pending',
      date: '2026-05-11'
    }
  ])

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <h1>Bookings Management</h1>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking.id}>
                  <td className="font-bold">{booking.userName}</td>
                  <td>{booking.email}</td>
                  <td>{booking.type}</td>
                  <td>₹{booking.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${booking.status === 'Confirmed' ? 'badge-active' : 'badge-inactive'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>{booking.date}</td>
                  <td className="actions">
                    <button className="btn-sm btn-edit">✎ View</button>
                    <button className="btn-sm btn-toggle">✓ Confirm</button>
                    <button className="btn-sm btn-delete">✕ Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminBookings
