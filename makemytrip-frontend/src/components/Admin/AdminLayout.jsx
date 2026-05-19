import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import ThemeBuilderPanel from './ThemeBuilderPanel'
import './AdminLayout.css'

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, accentColor } = useTheme()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="admin-layout" data-theme={theme} style={{ '--accent': accentColor }}>
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="admin-main">
        <AdminHeader toggleSidebar={toggleSidebar} />
        <main className="admin-content">
          <div className="admin-container">
            {children}
          </div>
        </main>
      </div>
      <ThemeBuilderPanel />
    </div>
  )
}

export default AdminLayout
