import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendor } from '../context/VendorContext'
import './VendorLoginPage.css'

const VendorLoginPage = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading, error } = useVendor()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/vendor/dashboard')
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
    <div className="vendor-login-container">
      <div className="vendor-login-card">
        <div className="login-header">
          <h1 className="login-title">MakeMyTrip Vendor</h1>
          <p className="login-subtitle">Vendor Portal</p>
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
              placeholder="vendor@makemytrip.com"
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
            {loading ? 'Logging in...' : 'Login to Vendor Panel'}
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

export default VendorLoginPage
