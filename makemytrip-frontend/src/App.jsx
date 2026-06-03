import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './App.css'
import Header from './components/Common/Header'
import Footer from './components/Common/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import BookingPage from './pages/BookingPage'
import BusSearchResultsPage from './pages/BusSearchResultsPage'
import BusBookingPage from './pages/BusBookingPage'
import CabSearchResultsPage from './pages/CabSearchResultsPage'
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
import FlightsPage from './pages/FlightsPage'
import FlightResultsPage from './pages/FlightResultsPage'
import FlightPassengersPage from './pages/FlightPassengersPage'
import FlightPaymentPage from './pages/FlightPaymentPage'
import FlightSuccessPage from './pages/FlightSuccessPage'
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
import AdminApiHealth from './pages/AdminApiHealth'
import AdminProfile from './pages/AdminProfile'
import AdminSettings from './pages/AdminSettings'
import AdminSecurity from './pages/AdminSecurity'
import AdminHelp from './pages/AdminHelp'
import ProtectedAdminRoute from './components/Admin/ProtectedAdminRoute'
import VendorLoginPage from './pages/VendorLoginPage'
import VendorDashboard from './pages/VendorDashboard'
import VendorHotels from './pages/VendorHotels'
import VendorHotelFormPage from './pages/VendorHotelFormPage'
import VendorHotelRooms from './pages/VendorHotelRooms'
import VendorBuses from './pages/VendorBuses'
import VendorBusForm from './components/Vendor/VendorBusForm'
import VendorCabs from './pages/VendorCabs'
import VendorSettings from './pages/VendorSettings'
import VendorHelp from './pages/VendorHelp'
import AdminBusApprovals from './pages/AdminBusApprovals'
import AdminCabApprovals from './pages/AdminCabApprovals'
import AdminTrains from './pages/AdminTrains'
import ProtectedVendorRoute from './components/Vendor/ProtectedVendorRoute'
import CmsPageRenderer from './pages/CmsPageRenderer'
import FaqPage from './pages/FaqPage'
import SupportPage from './pages/SupportPage'
import CareersPage from './pages/CareersPage'
import ContactPage from './pages/ContactPage'
import CompanyPage from './pages/CompanyPage'
import { cmsService } from './services/cmsService'

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#090d16] to-[#020408] text-white p-6 relative overflow-hidden select-none">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#ed4a29]/8 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1.5deg); }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(10px); }
        }
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
        .cloud-animation {
          animation: cloudFloat 6s ease-in-out infinite;
        }
      `}</style>

      {/* Premium Creative Illustration */}
      <div className="relative w-64 h-64 md:w-72 md:h-72 float-animation flex items-center justify-center mb-6">
        {/* Glowing aura around illustration */}
        <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent rounded-full blur-xl pointer-events-none" />
        
        {/* Hot Air Balloon SVG */}
        <svg viewBox="0 0 200 200" className="w-full h-full text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Clouds in background */}
          <path d="M20 150 C30 150 35 140 40 142 C45 144 50 150 65 150 Z" fill="rgba(255,255,255,0.06)" className="cloud-animation" />
          <path d="M140 80 C148 80 152 75 156 76 C160 77 164 80 176 80 Z" fill="rgba(255,255,255,0.04)" className="cloud-animation" style={{ animationDelay: '1.5s' }} />
          <path d="M110 160 C116 160 120 155 124 156 C128 157 132 160 142 160 Z" fill="rgba(255,255,255,0.08)" className="cloud-animation" style={{ animationDelay: '3s' }} />

          {/* Balloon Envelope */}
          <path d="M100 20 C60 20 40 50 40 85 C40 115 65 135 85 145 L115 145 C135 135 160 115 160 85 C160 50 140 20 100 20 Z" fill="url(#balloonGrad)" />
          
          {/* Stripes */}
          <path d="M85 20.5 C68 35 60 60 62 85 C63 105 73 125 88 143.5" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
          <path d="M115 20.5 C132 35 140 60 138 85 C137 105 127 125 112 143.5" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
          <path d="M100 20 V145" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

          {/* Ropes */}
          <line x1="88" y1="145" x2="92" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
          <line x1="112" y1="145" x2="108" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
          <line x1="100" y1="145" x2="100" y2="160" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />

          {/* Basket */}
          <rect x="91" y="160" width="18" height="12" rx="2" fill="#d97706" />
          <line x1="91" y1="166" x2="109" y2="166" stroke="#b45309" strokeWidth="1" />

          {/* Gradients */}
          <defs>
            <linearGradient id="balloonGrad" x1="100" y1="20" x2="100" y2="145" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff7c60" />
              <stop offset="50%" stopColor="#ed4a29" />
              <stop offset="100%" stopColor="#9a1c02" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Text Info */}
      <div className="z-10 text-center max-w-md px-4">
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 mb-2">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight mb-2">
          Lost in the Clouds
        </h2>
        <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8">
          The page you are looking for has flown off the radar. Let's get you back on track for your next adventure.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/"
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#ed4a29] to-[#ff6b4a] text-white font-semibold rounded-full shadow-lg shadow-[#ed4a29]/20 hover:shadow-[#ed4a29]/35 hover:scale-105 active:scale-95 transition-all duration-200 text-center text-sm tracking-wide"
          >
            Take Me Home
          </a>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-8 py-3 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 font-semibold rounded-full border border-zinc-700/40 hover:scale-105 active:scale-95 transition-all duration-200 text-center text-sm tracking-wide"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Scroll to top on every page navigation ──────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Temporarily disable smooth scrolling so scroll is instant
    document.documentElement.style.scrollBehavior = 'auto'
    document.body.style.scrollBehavior = 'auto'

    // Scroll all possible scroll containers to top
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    // Also scroll the #root element if it has overflow
    const root = document.getElementById('root')
    if (root) root.scrollTop = 0

    // Restore smooth scrolling after a brief delay
    const timer = setTimeout(() => {
      document.documentElement.style.scrollBehavior = ''
      document.body.style.scrollBehavior = ''
    }, 100)
    return () => clearTimeout(timer)
  }, [pathname])
  return null
}

function RouteLoader() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (location.pathname === '/flights/results') {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [location])

  if (!isLoading) return null

  return (
    <div id="loading">
      <div className="loader">
        <div className="plane">
          <img src="/assets/img/preloader/fly.png" className="plane-img" alt="plane" />
        </div>
        <div className="earth-wrapper">
          <div className="earth"></div>
        </div>  
      </div>
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

    // Load theme settings from CMS
    const loadThemeSettings = async () => {
      try {
        const response = await cmsService.getSettings()
        const settings = response.data.data
        if (settings) {
          document.documentElement.style.setProperty('--primary-color', settings.primaryColor || '#003580')
          document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor || '#0F172A')
          document.documentElement.style.setProperty('--accent-color', settings.accentColor || '#1a73e8')
          document.documentElement.style.setProperty('--footer-bg', settings.footerBg || '#003580')
          document.documentElement.style.setProperty('--header-bg', settings.headerBg || '#ffffff')
        }
      } catch (err) {
        console.warn('Could not load theme settings:', err)
      }
    }

    loadThemeSettings()
  }, [])

  return (
    <ThemeProvider>
      <AdminProvider>
      <VendorProvider>
      <ScrollToTop />
      <RouteLoader />
      {!isAdminRoute && !isVendorRoute && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flights/results" element={<SearchResultsPage />} />
        <Route path="/booking/:flightId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        <Route path="/buses/results" element={<BusSearchResultsPage />} />
        <Route path="/buses/booking/:busId" element={<ProtectedRoute><BusBookingPage /></ProtectedRoute>} />
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
        <Route path="/flights" element={<FlightsPage />} />
        <Route path="/flights/results" element={<FlightResultsPage />} />
        <Route path="/flights/passengers" element={<ProtectedRoute><FlightPassengersPage /></ProtectedRoute>} />
        <Route path="/flights/payment" element={<ProtectedRoute><FlightPaymentPage /></ProtectedRoute>} />
        <Route path="/flights/success" element={<ProtectedRoute><FlightSuccessPage /></ProtectedRoute>} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/homestays" element={<HomestaysPage />} />
        <Route path="/cabs" element={<CabsPage />} />
        <Route path="/cabs/results" element={<CabSearchResultsPage />} />
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
        <Route path="/admin/bus-approvals" element={<ProtectedAdminRoute><AdminBusApprovals /></ProtectedAdminRoute>} />
        <Route path="/admin/cab-approvals" element={<ProtectedAdminRoute><AdminCabApprovals /></ProtectedAdminRoute>} />
        <Route path="/admin/trains" element={<ProtectedAdminRoute><AdminTrains /></ProtectedAdminRoute>} />
        <Route path="/admin/api-health" element={<ProtectedAdminRoute><AdminApiHealth /></ProtectedAdminRoute>} />
        <Route path="/admin/profile" element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>} />
        <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
        <Route path="/admin/security" element={<ProtectedAdminRoute><AdminSecurity /></ProtectedAdminRoute>} />
        <Route path="/admin/help" element={<ProtectedAdminRoute><AdminHelp /></ProtectedAdminRoute>} />

        <Route path="/vendor/login" element={<VendorLoginPage />} />
        <Route path="/vendor/dashboard" element={<ProtectedVendorRoute><VendorDashboard /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels" element={<ProtectedVendorRoute><VendorHotels /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels/create" element={<ProtectedVendorRoute><VendorHotelFormPage /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels/:id/edit" element={<ProtectedVendorRoute><VendorHotelFormPage /></ProtectedVendorRoute>} />
        <Route path="/vendor/hotels/:hotelId/rooms" element={<ProtectedVendorRoute><VendorHotelRooms /></ProtectedVendorRoute>} />
        <Route path="/vendor/buses" element={<ProtectedVendorRoute><VendorBuses /></ProtectedVendorRoute>} />
        <Route path="/vendor/buses/create" element={<ProtectedVendorRoute><VendorBusForm /></ProtectedVendorRoute>} />
        <Route path="/vendor/buses/:id/edit" element={<ProtectedVendorRoute><VendorBusForm /></ProtectedVendorRoute>} />
        <Route path="/vendor/cabs" element={<ProtectedVendorRoute><VendorCabs /></ProtectedVendorRoute>} />
        <Route path="/vendor/settings" element={<ProtectedVendorRoute><VendorSettings /></ProtectedVendorRoute>} />
        <Route path="/vendor/help" element={<ProtectedVendorRoute><VendorHelp /></ProtectedVendorRoute>} />

        {/* CMS Pages */}
        <Route path="/company" element={<CompanyPage />} />
        <Route path="/faqs" element={<FaqPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact-us" element={<ContactPage />} />
        <Route path="/:slug" element={<CmsPageRenderer />} />

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
        containerStyle={{ zIndex: 100000 }}
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






