import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout as reduxLogout } from '../../store/reducers/authReducer'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../hooks/useToast'
import ThemeSwitcher from './ThemeSwitcher'
import '../../styles/Hero.css'
import '../../styles/Header.css'

export default function Header() {
  const navigate = useNavigate()
  const { user: contextUser, logout: contextLogout } = useAuth()
  const { user: reduxUser } = useSelector((s) => s.auth)
  const user = contextUser || reduxUser
  const dispatch = useDispatch()
  const toast = useToast()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isMobileUser = user && (user.name?.startsWith('Traveller_') || (!user.name && user.phone))
  const displayName = user
    ? isMobileUser
      ? `+91 ${user.phone}`
      : `Hi, ${user.name?.split(' ')[0] || 'User'}`
    : null
  const avatarText = user
    ? isMobileUser
      ? '📱'
      : (user.name?.slice(0, 2).toUpperCase() || '?')
    : null

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
      toast.success('See you soon! Logged out successfully 👋')
      setTimeout(() => {
        navigate('/')
      }, 500)
    } catch (e) {
      console.error(e)
      toast.error('Failed to logout. Please try again.')
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

        {/* Right side items (My Trips, Support, Theme, Lang, Login) */}
        <div className="common-header-right">
          <span className="header-right-link" style={{ fontSize: '13px', cursor: 'pointer' }} onClick={() => navigate('/my-trips')}>My Trips</span>
          <span className="header-right-link" style={{ fontSize: '13px', cursor: 'pointer' }} onClick={() => alert('Opening Support assistant...!')}>Support</span>

          <ThemeSwitcher />

          <div className="header-lang-select">
            <span>🇮🇳</span>
            <span>EN / INR</span>
            <span>▾</span>
          </div>

          {user ? (
            <div ref={dropdownRef} className="common-user-container" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="common-user-avatar" title={user.name || user.phone} style={{ background: isMobileUser ? '#0ea5e9' : undefined }}>
                {avatarText}
              </div>
              <div className="common-user-details" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                <span className="common-user-name" style={{ fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {displayName}
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
                    background: 'hsl(var(--b1))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px hsla(var(--b2) / 0.2)',
                    border: '1px solid hsl(var(--b3))',
                    minWidth: '220px',
                    padding: '8px 0',
                    zIndex: 1500,
                    display: 'flex',
                    flexDirection: 'column',
                    textShadow: 'none'
                  }}
                >
                  {/* Login method indicator */}
                  <div style={{ padding: '10px 20px 6px', borderBottom: '1px solid hsl(var(--b3))', marginBottom: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {isMobileUser ? '📱 Logged in via Mobile' : '📧 Logged in via Email'}
                    </div>
                    <div style={{ fontSize: '13px', color: 'hsl(var(--bc))', fontWeight: 800, marginTop: '2px' }}>
                      {isMobileUser ? `+91 ${user.phone}` : (user.email || user.name)}
                    </div>
                  </div>

                  {/* Complete Profile prompt for mobile users */}
                  {isMobileUser && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate('/profile'); }}
                      style={{ padding: '10px 20px', background: 'hsl(var(--w) / 0.1)', color: 'hsl(var(--w))', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderBottom: '1px solid hsl(var(--b3))' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--w) / 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'hsl(var(--w) / 0.1)'}
                    >
                      ✏️ Complete your Profile
                      <span style={{ marginLeft: 'auto', background: 'hsl(var(--w))', color: 'hsl(var(--b1))', borderRadius: '10px', padding: '1px 8px', fontSize: '10px', fontWeight: 800 }}>NEW</span>
                    </div>
                  )}

                  <div
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate('/profile'); }}
                    style={{ padding: '12px 20px', color: 'hsl(var(--bc))', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--b2))'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    👤 My Profile
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate('/my-trips'); }}
                    style={{ padding: '12px 20px', color: 'hsl(var(--bc))', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--b2))'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    🧳 My Trips
                  </div>
                  <div style={{ borderTop: '1px solid hsl(var(--b3))', margin: '4px 0' }} />
                  <div
                    onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); handleLogout(); }}
                    style={{ padding: '12px 20px', color: 'hsl(var(--er))', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--er) / 0.1)'}
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
