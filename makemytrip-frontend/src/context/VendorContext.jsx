import { createContext, useContext, useState, useEffect } from 'react'
import { vendorAuthService } from '../services/vendorService'
import { useToastContext } from './ToastContext'

const VendorContext = createContext()

export const VendorProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('vendorToken'))
  // Same reasoning as AdminContext: without this, the first render looks
  // unauthenticated and every vendor deep link bounces through the login page.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('vendorToken')))
  const [error, setError] = useState(null)
  const toast = useToastContext()

  const verifyVendor = async () => {
    try {
      setLoading(true)
      const response = await vendorAuthService.getProfile()
      setVendor(response.data.data.vendor)
    } catch (_err) {
      localStorage.removeItem('vendorToken')
      setToken(null)
      setVendor(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && !vendor) {
      verifyVendor()
    }
  }, [token])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      const response = await vendorAuthService.login(email, password)
      const { vendor, token } = response.data.data
      setVendor(vendor)
      setToken(token)
      localStorage.setItem('vendorToken', token)
      toast.success("Vendor logged in successfully", "Congratulations")
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
      await vendorAuthService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setVendor(null)
      setToken(null)
      localStorage.removeItem('vendorToken')
      toast.success("Vendor logged out successfully", "See you soon!")
    }
  }


  const value = {
    vendor,
    token,
    isAuthenticated: !!vendor && !!token,
    loading,
    error,
    login,
    logout,
    verifyVendor
  }

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  )
}

export const useVendor = () => {
  const context = useContext(VendorContext)
  if (!context) {
    throw new Error('useVendor must be used within VendorProvider')
  }
  return context
}
