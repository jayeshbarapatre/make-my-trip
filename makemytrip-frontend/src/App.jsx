import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './App.css'
import Header from './components/Common/Header'
import Footer from './components/Common/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import DemoNotice from './components/DemoNotice'
const HomePage = lazy(() => import('./pages/HomePage'))
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const BusSearchResultsPage = lazy(() => import('./pages/BusSearchResultsPage'))
const BusBookingPage = lazy(() => import('./pages/BusBookingPage'))
const CabSearchResultsPage = lazy(() => import('./pages/CabSearchResultsPage'))
const CabPaymentPage = lazy(() => import('./pages/CabPaymentPage'))
const CabSuccessPage = lazy(() => import('./pages/CabSuccessPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const HotelsPage = lazy(() => import('./pages/HotelsPage'))
const HotelListingPage = lazy(() => import('./pages/HotelListingPage'))
const HotelDetailsPage = lazy(() => import('./pages/HotelDetailsPage'))
const HotelReviewPage = lazy(() => import('./pages/HotelReviewPage'))
const HotelPaymentPage = lazy(() => import('./pages/HotelPaymentPage'))
const HotelSuccessPage = lazy(() => import('./pages/HotelSuccessPage'))
const TrainsPage = lazy(() => import('./pages/TrainsPage'))
const TrainResultsPage = lazy(() => import('./pages/TrainResultsPage'))
const TrainPassengersPage = lazy(() => import('./pages/TrainPassengersPage'))
const TrainPaymentPage = lazy(() => import('./pages/TrainPaymentPage'))
const TrainSuccessPage = lazy(() => import('./pages/TrainSuccessPage'))
const FlightsPage = lazy(() => import('./pages/FlightsPage'))
const FlightPassengersPage = lazy(() => import('./pages/FlightPassengersPage'))
const FlightPaymentPage = lazy(() => import('./pages/FlightPaymentPage'))
const FlightSuccessPage = lazy(() => import('./pages/FlightSuccessPage'))
const HolidaysPage = lazy(() => import('./pages/HolidaysPage'))
const HomestaysPage = lazy(() => import('./pages/HomestaysPage'))
const CabsPage = lazy(() => import('./pages/CabsPage'))
const BusesPage = lazy(() => import('./pages/BusesPage'))
const CruisePage = lazy(() => import('./pages/CruisePage'))
const ForexPage = lazy(() => import('./pages/ForexPage'))
const InsurancePage = lazy(() => import('./pages/InsurancePage'))
const ToursPage = lazy(() => import('./pages/ToursPage'))
const VisaPage = lazy(() => import('./pages/VisaPage'))
const MyTrips = lazy(() => import('./pages/MyTrips'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const BookingDetailsPage = lazy(() => import('./pages/BookingDetailsPage'))
const OfferDetailsPage = lazy(() => import('./pages/OfferDetailsPage'))
const Profile = lazy(() => import('./pages/Profile'))
import { AdminProvider } from './context/AdminContext'
import { VendorProvider } from './context/VendorContext'
import { ThemeProvider } from './context/ThemeContext'
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminFlights = lazy(() => import('./pages/AdminFlights'))
const AdminHotels = lazy(() => import('./pages/AdminHotels'))
const AdminBuses = lazy(() => import('./pages/AdminBuses'))
const AdminCabs = lazy(() => import('./pages/AdminCabs'))
const AdminBookings = lazy(() => import('./pages/AdminBookings'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminApprovals = lazy(() => import('./pages/AdminApprovals'))
const AdminVendors = lazy(() => import('./pages/AdminVendors'))
const AdminApiHealth = lazy(() => import('./pages/AdminApiHealth'))
const AdminProfile = lazy(() => import('./pages/AdminProfile'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))
const AdminReports = lazy(() => import('./pages/AdminReports'))
const AdminRefunds = lazy(() => import('./pages/AdminRefunds'))
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'))
const AdminSupport = lazy(() => import('./pages/AdminSupport'))
const AdminVendorRequests = lazy(() => import('./pages/AdminVendorRequests'))
const AdminSecurity = lazy(() => import('./pages/AdminSecurity'))
const AdminHelp = lazy(() => import('./pages/AdminHelp'))
import ProtectedAdminRoute from './components/Admin/ProtectedAdminRoute'
const VendorLoginPage = lazy(() => import('./pages/VendorLoginPage'))
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'))
const VendorHotels = lazy(() => import('./pages/VendorHotels'))
const VendorHotelFormPage = lazy(() => import('./pages/VendorHotelFormPage'))
const VendorHotelRooms = lazy(() => import('./pages/VendorHotelRooms'))
const VendorBuses = lazy(() => import('./pages/VendorBuses'))
import VendorBusForm from './components/Vendor/VendorBusForm'
const VendorCabs = lazy(() => import('./pages/VendorCabs'))
const VendorSettings = lazy(() => import('./pages/VendorSettings'))
const VendorHelp = lazy(() => import('./pages/VendorHelp'))
const AdminBusApprovals = lazy(() => import('./pages/AdminBusApprovals'))
const AdminCabApprovals = lazy(() => import('./pages/AdminCabApprovals'))
const AdminTrains = lazy(() => import('./pages/AdminTrains'))
import ProtectedVendorRoute from './components/Vendor/ProtectedVendorRoute'
const CmsPageRenderer = lazy(() => import('./pages/CmsPageRenderer'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const CareersPage = lazy(() => import('./pages/CareersPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
import { cmsService } from './services/cmsService'

function NotFound() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 text-base-content p-4 relative overflow-hidden transition-colors duration-300">
      {/* Animated background elements with DaisyUI theme colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ background: 'hsl(var(--p) / 0.1)' }} />
        <div className="absolute bottom-40 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'hsl(var(--p) / 0.05)', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ background: 'hsl(var(--s) / 0.05)', animationDelay: '4s' }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1deg); }
          75% { transform: rotate(-1deg); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        .wobble-animation {
          animation: wobble 2s ease-in-out infinite;
        }
      `}</style>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            {/* 404 Text with DaisyUI theme color gradient */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-9xl md:text-[150px] font-black leading-none" style={{
                  backgroundImage: 'linear-gradient(to right, hsl(var(--p)), hsl(var(--p) / 0.8))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent'
                }}>
                  404
                </h1>
                <div className="text-2xl md:text-3xl font-bold text-base-content/70 mt-2">
                  Oops!
                </div>
              </div>
            </div>

            {/* Floating elements with DaisyUI theme colors */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 float-animation">
              <div className="w-16 h-16 rounded-full blur-md opacity-60" style={{ background: 'linear-gradient(to bottom right, hsl(var(--s)), hsl(var(--s) / 0.7))' }} />
            </div>
            <div className="absolute bottom-8 left-4 wobble-animation">
              <div className="w-12 h-12 rounded-lg blur-md opacity-50" style={{ background: 'linear-gradient(to bottom right, hsl(var(--p) / 0.6), hsl(var(--p)))' }} />
            </div>
            <div className="absolute bottom-12 right-4 float-animation" style={{ animationDelay: '1.5s' }}>
              <div className="w-14 h-14 rounded-lg blur-md opacity-50" style={{ background: 'linear-gradient(to bottom right, hsl(var(--s) / 0.6), hsl(var(--s)))' }} />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-3">
            Page Not Found
          </h2>
          <p className="text-base-content/70 text-base md:text-lg leading-relaxed mb-2">
            The page you're looking for seems to have wandered off. Don't worry, we'll help you find your way back!
          </p>
          <p className="text-base-content/60 text-sm">
            It might have been moved, deleted, or the URL might be incorrect.
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="mb-12 max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search flights, hotels, buses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full px-6 py-3 pl-12 bg-base-100 border-2 border-base-300 focus:border-primary focus:outline-none focus:ring-0 transition-all duration-200 rounded-full shadow-lg"
              style={{ color: 'hsl(var(--bc))' }}
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--bc) / 0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="/"
            className="btn btn-primary px-8 gap-2 transform hover:scale-105 active:scale-95 transition-transform duration-200"
            style={{
              background: 'hsl(var(--p))',
              color: 'hsl(var(--pc))',
              boxShadow: '0 10px 20px hsla(var(--p) / 0.3)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15l3-3 3 3" />
            </svg>
            Take Me Home
          </a>
          <button
            onClick={() => window.history.back()}
            className="btn btn-ghost px-8 transform hover:scale-105 active:scale-95 transition-transform duration-200"
            style={{
              background: 'hsl(var(--b2))',
              color: 'hsl(var(--bc))'
            }}
          >
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
          <a href="/flights" className="group p-4 bg-base-200 border border-base-300 hover:border-primary hover:bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-center">
            <div className="text-xl mb-2">✈️</div>
            <div className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Flights</div>
          </a>
          <a href="/hotels" className="group p-4 bg-base-200 border border-base-300 hover:border-primary hover:bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-center">
            <div className="text-xl mb-2">🏨</div>
            <div className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Hotels</div>
          </a>
          <a href="/bus-search" className="group p-4 bg-base-200 border border-base-300 hover:border-primary hover:bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-center">
            <div className="text-xl mb-2">🚌</div>
            <div className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Buses</div>
          </a>
          <a href="/contact-us" className="group p-4 bg-base-200 border border-base-300 hover:border-primary hover:bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-center">
            <div className="text-xl mb-2">💬</div>
            <div className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">Support</div>
          </a>
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


// Shown while a route's chunk is being fetched. Pages are code-split, so the
// first visit to a route downloads only that page rather than the whole app.
function PageLoader() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        flexDirection: 'column'
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid hsl(var(--b3))',
          borderTopColor: 'hsl(var(--p))',
          borderRadius: '50%',
          animation: 'mmt-spin 0.8s linear infinite'
        }}
      />
      <span style={{ fontSize: '14px', color: 'hsl(var(--bc) / 0.6)', fontWeight: 600 }}>
        Loading…
      </span>
      <style>{'@keyframes mmt-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isVendorRoute = location.pathname.startsWith('/vendor')
  // Every route where a visitor is committing to, or has just completed, a
  // booking — /hotel/payment, /cab/success, /booking/:id and friends. Admin and
  // vendor consoles are excluded: nobody there mistakes the inventory for real.
  const isDemoSurface = !isAdminRoute && !isVendorRoute &&
    /(^\/booking|\/(payment|review|success))/.test(location.pathname)

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('daisyui-theme') || 'business'
    document.documentElement.setAttribute('data-theme', savedTheme)

    // Load theme settings from CMS (non-blocking with timeout)
    const loadThemeSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          // Skip API call if not authenticated
          return
        }

        // Add timeout to prevent blocking
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Theme load timeout')), 2000)
        )

        const response = await Promise.race([
          cmsService.getSettings(),
          timeoutPromise
        ])

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
      {/* Checkout and confirmation are where "this is a demo" costs the most to
          not know, so the banner is rendered once here for every route in that
          flow rather than threaded through seven page components. The footer
          carries the same statement site-wide. */}
      {isDemoSurface && (
        <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 24px' }}>
          <DemoNotice variant="banner" />
        </div>
      )}
      {/* Keyed on the path so navigating away from a crashed route recovers. */}
      <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/offers/:offerId" element={<OfferDetailsPage />} />
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
        {/* /flights/results is declared once, above, by SearchResultsPage. A
            second identical declaration stood here for FlightResultsPage; two
            routes with the same pattern rank equally and the first one always
            wins, so this never rendered. */}
        <Route path="/flights/passengers" element={<ProtectedRoute><FlightPassengersPage /></ProtectedRoute>} />
        <Route path="/flights/payment" element={<ProtectedRoute><FlightPaymentPage /></ProtectedRoute>} />
        <Route path="/flights/success" element={<ProtectedRoute><FlightSuccessPage /></ProtectedRoute>} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/homestays" element={<HomestaysPage />} />
        <Route path="/cabs" element={<CabsPage />} />
        <Route path="/cabs/results" element={<CabSearchResultsPage />} />
        <Route path="/cab/payment" element={<ProtectedRoute><CabPaymentPage /></ProtectedRoute>} />
        <Route path="/cab/success" element={<ProtectedRoute><CabSuccessPage /></ProtectedRoute>} />
        <Route path="/buses" element={<BusesPage />} />
        <Route path="/cruise" element={<CruisePage />} />
        <Route path="/forex" element={<ForexPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/visa" element={<VisaPage />} />
        <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        {/* Was /booking/:bookingId, which is the same pattern as
            /booking/:flightId above — a parameter's name does not distinguish a
            route. Every /booking/<id> URL matched the flight checkout page, so
            this was unreachable. */}
        <Route path="/bookings/:bookingId" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />
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
        <Route path="/admin/reports" element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
        <Route path="/admin/refunds" element={<ProtectedAdminRoute><AdminRefunds /></ProtectedAdminRoute>} />
        <Route path="/admin/coupons" element={<ProtectedAdminRoute><AdminCoupons /></ProtectedAdminRoute>} />
        <Route path="/admin/support" element={<ProtectedAdminRoute><AdminSupport /></ProtectedAdminRoute>} />
        <Route path="/admin/vendor-requests" element={<ProtectedAdminRoute><AdminVendorRequests /></ProtectedAdminRoute>} />
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
      </Suspense>
      </ErrorBoundary>
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






