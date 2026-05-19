import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

export default function Signup({ onSwitchTab }) {
  const navigate = useNavigate()
  const { register } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (k) => (e) => {
    setError('')
    setForm(prev => ({ ...prev, [k]: e.target.value }))
  }

  // Password strength logic
  const pwdStrength = useMemo(() => {
    const p = form.password
    if (!p) return { label: '', color: 'hsl(var(--b3))', width: '0%', text: '' }
    
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[a-z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++

    if (score <= 2) return { label: 'Weak', color: 'hsl(var(--er))', width: '33%', text: 'Too simple' }
    if (score <= 4) return { label: 'Medium', color: 'hsl(var(--wa))', width: '66%', text: 'Satisfactory' }
    return { label: 'Strong', color: 'hsl(var(--su))', width: '100%', text: 'Highly Secure!' }
  }, [form.password])

  const validate = () => {
    if (!form.name.trim() || form.name.trim().split(' ').length < 1) {
      setError('Please enter your full name (First and Last name).')
      return false
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return false
    }
    if (!form.phone.trim() || form.phone.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return false
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return false
    }
    if (form.password !== form.confirmPassword) {
      setError('Confirm password does not match your entered password.')
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
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      })
      toast.success(`Welcome, ${form.name}! 🚀 Your account has been created successfully.`)
      setTimeout(() => {
        navigate('/')
      }, 500)
    } catch (err) {
      console.error('Registration error:', err)
      const errorMessage = err?.response?.data?.message ||
                          err?.message ||
                          'Failed to register account. User might already exist.'
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
          <label htmlFor="reg-name">Full Name</label>
          <div className="login-input-wrapper">
            <span className="input-icon-left">👤</span>
            <input
              id="reg-name"
              className="login-input-field"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={handleChange('name')}
              required
            />
          </div>
        </div>

        <div className="login-input-group">
          <label htmlFor="reg-email">Email Address</label>
          <div className="login-input-wrapper">
            <span className="input-icon-left">✉️</span>
            <input
              id="reg-email"
              className="login-input-field"
              type="email"
              placeholder="rahul@example.com"
              value={form.email}
              onChange={handleChange('email')}
              required
            />
          </div>
        </div>

        <div className="login-input-group">
          <label htmlFor="reg-phone">Mobile Number</label>
          <div className="login-input-wrapper">
            <span className="input-icon-left">📞</span>
            <input
              id="reg-phone"
              className="login-input-field"
              type="tel"
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={handleChange('phone')}
              maxLength={10}
              required
            />
          </div>
        </div>

        <div className="login-input-group">
          <label htmlFor="reg-password">Password</label>
          <div className="login-input-wrapper">
            <span className="input-icon-left">🔒</span>
            <input
              id="reg-password"
              className="login-input-field"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange('password')}
              required
            />
          </div>

          {/* Strength Bar */}
          {form.password && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'hsl(var(--bc) / 0.55)' }}>
                <span>Strength: <strong>{pwdStrength.label}</strong></span>
                <span>{pwdStrength.text}</span>
              </div>
              <div style={{ height: '4px', background: 'hsl(var(--b3))', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pwdStrength.width, background: pwdStrength.color, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>

        <div className="login-input-group">
          <label htmlFor="reg-confirm">Confirm Password</label>
          <div className="login-input-wrapper">
            <span className="input-icon-left">🔒</span>
            <input
              id="reg-confirm"
              className="login-input-field"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="login-submit-btn btn-primary"
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          {loading && <div className="login-spinner" />}
          <span>{loading ? 'Registering account...' : 'Create My Account'}</span>
        </button>
      </form>

      <p className="form-footer-action">
        Already registered?
        <button className="form-footer-switch-btn" onClick={() => onSwitchTab('Login')}>
          Sign In here
        </button>
      </p>
    </div>
  )
}
