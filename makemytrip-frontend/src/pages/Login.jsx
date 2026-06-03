import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

export default function Login({ onSwitchTab, onForgotPassword }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (k) => (e) => {
    setError('')
    setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  const validate = () => {
    if (!form.email.trim()) {
      setError('Please enter your email address or mobile number.')
      return false
    }
    // Check if it's an email or a phone
    const isEmail = form.email.includes('@')
    const isPhone = /^[0-9+() -]+$/.test(form.email) && form.email.trim().length >= 10

    if (!isEmail && !isPhone) {
      setError('Please enter a valid email address or 10-digit mobile number.')
      return false
    }
    if (!form.password || form.password.length < 6) {
      setError('Please enter your password (minimum 6 characters).')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')
    try {
      const userData = await login(form.email, form.password)
      if (userData?.is_admin) {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error('Login error:', err)
      const errorMessage = err?.response?.data?.message ||
                          err?.message ||
                          'Invalid credentials. Please verify your email and password.'
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <form className="login-form-element" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="login-error-card" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="login-input-group">
          <label htmlFor="login-email">Email / Mobile Number</label>
          <div className="login-input-wrapper">
            <span className="input-icon-left">✉️</span>
            <input
              id="login-email"
              className="login-input-field"
              type="text"
              placeholder="Enter email or mobile number"
              value={form.email}
              onChange={handleChange('email')}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div className="login-input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label htmlFor="login-password">Password</label>
            <button
              type="button"
              className="forgot-password-link"
              onClick={onForgotPassword}
              style={{ fontSize: '11.5px', marginBottom: '6px' }}
            >
              Forgot Password?
            </button>
          </div>
          <div className="login-input-wrapper">
            <span className="input-icon-left">🔒</span>
            <input
              id="login-password"
              className="login-input-field"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange('password')}
              required
              autoComplete="current-password"
              style={{ paddingRight: '48px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'rgba(0,53,128,0.4)',
                fontWeight: 'bold',
                userSelect: 'none'
              }}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="login-submit-btn btn-primary"
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          {loading && <div className="login-spinner" />}
          <span>{loading ? 'Verifying session...' : 'Sign In Securely'}</span>
        </button>
      </form>

      <p className="form-footer-action">
        New to MakeMyTrip?
        <button className="form-footer-switch-btn" onClick={() => onSwitchTab('Register')}>
          Create an Account
        </button>
      </p>
    </div>
  )
}
