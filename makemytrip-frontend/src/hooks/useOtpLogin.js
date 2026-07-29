import { useState, useRef, useCallback, useEffect } from 'react'
import { authService } from '../services/authService'

/**
 * Drives the whole mobile/email OTP login flow: send, resend cooldown,
 * verification, and every user-facing status message.
 *
 * Status values: idle | sending | sent | verifying | verified | error
 */
export const useOtpLogin = ({ onVerified, channel = 'sms' } = {}) => {
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState(null)
  const [expiresInMinutes, setExpiresInMinutes] = useState(null)

  const timerRef = useRef(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startCooldown = useCallback((seconds) => {
    stopTimer()
    setCooldown(seconds)
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          stopTimer()
          return 0
        }
        return c - 1
      })
    }, 1000)
  }, [stopTimer])

  useEffect(() => stopTimer, [stopTimer])

  const reset = useCallback(() => {
    stopTimer()
    setOtp('')
    setStatus('idle')
    setMessage('')
    setError('')
    setCooldown(0)
    setAttemptsRemaining(null)
  }, [stopTimer])

  const isValidIdentifier = channel === 'sms'
    ? /^\d{10}$/.test(identifier.replace(/\D/g, ''))
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)

  const sendOtp = useCallback(async (isResend = false) => {
    if (!isValidIdentifier) {
      setError(channel === 'sms'
        ? 'Enter a valid 10-digit mobile number.'
        : 'Enter a valid email address.')
      setStatus('error')
      return false
    }

    setError('')
    setStatus('sending')
    setMessage(isResend ? 'Resending code…' : 'Sending code…')

    try {
      const send = channel === 'sms'
        ? (isResend ? authService.resendMobileOtp : authService.sendMobileOtp)
        : (isResend ? authService.resendEmailOtp : authService.sendEmailOtp)

      const res = await send(identifier)
      const data = res?.data || {}

      setStatus('sent')
      setMessage(res?.message || 'Verification code sent.')
      setExpiresInMinutes(data.expiresInMinutes ?? null)
      setAttemptsRemaining(null)
      setOtp('')
      startCooldown(data.resendAfterSeconds || 30)
      return true
    } catch (err) {
      const body = err?.response?.data || {}
      setStatus('error')
      setError(body.message || err.message || 'Could not send the verification code.')
      // The server dictates how long to wait after a throttle.
      if (body.retryAfter) startCooldown(body.retryAfter)
      return false
    }
  }, [identifier, isValidIdentifier, channel, startCooldown])

  const verifyOtp = useCallback(async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your message.')
      return false
    }

    setError('')
    setStatus('verifying')
    setMessage('Verifying…')

    try {
      const verify = channel === 'sms' ? authService.verifyMobileOtp : authService.verifyEmailOtp
      const res = await verify(identifier, otp)

      setStatus('verified')
      setMessage('Verified — signing you in…')
      stopTimer()

      await onVerified?.(res?.data, identifier)
      return true
    } catch (err) {
      const body = err?.response?.data || {}
      setStatus('sent')
      setError(body.message || err.message || 'Verification failed.')

      if (typeof body.attemptsRemaining === 'number') {
        setAttemptsRemaining(body.attemptsRemaining)
      }
      // These states are unrecoverable — the user must request a new code.
      if (['OTP_EXPIRED', 'OTP_TOO_MANY_ATTEMPTS', 'OTP_NOT_FOUND', 'OTP_ALREADY_USED'].includes(body.code)) {
        setCooldown(0)
        stopTimer()
      }
      setOtp('')
      return false
    }
  }, [otp, identifier, channel, onVerified, stopTimer])

  return {
    identifier, setIdentifier,
    otp, setOtp,
    status, message, error,
    cooldown, attemptsRemaining, expiresInMinutes,
    isValidIdentifier,
    isSending: status === 'sending',
    isVerifying: status === 'verifying',
    otpSent: ['sent', 'verifying', 'verified'].includes(status),
    canResend: cooldown === 0 && status !== 'sending' && status !== 'verifying',
    sendOtp,
    verifyOtp,
    reset
  }
}

export default useOtpLogin
