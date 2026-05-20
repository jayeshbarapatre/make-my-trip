import { useState, useEffect } from 'react'
import VendorSidebar from './VendorSidebar'
import VendorHeader from './VendorHeader'

const VendorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('app-theme') || 'light'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <div className="min-h-screen bg-base-200">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <VendorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <VendorHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default VendorLayout
