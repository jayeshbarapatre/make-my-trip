import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import './AdminSidebar.css'

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAdmin()

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/flights', label: 'Flights', icon: '✈️' },
    { path: '/admin/hotels', label: 'Hotels', icon: '🏨' },
    { path: '/admin/buses', label: 'Buses', icon: '🚌' },
    { path: '/admin/cabs', label: 'Cabs', icon: '🚕' },
    { path: '/admin/bookings', label: 'Bookings', icon: '📋' },
    { path: '/admin/users', label: 'Users', icon: '👥' }
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <>
      <div className={`admin-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <div className="admin-logo-badge">My</div>
            <div className="admin-logo-text">
              <span className="admin-logo-brand">MakeMyTrip</span>
              <span className="admin-logo-sub">Admin</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={toggleSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
