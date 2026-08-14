import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { FaEnvelope, FaLock, FaArrowLeft, FaUserShield } from 'react-icons/fa'
import DemoCredentials from '../components/DemoCredentials'
import './AdminLoginPage.css'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading, error } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    setLocalError('')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')

    if (!email || !password) {
      setLocalError('Please fill in all fields')
      return
    }

    const result = await login(email, password)
    if (!result.success) {
      setLocalError(result.message)
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <Link to="/" className="back-to-home-link">
          <FaArrowLeft className="back-icon" />
          <span>Back to Home</span>
        </Link>

        <div className="login-header">
          <div className="portal-icon-wrapper">
            <FaUserShield className="portal-icon" />
          </div>
          <h1 className="login-title">TripOra Admin</h1>
          <p className="login-subtitle">Admin Portal</p>
        </div>

        <DemoCredentials
          label="Demo admin account"
          email={import.meta.env.VITE_DEMO_ADMIN_EMAIL}
          password={import.meta.env.VITE_DEMO_ADMIN_PASSWORD}
          onFill={(e, p) => { setEmail(e); setPassword(p); setLocalError('') }}
        />

        {(error || localError) && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <p>{error || localError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FaEnvelope className="input-field-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@makemytrip.com"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FaLock className="input-field-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </button>
        </form>
      </div>

      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
    </div>
  )
}

export default AdminLoginPage

