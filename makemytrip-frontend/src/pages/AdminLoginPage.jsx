import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import './AdminLoginPage.css'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading, error } = useAdmin()
  const [email, setEmail] = useState('admin@makemytrip.com')
  const [password, setPassword] = useState('admin123')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard')
    }
  }, [isAuthenticated, navigate])

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
        <div className="login-header">
          <h1 className="login-title">MakeMyTrip Admin</h1>
          <p className="login-subtitle">Admin Portal</p>
        </div>

        {(error || localError) && (
          <div className="error-alert">
            <span>⚠️</span>
            <p>{error || localError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@makemytrip.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-credentials">Demo Credentials:</p>
          <p className="demo-text">Email: jayesh@yopmail.com</p>
          <p className="demo-text">Password: User@123</p>
        </div>
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
