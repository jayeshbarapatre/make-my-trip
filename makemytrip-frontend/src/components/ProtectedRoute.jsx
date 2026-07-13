import { Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const auth = useContext(AuthContext)

  // If auth context not available, redirect to login
  if (!auth) {
    return <Navigate to="/login" replace />
  }

  // While loading, show loading state
  if (auth.loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Loading...</div>
    </div>
  }

  // If no user and loading is done, redirect to login
  if (!auth.user) {
    return <Navigate to="/login" replace />
  }

  // User is logged in, show protected content
  return children
}
