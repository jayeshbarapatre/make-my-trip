import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import { useTheme } from '../../context/ThemeContext'
import { adminAuthService, adminService } from '../../services/adminService'
import './AdminHeader.css'

const AdminHeader = ({ toggleSidebar }) => {
  const { admin, logout } = useAdmin()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', new: '' })
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: '' })
  const [pendingBusesCount, setPendingBusesCount] = useState(0)
  const [pendingCabsCount, setPendingCabsCount] = useState(0)
  const [pendingHotelsCount, setPendingHotelsCount] = useState(0)
  const [pendingFlightsCount, setPendingFlightsCount] = useState(0)
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)
  const navigate = useNavigate()

  const getPageName = () => {
    const pathMap = {
      '/admin/dashboard': 'Dashboard',
      '/admin/flights': 'Flights',
      '/admin/hotels': 'Hotels',
      '/admin/buses': 'Buses',
      '/admin/cabs': 'Cabs',
      '/admin/bookings': 'Bookings',
      '/admin/users': 'Users',
      '/admin/approvals': 'Hotel Approvals',
      '/admin/flight-approvals': 'Flight Approvals',
      '/admin/bus-approvals': 'Bus Approvals',
      '/admin/cab-approvals': 'Cab Approvals'
    }
    return pathMap[location.pathname] || 'Admin'
  }

  useEffect(() => {
    const fetchPendingNotifications = async () => {
      try {
        const [busRes, cabRes, hotelRes, flightRes] = await Promise.all([
          adminService.getPendingBuses(),
          adminService.getPendingCabs(),
          adminService.getPendingHotels(),
          adminService.getPendingFlights()
        ])
        const buses = busRes.data?.data?.buses || []
        const cabs = cabRes.data?.data?.cabs || []
        const hotels = hotelRes.data?.data?.hotels || []
        const flights = flightRes.data?.data?.flights || []
        
        setPendingBusesCount(buses.length)
        setPendingCabsCount(cabs.length)
        setPendingHotelsCount(hotels.length)
        setPendingFlightsCount(flights.length)
      } catch (err) {
        console.error('Failed to fetch pending notifications', err)
      }
    }
    
    if (admin) {
      fetchPendingNotifications()
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [admin])

  const handleNotificationClick = (path) => {
    setNotificationOpen(false);
    navigate(path);
  };

  const totalNotifications = pendingBusesCount + pendingCabsCount + pendingHotelsCount + pendingFlightsCount;

  return (
    <header className="admin-header">
      <button className="menu-toggle" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>

      <div className="header-search">
        <div className="search-wrapper">
          <i className="fas fa-search search-icon"></i>
          <input type="text" className="form-control form-control-fill search-input" placeholder="Search anything..." />
        </div>
      </div>

      <div className="header-right">

        {/* Notifications */}
        <div className="notification-container" ref={notificationRef}>
          <button
            className="notification-btn"
            onClick={() => setNotificationOpen(!notificationOpen)}
          >
            <i className="fas fa-bell"></i>
            {totalNotifications > 0 && <span className="notification-badge">{totalNotifications}</span>}
          </button>

          {notificationOpen && (
            <div className="notification-panel">
              <div className="notification-header">
                <h3>Notifications</h3>
                <button className="close-btn" onClick={() => setNotificationOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="notification-tabs">
                <button className="tab-btn active">All</button>
              </div>

              <div className="notification-list">
                {pendingHotelsCount > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('/admin/approvals')} style={{ cursor: 'pointer' }}>
                    <div className="notification-icon" style={{ background: 'var(--warning)', color: 'white' }}>
                      <i className="fas fa-building"></i>
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">Pending Hotel Approvals</p>
                      <p className="notification-time">You have {pendingHotelsCount} new hotel listing(s) awaiting approval.</p>
                    </div>
                  </div>
                )}
                {pendingFlightsCount > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('/admin/flight-approvals')} style={{ cursor: 'pointer' }}>
                    <div className="notification-icon" style={{ background: 'var(--warning)', color: 'white' }}>
                      <i className="fas fa-plane"></i>
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">Pending Flight Approvals</p>
                      <p className="notification-time">You have {pendingFlightsCount} new flight listing(s) awaiting approval.</p>
                    </div>
                  </div>
                )}
                {pendingBusesCount > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('/admin/bus-approvals')} style={{ cursor: 'pointer' }}>
                    <div className="notification-icon" style={{ background: 'var(--warning)', color: 'white' }}>
                      <i className="fas fa-bus"></i>
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">Pending Bus Approvals</p>
                      <p className="notification-time">You have {pendingBusesCount} new bus listing(s) awaiting approval.</p>
                    </div>
                  </div>
                )}
                {pendingCabsCount > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('/admin/cab-approvals')} style={{ cursor: 'pointer' }}>
                    <div className="notification-icon" style={{ background: 'var(--warning)', color: 'white' }}>
                      <i className="fas fa-taxi"></i>
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">Pending Cab Approvals</p>
                      <p className="notification-time">You have {pendingCabsCount} new cab listing(s) awaiting approval.</p>
                    </div>
                  </div>
                )}
                {totalNotifications === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--bc) / 0.6)' }}>
                    No new notifications
                  </div>
                )}
              </div>

              <button className="view-all-btn">View All Notifications</button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button className="theme-toggle-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <i className="fas fa-moon"></i> : <i className="fas fa-sun"></i>}
        </button>

        {/* Admin Dropdown */}
        <div className="admin-dropdown-container" ref={dropdownRef}>
          <div
            className="admin-info-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="admin-avatar">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="admin-text">
              <span className="admin-name">{admin?.name || 'Admin'}</span>
              <span className="admin-role">Administrator</span>
            </div>
            <i className={`dropdown-arrow fas ${dropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
          </div>

          {dropdownOpen && (
            <div className="admin-dropdown-menu">
              <div className="dropdown-header">
                <strong>{admin?.name || 'Admin User'}</strong>
                <span>{admin?.email || 'admin@makemytrip.com'}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item">
                <i className="icon fas fa-user"></i> Profile
              </button>
              <button className="dropdown-item">
                <i className="icon fas fa-cog"></i> Account Settings
              </button>
              <button className="dropdown-item">
                <i className="icon fas fa-shield-alt"></i> Security
              </button>
              <button className="dropdown-item" onClick={() => {
                setShowPasswordModal(true)
                setDropdownOpen(false)
              }}>
                <i className="icon fas fa-key"></i> Change Password
              </button>
              <button className="dropdown-item">
                <i className="icon fas fa-question-circle"></i> Help Center
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={logout}>
                <i className="icon fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <h3>Change Password</h3>
            {passwordStatus.error && <p className="error-text">{passwordStatus.error}</p>}
            {passwordStatus.success && <p className="success-text">{passwordStatus.success}</p>}

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.current}
                onChange={e => setPasswordData({...passwordData, current: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.new}
                onChange={e => setPasswordData({...passwordData, new: e.target.value})}
              />
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordStatus({ loading: false, error: '', success: '' })
                  setPasswordData({ current: '', new: '' })
                }}
              >Cancel</button>
              <button
                className="save-btn"
                disabled={passwordStatus.loading}
                onClick={async () => {
                  if (!passwordData.current || !passwordData.new) {
                    return setPasswordStatus({ ...passwordStatus, error: 'All fields required' })
                  }
                  try {
                    setPasswordStatus({ loading: true, error: '', success: '' })
                    await adminAuthService.changePassword(passwordData.current, passwordData.new)
                    setPasswordStatus({ loading: false, error: '', success: 'Password changed successfully!' })
                    setTimeout(() => {
                      setShowPasswordModal(false)
                      setPasswordStatus({ loading: false, error: '', success: '' })
                      setPasswordData({ current: '', new: '' })
                    }, 1500)
                  } catch (err) {
                    setPasswordStatus({ loading: false, error: err.response?.data?.message || 'Failed to change password', success: '' })
                  }
                }}
              >
                {passwordStatus.loading ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default AdminHeader
