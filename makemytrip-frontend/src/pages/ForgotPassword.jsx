import { useState } from 'react'
import { authService } from '../services/authService'

export default function ForgotPassword({ onBackToLogin }) {
  const [stage, setStage] = useState(1) // 1: Enter Email, 2: Enter OTP, 3: Reset Password, 4: Success
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')
  const [_message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [simulatedCode, setSimulatedCode] = useState('')

  // 1. Submit email to receive OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid registered email address.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await authService.forgotPassword(email)
      setMessage(res?.message || 'Verification OTP code dispatched successfully!')

      // Save simulated OTP for extremely easy testing/copying!
      if (res?.simulatedOtp) {
        setSimulatedCode(res.simulatedOtp)
      }
      setStage(2)
    } catch (err) {
      console.error('Forgot password error:', err)
      const errorMessage = err?.response?.data?.message ||
                          err?.message ||
                          'No registered user found with this email address.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 2. Submit OTP to verify
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await authService.verifyOtp(email, otp.trim())
      setMessage(res?.message || 'OTP Verified!')
      setStage(3)
    } catch (err) {
      console.error('OTP verification error:', err)
      const errorMessage = err?.response?.data?.message ||
                          err?.message ||
                          'Invalid or expired OTP code. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 3. Reset password credentials
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await authService.resetPassword(email, otp.trim(), password)
      setMessage(res?.message || 'Password updated successfully!')
      setStage(4)
    } catch (err) {
      console.error('Password reset error:', err)
      const errorMessage = err?.response?.data?.message ||
                          err?.message ||
                          'Failed to reset password. OTP may have expired.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      
      {/* ── Stage 1: Request OTP ── */}
      {stage === 1 && (
        <div>
          <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: 'var(--clr-primary-dark)' }}>
            Reset Password
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
            Enter your registered email address and we'll send you a 6-digit OTP verification code.
          </p>

          <form className="login-form-element" onSubmit={handleRequestOtp} noValidate>
            {error && (
              <div className="login-error-card" role="alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="login-input-group">
              <label htmlFor="forgot-email">Registered Email</label>
              <div className="login-input-wrapper">
                <span className="input-icon-left">✉️</span>
                <input
                  id="forgot-email"
                  className="login-input-field"
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => { setError(''); setEmail(e.target.value) }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn btn-primary" disabled={loading}>
              {loading && <div className="login-spinner" />}
              <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── Stage 2: Input Verification Code ── */}
      {stage === 2 && (
        <div>
          <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: 'var(--clr-primary-dark)' }}>
            Enter OTP Code
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
            We sent a verification code to <strong>{email}</strong>. Please enter it below.
          </p>

          {simulatedCode && (
            <div style={{
              background: 'hsl(var(--p) / 0.08)',
              border: '1px solid hsl(var(--p) / 0.15)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12.5px',
              color: 'hsl(var(--p))',
              marginBottom: '16px',
              fontWeight: 600
            }}>
              💡 Simulated Test OTP (Sent to Console): <strong style={{ fontSize: '14px', letterSpacing: '1px' }}>{simulatedCode}</strong>
            </div>
          )}

          <form className="login-form-element" onSubmit={handleVerifyOtp} noValidate>
            {error && (
              <div className="login-error-card" role="alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="login-input-group">
              <label htmlFor="forgot-otp">6-Digit Verification OTP</label>
              <div className="login-input-wrapper">
                <span className="input-icon-left">🔑</span>
                <input
                  id="forgot-otp"
                  className="login-input-field"
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => { setError(''); setOtp(e.target.value) }}
                  required
                  style={{ letterSpacing: '4px', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn btn-primary" disabled={loading}>
              {loading && <div className="login-spinner" />}
              <span>{loading ? 'Verifying...' : 'Verify OTP Code'}</span>
            </button>
          </form>
          
          <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '16px', color: 'hsl(var(--bc) / 0.55)' }}>
            Didn't receive code?{' '}
            <button
              onClick={handleRequestOtp}
              style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', fontWeight: 700, cursor: 'pointer' }}
            >
              Resend OTP
            </button>
          </p>
        </div>
      )}

      {/* ── Stage 3: Define New Password ── */}
      {stage === 3 && (
        <div>
          <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: 'var(--clr-primary-dark)' }}>
            Reset Password
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
            OTP verified successfully! Please enter your new password below.
          </p>

          <form className="login-form-element" onSubmit={handleResetPassword} noValidate>
            {error && (
              <div className="login-error-card" role="alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="login-input-group">
              <label htmlFor="reset-new">New Password</label>
              <div className="login-input-wrapper">
                <span className="input-icon-left">🔒</span>
                <input
                  id="reset-new"
                  className="login-input-field"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => { setError(''); setPassword(e.target.value) }}
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="reset-confirm">Confirm New Password</label>
              <div className="login-input-wrapper">
                <span className="input-icon-left">🔒</span>
                <input
                  id="reset-confirm"
                  className="login-input-field"
                  type="password"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => { setError(''); setConfirmPassword(e.target.value) }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn btn-primary" disabled={loading}>
              {loading && <div className="login-spinner" />}
              <span>{loading ? 'Updating Password...' : 'Save & Update Password'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── Stage 4: Success Confirmation ── */}
      {stage === 4 && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900, color: 'hsl(var(--su))' }}>
            Password Reset Success!
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>
            Your account credentials have been updated securely. You can now log in using your new password.
          </p>

          <button onClick={onBackToLogin} className="login-submit-btn btn-primary" style={{ background: 'hsl(var(--su))', boxShadow: 'none' }}>
            Sign In Now
          </button>
        </div>
      )}

      {stage < 4 && (
        <p className="form-footer-action">
          Remember credentials?
          <button className="form-footer-switch-btn" onClick={onBackToLogin}>
            Sign In here
          </button>
        </p>
      )}

    </div>
  )
}
