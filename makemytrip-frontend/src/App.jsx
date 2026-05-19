import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from './components/Common/Header'
import Footer from './components/Common/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import HotelsPage from './pages/HotelsPage'
import HotelListingPage from './pages/HotelListingPage'
import HotelDetailsPage from './pages/HotelDetailsPage'
import HotelReviewPage from './pages/HotelReviewPage'
import HotelPaymentPage from './pages/HotelPaymentPage'
import HotelSuccessPage from './pages/HotelSuccessPage'
import TrainsPage from './pages/TrainsPage'
import TrainResultsPage from './pages/TrainResultsPage'
import TrainPassengersPage from './pages/TrainPassengersPage'
import TrainPaymentPage from './pages/TrainPaymentPage'
import TrainSuccessPage from './pages/TrainSuccessPage'
import HolidaysPage from './pages/HolidaysPage'
import HomestaysPage from './pages/HomestaysPage'
import CabsPage from './pages/CabsPage'
import BusesPage from './pages/BusesPage'
import CruisePage from './pages/CruisePage'
import ForexPage from './pages/ForexPage'
import InsurancePage from './pages/InsurancePage'
import ToursPage from './pages/ToursPage'
import VisaPage from './pages/VisaPage'
import MyTrips from './pages/MyTrips'
import Profile from './pages/Profile'
import { AdminProvider } from './context/AdminContext'
import { VendorProvider } from './context/VendorContext'
import { ThemeProvider } from './context/ThemeContext'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import AdminFlights from './pages/AdminFlights'
import AdminHotels from './pages/AdminHotels'
import AdminBuses from './pages/AdminBuses'
import AdminCabs from './pages/AdminCabs'
import AdminBookings from './pages/AdminBookings'
import AdminUsers from './pages/AdminUsers'
import AdminApprovals from './pages/AdminApprovals'
import AdminVendors from './pages/AdminVendors'
import ProtectedAdminRoute from './components/Admin/ProtectedAdminRoute'
import VendorLoginPage from './pages/VendorLoginPage'
import VendorDashboard from './pages/VendorDashboard'
import VendorHotels from './pages/VendorHotels'
import VendorHotelFormPage from './pages/VendorHotelFormPage'
import VendorHotelRooms from './pages/VendorHotelRooms'
import ProtectedVendorRoute from './components/Vendor/ProtectedVendorRoute'

function NotFound() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>404 â€” Page Not Found</h1>
      <p>Sorry, the page you're looking for doesn't exist.</p>
      <a href="/" style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'hsl(var(--p))', color: 'hsl(var(--pc))', textDecoration: 'none', borderRadius: '4px' }}>
        Return to Home
      </a>
    </div>
  )
}

function RouteLoader() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [location])

  if (!isLoading) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .route-loader { animation: spin 1s linear infinite; }
      `}</style>
      <div className="route-loader" style={{
        width: '50px',
        height: '50px',
        border: '4px solid hsl(var(--b2))',
        borderTop: '4px solid hsl(var(--p))',
        borderRadius: '50%'
      }} />
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isVendorRoute = location.pathname.startsWith('/vendor')

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('daisyui-theme') || 'business'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  return (
    <ThemeProvider>
      <AdminProvider>
      <VendorProvider>
      <RouteLoader />
      {!isAdminRoute && !isVendorRoute && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flights/results" element={<SearchResultsPage />} />
        <Route path="/booking/:flightId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/results" element={<HotelListingPage />} />
        <Route path="/hotels/detail/:hotelId" element={<HotelDetailsPage />} />
        <Route path="/hotels/review" element={<ProtectedRoute><HotelReviewPage /></ProtectedRoute>} />
        <Route path="/hotels/payment" element={<ProtectedRoute><HotelPaymentPage /></ProtectedRoute>} />
        <Route path="/hotels/success" element={<ProtectedRoute><HotelSuccessPage /></ProtectedRoute>} />
        <Route path="/trains" element={<TrainsPage />} />
        <Route path="/trains/results" element={<TrainResultsPage />} />
        <Route path="/trains/passengers" element={<ProtectedRoute><TrainPassengersPage /></ProtectedRoute>} />
        <Route path="/trains/payment" element={<ProtectedRoute><TrainPaymentPage /></ProtectedRoute>} />
        <Route path="/trains/success" element={<ProtectedRoute><TrainSuccessPage /></ProtectedRoute>} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/homestays" element={<HomestaysPage />} />
        <Route path="/cabs" element={<CabsPage />} />
        <Route path="/buses" element={<BusesPage />} />
        <Route path="/cruise" element={<CruisePage />} />
        <Route path="/forex" element={<ForexPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/visa" element={<VisaPage />} />
        <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/admin/flights" element={<ProtectedAdminRoute><AdminFlights /></ProtectedAdminRoute>} />
        <Route path="/admin/hotels" element={<ProtectedAdminRoute><AdminHotels /></ProtectedAdminRoute>} />
        <Route path="/admin/buses" element={<ProtectedAdminRoute><AdminBuses /></ProtectedAdminRoute>} />
        <Route path="/admin/cabs" element={<ProtectedAdminRoute><AdminCabs /></ProtectedAdminRoute>} />
        <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
        <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
        <Route path="/admin/vendors" element={<ProtectedAdminRoute><AdminVendors /></ProtectedAdminRoute>} />
        <Route path="/admin/approvals" element={<ProtectedAdminRoute><AdminApprovals /></ProtectedAdminRoute>} />

        <Route path="/vendor/login" element={<VendorLoginPage />} />
        <Route path="/vendor/dashboard" element={<ProtectedVendorRoute><VendorDashboard /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels" element={<ProtectedVendorRoute><VendorHotels /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels/create" element={<ProtectedVendorRoute><VendorHotelFormPage /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels/:id/edit" element={<ProtectedVendorRoute><VendorHotelFormPage /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels/:hotelId/rooms" element={<ProtectedVendorRoute><VendorHotelRooms /></ProtectedVendorRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminRoute && !isVendorRoute && <Footer />}
      </VendorProvider>
    </AdminProvider>
    </ThemeProvider>
  )
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic',
      offset: 80,
    })
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--b1))',
            color: 'hsl(var(--bc))',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px'
          },
          success: {
            duration: 3000,
            style: {
              background: 'hsl(var(--su))',
              color: 'hsl(var(--pc))'
            }
          },
          error: {
            duration: 4000,
            style: {
              background: 'hsl(var(--er))',
              color: 'hsl(var(--pc))'
            }
          }
        }}
      />
      <AppContent />
    </BrowserRouter>
  )
}

export default App






