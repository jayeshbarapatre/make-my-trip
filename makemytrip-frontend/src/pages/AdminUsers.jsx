import { useState, useEffect } from 'react'
import AdminLayout from '../components/Admin/AdminLayout'
import './AdminFlights.css'

const AdminUsers = () => {
  const [users] = useState([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      bookings: 3,
      joinDate: '2026-01-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '9876543211',
      bookings: 5,
      joinDate: '2026-02-20'
    }
  ])

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="page-header">
          <h1>Users Management</h1>
        </div>

        <div className="search-bar">
          <input type="text" placeholder="Search users by name or email..." />
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Bookings</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="font-bold">{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.bookings}</td>
                  <td>{user.joinDate}</td>
                  <td className="actions">
                    <button className="btn-sm btn-edit">✎ View</button>
                    <button className="btn-sm btn-delete">🗑️ Delete</button>
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

export default AdminUsers
