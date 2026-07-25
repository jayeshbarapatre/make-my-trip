import { Navigate } from 'react-router-dom'
import { useVendor } from '../../context/VendorContext'

const ProtectedVendorRoute = ({ children }) => {
  const { isAuthenticated, loading } = useVendor()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: 'hsl(var(--nc))' }}>Loading...</div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/vendor/login" replace />
}

export default ProtectedVendorRoute
