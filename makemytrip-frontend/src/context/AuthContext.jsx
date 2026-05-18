import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

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

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      if (res && res.data) {
        const { user: userData, token } = res.data
        localStorage.setItem('token', token)
        setUser(userData)
        return userData
      }
      throw new Error('Invalid login payload returned from server.')
    } catch (err) {
      // Re-throw the error so the Login component can display it
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      const res = await authService.register(userData)
      if (res && res.data) {
        const { user: newUser, token } = res.data
        localStorage.setItem('token', token)
        setUser(newUser)
        return newUser
      }
      throw new Error('Registration succeeded but did not return credential tokens.')
    } catch (err) {
      // Re-throw the error so the Signup component can display it
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyOtpLogin = async (phone, otp) => {
    setLoading(true)
    try {
      const res = await authService.verifyMobileOtp(phone, otp)
      if (res && res.data) {
        const { user: userData, token } = res.data
        localStorage.setItem('token', token)
        // Merge any locally-saved name/email for this phone number
        const saved = getMobileProfile(phone)
        const mergedUser = saved?.name ? { ...userData, ...saved } : userData
        setUser(mergedUser)
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
      localStorage.removeItem('token')
      setUser(null)
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

