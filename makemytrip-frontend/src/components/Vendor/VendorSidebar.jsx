import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useVendor } from '../../context/VendorContext'
import './VendorSidebar.css'

const VendorSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { vendor, logout } = useVendor()

  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/vendor/dashboard', label: 'Dashboard', icon: 'fas fa-th-large' }
      ]
    },
    {
      title: 'MY PROPERTY',
      items: [
        { path: '/vendor/hotels', label: 'My Hotels', icon: 'fas fa-hotel' },
        { path: '/vendor/flights', label: 'My Flights', icon: 'fas fa-plane' },
        { path: '/vendor/buses', label: 'My Buses', icon: 'fas fa-bus' }
      ]
    },
    {
      title: 'BOOKINGS',
      items: [
        { path: '/vendor/bookings', label: 'Bookings', icon: 'fas fa-calendar-check' }
      ]
    }
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    await logout()
    navigate('/vendor/login')
  }

  return (
    <>
      <div className={`vendor-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`vendor-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <div className="vendor-logo-badge">My</div>
            <div className="vendor-logo-text">
              <span className="vendor-logo-brand">MakeMyTrip</span>
              <span className="vendor-logo-sub">Vendor</span>
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
          <div className="vendor-user-info">
            <div className="vendor-avatar-small">
              {vendor?.name?.charAt(0).toUpperCase() || 'V'}
            </div>
            <div>
              <div className="vendor-name-small">{vendor?.name || 'Vendor'}</div>
              <div className="vendor-role">
                {vendor?.vendorType === 'flight' ? 'Flight Vendor' : vendor?.vendorType === 'bus' ? 'Bus Vendor' : vendor?.vendorType === 'multi' ? 'Multi-Service' : 'Hotel Vendor'}
              </div>
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

export default VendorSidebar
