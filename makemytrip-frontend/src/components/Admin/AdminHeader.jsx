import { useState, useRef, useEffect } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { adminAuthService } from '../../services/adminService'
import './AdminHeader.css'

const AdminHeader = ({ toggleSidebar }) => {
  const { admin, logout } = useAdmin()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', new: '' })
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: '', success: '' })
  const dropdownRef = useRef(null)

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
    <header className="admin-header">
      <button className="menu-toggle" onClick={toggleSidebar}>☰</button>
      <h1 className="page-title">Admin Dashboard</h1>
      
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
            <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
          </div>
        </div>

        {dropdownOpen && (
          <div className="admin-dropdown-menu">
            <div className="dropdown-header">
              <strong>{admin?.name || 'Admin User'}</strong>
              <span>{admin?.email || 'admin@makemytrip.com'}</span>
            </div>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={() => {
              setShowPasswordModal(true)
              setDropdownOpen(false)
            }}>
              <span className="icon">🔑</span> Change Password
            </button>
            <button className="dropdown-item" onClick={logout}>
              <span className="icon">🚪</span> Logout
            </button>
          </div>
        )}
      </div>

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
