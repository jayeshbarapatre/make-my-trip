import { useAdmin } from '../../context/AdminContext'
import './AdminHeader.css'

const AdminHeader = ({ toggleSidebar }) => {
  const { admin } = useAdmin()

  return (
    <header className="admin-header">
      <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
      <h1 className="page-title">Admin Dashboard</h1>
      <div className="admin-info">
        <span className="admin-name">{admin?.name || 'Admin'}</span>
        <span className="admin-role">{admin?.role || 'admin'}</span>
      </div>
    </header>
  )
}

export default AdminHeader
