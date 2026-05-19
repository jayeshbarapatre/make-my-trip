import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useVendor } from '../../context/VendorContext'
import { useTheme } from '../../context/ThemeContext'
import './VendorHeader.css'

const VendorHeader = ({ toggleSidebar }) => {
  const { vendor } = useVendor()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const getPageName = () => {
    const pathMap = {
      '/vendor/dashboard': 'Dashboard',
      '/vendor/hotels': 'My Hotels',
      '/vendor/bookings': 'Bookings'
    }
    return pathMap[location.pathname] || 'Vendor Panel'
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="vendor-header">
      <button className="menu-toggle" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>

      <div className="greeting-section">
        <h2 className="greeting">{getPageName()}</h2>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        <div className="user-profile" ref={dropdownRef}>
          <button
            className="profile-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="vendor-avatar-header">
              {vendor?.name?.charAt(0).toUpperCase() || 'V'}
            </div>
            <span className="vendor-name-header">{vendor?.name || 'Vendor'}</span>
            <i className={`fas fa-chevron-down ${dropdownOpen ? 'open' : ''}`}></i>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <span className="vendor-email">{vendor?.email}</span>
              </div>
              <hr className="dropdown-divider" />
              <a href="/vendor/settings" className="dropdown-link">
                <i className="fas fa-cog"></i>
                <span>Settings</span>
              </a>
              <a href="/vendor/help" className="dropdown-link">
                <i className="fas fa-question-circle"></i>
                <span>Help & Support</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default VendorHeader
