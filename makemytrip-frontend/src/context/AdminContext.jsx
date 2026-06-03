import { createContext, useContext, useState, useEffect } from 'react'
import { adminAuthService } from '../services/adminService'
import { useToastContext } from './ToastContext'

const AdminContext = createContext()

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const toast = useToastContext()

  useEffect(() => {
    if (token && !admin) {
      verifyAdmin()
    }
  }, [token])

  const verifyAdmin = async () => {
    try {
      setLoading(true)
      const response = await adminAuthService.getProfile()
      setAdmin(response.data.data.admin)
    } catch (err) {
      localStorage.removeItem('adminToken')
      setToken(null)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAuthService.login(email, password)
      const { admin, token } = response.data.data
      setAdmin(admin)
      setToken(token)
      localStorage.setItem('adminToken', token)
      toast.success("Admin logged in successfully", "Congratulations")
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await adminAuthService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setAdmin(null)
      setToken(null)
      localStorage.removeItem('adminToken')
      toast.success("Admin logged out successfully", "See you soon!")
    }
  }


  const value = {
    admin,
    token,
    isAuthenticated: !!admin && !!token,
    loading,
    error,
    login,
    logout,
    verifyAdmin
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}

