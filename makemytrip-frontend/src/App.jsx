import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Header from './components/Common/Header'
import Footer from './components/Common/Footer'
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
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/flights/results" element={<SearchResultsPage />} />
        <Route path="/booking/:flightId" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/results" element={<HotelListingPage />} />
        <Route path="/hotels/detail/:hotelId" element={<HotelDetailsPage />} />
        <Route path="/hotels/review" element={<HotelReviewPage />} />
        <Route path="/hotels/payment" element={<HotelPaymentPage />} />
        <Route path="/hotels/success" element={<HotelSuccessPage />} />
        <Route path="/trains" element={<TrainsPage />} />
        <Route path="/trains/results" element={<TrainResultsPage />} />
        <Route path="/trains/passengers" element={<TrainPassengersPage />} />
        <Route path="/trains/payment" element={<TrainPaymentPage />} />
        <Route path="/trains/success" element={<TrainSuccessPage />} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/homestays" element={<HomestaysPage />} />
        <Route path="/cabs" element={<CabsPage />} />
        <Route path="/buses" element={<BusesPage />} />
        <Route path="/cruise" element={<CruisePage />} />
        <Route path="/forex" element={<ForexPage />} />
        <Route path="/insurance" element={<InsurancePage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/visa" element={<VisaPage />} />
        <Route path="/my-trips" element={<MyTrips />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App




