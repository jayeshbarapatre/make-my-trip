import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { clearSession } from '../services/api'
import { useToastContext } from './ToastContext'

// Login, registration and OTP verification all return the same credential
// envelope, so persisting it lives in one place. The refresh token is the part
// that keeps a session alive now that access tokens are short-lived — dropping
// it on any one of these paths would silently log the user out an hour later.
function persistSession({ user, token, refreshToken }) {
  localStorage.setItem('token', token)
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
  localStorage.setItem('userId', user.id)
  localStorage.setItem('userEmail', user.email)
}

// Reads locally-saved profile for a mobile OTP user
function getMobileProfile(phone) {
  try {
    const all = JSON.parse(localStorage.getItem('mmt_mobile_profiles') || '{}')
    return all[phone] || null
  } catch { return null }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToastContext()

  // Auto-authenticate user on load if token is found
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const profile = await authService.getProfile()
          if (profile && profile.data) {
            let userData = profile.data.user
            // Restore locally-saved name/email for mobile OTP users
            if (userData?.phone) {
              const saved = getMobileProfile(userData.phone)
              if (saved?.name) userData = { ...userData, ...saved }
            }
            setUser(userData)
          } else {
            localStorage.removeItem('token')
          }
        } catch (err) {
          console.warn('Session restore failed:', err)
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }
    restoreSession()
  }, [])

  // Raised by the api interceptor when a refresh fails — the session was
  // revoked (logout elsewhere, password reset, suspension) or simply expired.
  // Without this the UI keeps rendering a signed-in user whose every request
  // now 401s.
  useEffect(() => {
    const onExpired = () => {
      setUser(null)
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      toast.info('Please sign in again to continue.', 'Session ended')
    }
    window.addEventListener('auth:session-expired', onExpired)
    return () => window.removeEventListener('auth:session-expired', onExpired)
  }, [toast])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      if (res && res.data) {
        const { user: userData, token, refreshToken } = res.data
        persistSession({ user: userData, token, refreshToken })
        setUser(userData)
        toast.success("You have successfully logged in", "Congratulations")
        return userData
      }
      throw new Error('Invalid login payload returned from server.')
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      const res = await authService.register(userData)
      if (res && res.data) {
        const { user: newUser, token, refreshToken } = res.data
        persistSession({ user: newUser, token, refreshToken })
        setUser(newUser)
        toast.success("You have successfully registered", "Congratulations")
        return newUser
      }
      throw new Error('Registration succeeded but did not return credential tokens.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtpLogin = async (phone, otp) => {
    setLoading(true)
    try {
      const res = await authService.verifyMobileOtp(phone, otp)
      if (res && res.data) {
        const { user: userData, token, refreshToken } = res.data
        persistSession({ user: userData, token, refreshToken })
        // Merge any locally-saved name/email for this phone number
        const saved = getMobileProfile(phone)
        const mergedUser = saved?.name ? { ...userData, ...saved } : userData
        setUser(mergedUser)
        toast.success("You have successfully logged in", "Congratulations")
        return mergedUser
      }
      throw new Error('Invalid OTP login payload.')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Swallowing logout error in case token already expired on server
    } finally {
      // Logout is now server-authoritative — the call above ends the session.
      // This only clears the local copy.
      clearSession()
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      setUser(null)
      toast.success("You have successfully logged out", "See you soon!")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, verifyOtpLogin, setUser }}>

      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be executed within an AuthProvider wrapper.')
  return ctx
}

