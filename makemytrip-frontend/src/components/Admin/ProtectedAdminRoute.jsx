import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAdmin()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: 'hsl(var(--nc))' }}>Loading...</div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" replace />
}

export default ProtectedAdminRoute
