import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import './AdminSidebar.css'

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, logout } = useAdmin()

  const menuSections = [
    {
      title: 'MAIN MENU',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-home' },
        { path: '/admin/flights', label: 'Flights', icon: 'fas fa-plane' },
        { path: '/admin/hotels', label: 'Hotels', icon: 'fas fa-hotel' }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { path: '/admin/buses', label: 'Buses', icon: 'fas fa-bus' },
        { path: '/admin/cabs', label: 'Cabs', icon: 'fas fa-taxi' },
        { path: '/admin/trains', label: 'Trains', icon: 'fas fa-train' }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/admin/bookings', label: 'Bookings', icon: 'fas fa-calendar-check' },
        { path: '/admin/users', label: 'Users', icon: 'fas fa-users' },
        { path: '/admin/vendors', label: 'Vendors', icon: 'fas fa-store' },
        { path: '/admin/approvals', label: 'Hotel Approvals', icon: 'fas fa-check-circle' },
        { path: '/admin/flight-approvals', label: 'Flight Approvals', icon: 'fas fa-plane' },
        { path: '/admin/bus-approvals', label: 'Bus Approvals', icon: 'fas fa-bus' },
        { path: '/admin/cab-approvals', label: 'Cab Approvals', icon: 'fas fa-taxi' },
        { path: '/admin/train-approvals', label: 'Train Approvals', icon: 'fas fa-train' }
      ]
    }
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
          <button className="sidebar-close" onClick={toggleSidebar}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuSections.map((section, idx) => (
            <div key={idx} className="nav-section">
              <div className="nav-section-label">{section.title}</div>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <i className={`nav-icon ${item.icon}`}></i>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar-small">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <div className="admin-name-small">{admin?.name || 'Admin'}</div>
              <div className="admin-role">Administrator</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
