import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import VendorSidebar from './VendorSidebar'
import VendorHeader from './VendorHeader'
import './VendorLayout.css'

const VendorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, accentColor } = useTheme()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="vendor-layout" data-theme={theme} style={{ '--accent': accentColor }}>
      <VendorSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="vendor-main">
        <VendorHeader toggleSidebar={toggleSidebar} />
        <main className="vendor-content">
          <div className="vendor-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default VendorLayout
