import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useOtpLogin } from '../../hooks/useOtpLogin'
import './OtpLoginModal.css'

/**
 * Shared mobile-OTP login modal. Replaces the copy of this flow that used to
 * live inline in every page that gates booking behind a login.
 */
export default function OtpLoginModal ({
  open,
  onClose,
  onSuccess,
  title = 'Login to Continue',
  subtitle = 'Enter your mobile number and we will text you a verification code.'
}) {
  const { verifyOtpLogin } = useAuth()

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
    if (!open) reset()
  }, [open, reset])

  if (!open) return null

  const statusBanner = () => {
    if (error) return <div className="otp-banner otp-banner--error" role="alert">{error}</div>
    if (status === 'sending') return <div className="otp-banner otp-banner--info">Sending OTP…</div>
    if (status === 'verifying') return <div className="otp-banner otp-banner--info">Verifying OTP…</div>
    if (status === 'verified') return <div className="otp-banner otp-banner--success">OTP verified — signing you in…</div>
    if (status === 'sent') {
      return <div className="otp-banner otp-banner--success">{message}</div>
    }
    return null
  }

  return (
    <div className="otp-modal-overlay" onClick={onClose}>
      <div className="otp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <button className="otp-modal__close" onClick={onClose} aria-label="Close">×</button>

        <div className="otp-modal__head">
          <span className="otp-modal__icon" aria-hidden="true">🔐</span>
          <h3>{title}</h3>
          <p>{otpSent
            ? `We sent a 6-digit code to +91 ${identifier}.`
            : subtitle}</p>
        </div>

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
      </div>
    </div>
  )
}
