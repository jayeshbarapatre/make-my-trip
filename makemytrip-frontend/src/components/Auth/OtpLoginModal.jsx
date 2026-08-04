import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useOtpLogin } from '../../hooks/useOtpLogin'
import './OtpLoginModal.css'

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' }

/**
 * Shared login modal for pages that gate booking behind an account.
 *
 * Offers mobile OTP and email/password side by side. Email is not a nicety:
 * when SMS_PROVIDER has no credentials the server rejects every OTP request,
 * and the modal used to offer no other way in — it told the customer to "sign
 * in with email instead" while showing only a phone field.
 */
export default function OtpLoginModal ({
  open,
  onClose,
  onSuccess,
  title = 'Login to Continue',
  subtitle = 'Enter your mobile number and we will text you a verification code.'
}) {
  const { verifyOtpLogin, login, register } = useAuth()

  const [mode, setMode] = useState('sms')          // 'sms' | 'email'
  const [emailView, setEmailView] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState(EMPTY_FORM)
  const [emailError, setEmailError] = useState('')
  const [busy, setBusy] = useState(false)

  const otpFlow = useOtpLogin({
    channel: 'sms',
    onVerified: async () => {
      const user = await verifyOtpLogin(otpFlow.identifier, otpFlow.otp)
      onSuccess?.(user)
    }
  })

  const {
    identifier, setIdentifier, otp, setOtp,
    status, message, error, cooldown, attemptsRemaining,
    expiresInMinutes, isValidIdentifier,
    isSending, isVerifying, otpSent, canResend,
    sendOtp, verifyOtp, reset
  } = otpFlow

  useEffect(() => {
    if (open) return
    reset()
    setMode('sms')
    setEmailView('login')
    setForm(EMPTY_FORM)
    setEmailError('')
  }, [open, reset])

  if (!open) return null

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submitEmail = async (e) => {
    e.preventDefault()
    setEmailError('')
    setBusy(true)
    try {
      const user = emailView === 'login'
        ? await login(form.email.trim(), form.password)
        : await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password
        })
      onSuccess?.(user)
    } catch (err) {
      setEmailError(
        err?.response?.data?.message ||
        err?.message ||
        (emailView === 'login' ? 'Could not sign you in.' : 'Could not create your account.')
      )
    } finally {
      setBusy(false)
    }
  }

  const statusBanner = () => {
    if (error) return <div className="otp-banner otp-banner--error" role="alert">{error}</div>
    if (status === 'sending') return <div className="otp-banner otp-banner--info">Sending OTP…</div>
    if (status === 'verifying') return <div className="otp-banner otp-banner--info">Verifying OTP…</div>
    if (status === 'verified') return <div className="otp-banner otp-banner--success">OTP verified — signing you in…</div>
    if (status === 'sent') return <div className="otp-banner otp-banner--success">{message}</div>
    return null
  }

  const headSubtitle = mode === 'email'
    ? (emailView === 'login'
      ? 'Sign in with your email and password.'
      : 'Create an account to continue booking.')
    : otpSent
      ? `We sent a 6-digit code to +91 ${identifier}.`
      : subtitle

  return (
    <div className="otp-modal-overlay" onClick={onClose}>
      <div className="otp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <button className="otp-modal__close" onClick={onClose} aria-label="Close">×</button>

        <div className="otp-modal__head">
          <span className="otp-modal__icon" aria-hidden="true">🔐</span>
          <h3>{title}</h3>
          <p>{headSubtitle}</p>
        </div>

        {mode === 'sms' ? (
          <>
            {statusBanner()}

            {!otpSent ? (
              <form onSubmit={(e) => { e.preventDefault(); sendOtp(false) }}>
                <div className="otp-field">
                  <label htmlFor="otp-phone">MOBILE NUMBER</label>
                  <div className="otp-phone">
                    <span className="otp-phone__cc">+91</span>
                    <input
                      id="otp-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="otp-btn otp-btn--primary" disabled={!isValidIdentifier || isSending}>
                  {isSending ? 'Sending OTP…' : 'Get OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); verifyOtp() }}>
                <div className="otp-field">
                  <div className="otp-field__head">
                    <label htmlFor="otp-code">ENTER 6-DIGIT OTP</label>
                    <button type="button" className="otp-link" onClick={reset}>Change number</button>
                  </div>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="otp-code-input"
                    autoFocus
                    required
                  />
                  <div className="otp-meta">
                    {expiresInMinutes && <span>Code expires in {expiresInMinutes} min</span>}
                    {attemptsRemaining !== null && (
                      <span className="otp-meta--warn">{attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} left</span>
                    )}
                  </div>
                </div>

                <button type="submit" className="otp-btn otp-btn--primary" disabled={otp.length !== 6 || isVerifying}>
                  {isVerifying ? 'Verifying…' : 'Verify & Continue'}
                </button>

                <button
                  type="button"
                  className="otp-btn otp-btn--ghost"
                  onClick={() => sendOtp(true)}
                  disabled={!canResend}
                >
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
                </button>
              </form>
            )}

            <div className="otp-meta">
              <button type="button" className="otp-link" onClick={() => { setMode('email'); setEmailError('') }}>
                Sign in with email instead
              </button>
            </div>
          </>
        ) : (
          <>
            {emailError && <div className="otp-banner otp-banner--error" role="alert">{emailError}</div>}

            <form onSubmit={submitEmail}>
              {emailView === 'register' && (
                <div className="otp-field">
                  <label htmlFor="auth-name">FULL NAME</label>
                  <input
                    id="auth-name"
                  className="otp-input"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={setField('name')}
                    autoFocus
                    required
                  />
                </div>
              )}

              <div className="otp-field">
                <label htmlFor="auth-email">EMAIL</label>
                <input
                  id="auth-email"
                  className="otp-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={setField('email')}
                  autoFocus={emailView === 'login'}
                  required
                />
              </div>

              {emailView === 'register' && (
                <div className="otp-field">
                  <label htmlFor="auth-phone">MOBILE NUMBER</label>
                  <div className="otp-phone">
                    <span className="otp-phone__cc">+91</span>
                    <input
                      id="auth-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="otp-field">
                <label htmlFor="auth-password">PASSWORD</label>
                <input
                  id="auth-password"
                  className="otp-input"
                  type="password"
                  autoComplete={emailView === 'login' ? 'current-password' : 'new-password'}
                  placeholder={emailView === 'login' ? 'Your password' : 'At least 6 characters'}
                  value={form.password}
                  onChange={setField('password')}
                  minLength={6}
                  required
                />
              </div>

              <button type="submit" className="otp-btn otp-btn--primary" disabled={busy}>
                {busy
                  ? (emailView === 'login' ? 'Signing in…' : 'Creating account…')
                  : (emailView === 'login' ? 'Sign In & Continue' : 'Create Account & Continue')}
              </button>
            </form>

            <div className="otp-meta">
              <button
                type="button"
                className="otp-link"
                onClick={() => { setEmailView(emailView === 'login' ? 'register' : 'login'); setEmailError('') }}
              >
                {emailView === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
              </button>
              <button type="button" className="otp-link" onClick={() => { setMode('sms'); setEmailError('') }}>
                Use mobile OTP
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
