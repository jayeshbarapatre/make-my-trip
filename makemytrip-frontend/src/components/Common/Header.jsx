// The main top-bar is rendered inside HeroSearch on HomePage.
// This thin sticky header only shows on inner pages (search results, booking, login).
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout as reduxLogout } from '../../store/reducers/authReducer'
import { useAuth } from '../../context/AuthContext'
import '../../styles/Hero.css' // Reuse typography and basic styling

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user: contextUser, logout: contextLogout } = useAuth()
  const { user: reduxUser } = useSelector((s) => s.auth)
  const user = contextUser || reduxUser
  const dispatch = useDispatch()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      if (contextLogout) await contextLogout()
      dispatch(reduxLogout())
    } catch (e) {
      console.error(e)
    } finally {
      navigate('/')
    }
  }

  return (
    <header className="common-sticky-header">
      <div className="common-header-inner">
        
        {/* image1 style premium logo branding */}
        <Link to="/" className="common-header-logo">
          <div className="mmt-logo-badge">My</div>
          <div className="mmt-logo-text">
            <span className="mmt-logo-brand">MakeMyTrip</span>
            <span className="mmt-logo-sub">India's No. 1 Travel Co.</span>
          </div>
        </Link>

        {/* Right side items (My Trips, Support, Flag dropdown, Login) */}
        <div className="common-header-right">
          <span className="header-right-link" style={{ fontSize: '13px', cursor: 'pointer' }} onClick={() => navigate('/my-trips')}>My Trips</span>
          <span className="header-right-link" style={{ fontSize: '13px', cursor: 'pointer' }} onClick={() => alert('Opening Support assistant...!')}>Support</span>
          
          <div className="header-lang-select">
            <span>🇮🇳</span>
            <span>EN / INR</span>
            <span>▾</span>
          </div>

          {user ? (
            <div ref={dropdownRef} className="common-user-container" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="common-user-avatar" title={user.name || user.phone}>
                {user.name ? user.name.slice(0, 2).toUpperCase() : '👤'}
              </div>
              <div className="common-user-details" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                <span className="common-user-name" style={{ color: '#fff', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {user.name ? `Hi, ${user.name.split(' ')[0]}` : `+91 ${user.phone}`}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center' }}>▼</span>
              </div>

              {dropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '50px',
                    right: 0,
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    border: '1px solid #e2e8f0',
                    minWidth: '200px',
                    padding: '8px 0',
                    zIndex: 1500,
                    display: 'flex',
                    flexDirection: 'column',
                    textShadow: 'none'
                  }}
                >
                  <div
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate('/profile'); }}
                    style={{ padding: '12px 20px', color: '#0f172a', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    👤 My Profile
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate('/my-trips'); }}
                    style={{ padding: '12px 20px', color: '#0f172a', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🧳 My Trips
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
                  <div
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); handleLogout(); }}
                    style={{ padding: '12px 20px', color: '#eb2026', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🚪 Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="common-login-btn" onClick={() => navigate('/login')}>
              Login / Sign up
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
