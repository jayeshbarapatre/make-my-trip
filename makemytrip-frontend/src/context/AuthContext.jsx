import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

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
            setUser(profile.data.user)
          } else {
            // Bad or expired session
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
        setUser(userData)
        return userData
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
