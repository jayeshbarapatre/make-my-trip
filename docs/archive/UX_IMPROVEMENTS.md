# Travel Booking App — Complete UX Improvements Guide

## 1. TOAST NOTIFICATION SYSTEM

### Installation

```bash
npm install react-hot-toast
```

### Setup (App.jsx)

```javascript
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '16px'
          },
          success: {
            style: {
              background: '#10b981',
              color: '#fff'
            },
            icon: '✅'
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff'
            },
            icon: '❌'
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff'
            },
            icon: '⏳'
          }
        }}
      />
      {/* Rest of app */}
    </>
  )
}
```

### Usage Examples

```javascript
import toast from 'react-hot-toast'

// SUCCESS
const handleLoginSuccess = () => {
  toast.success('Login successful! Welcome back.')
}

// ERROR
const handleLoginError = (error) => {
  toast.error(error?.message || 'Login failed. Please try again.')
}

// LOADING
const handleBookingStart = () => {
  const loadingToast = toast.loading('Processing your booking...')
  
  setTimeout(() => {
    toast.dismiss(loadingToast)
    toast.success('Flight booked successfully!')
  }, 2000)
}

// CUSTOM MESSAGE
toast('🎉 Welcome to MakeMyTrip!', {
  duration: 5000,
  icon: '✈️',
  style: {
    background: '#003580',
    color: '#fff'
  }
})
```

### Reusable Toast Hook

```javascript
// hooks/useToast.js
import toast from 'react-hot-toast'

export const useToast = () => {
  return {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    loading: (message) => toast.loading(message),
    dismiss: (id) => toast.dismiss(id),
    custom: (message, options) => toast.custom(message, options)
  }
}

// Usage in any component
import { useToast } from '../hooks/useToast'

export function LoginForm() {
  const toast = useToast()
  
  const handleSubmit = async () => {
    try {
      await login(email, password)
      toast.success('Login successful!')
    } catch (err) {
      toast.error(err.message)
    }
  }
}
```

---

## 2. GLOBAL ROUTE LOADER

### Create Loader Component

```javascript
// components/RouteLoader.jsx
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './RouteLoader.css'

export default function RouteLoader() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Start loader when route changes
    setIsLoading(true)
    
    // Stop loader after page loads
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [location.pathname])

  if (!isLoading) return null

  return (
    <div className="route-loader-overlay">
      <div className="route-loader-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
  )
}
```

### Loader Styles

```css
/* components/RouteLoader.css */
.route-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.route-loader-spinner {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #003580;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.route-loader-spinner p {
  color: #003580;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}
```

### Add to App.jsx

```javascript
import RouteLoader from './components/RouteLoader'

export default function App() {
  return (
    <>
      <Toaster />
      <RouteLoader />
      <Header />
      <Routes>
        {/* routes */}
      </Routes>
      <Footer />
    </>
  )
}
```

---

## 3. PAGE LOADING STATE

### Create Page Loader Component

```javascript
// components/PageLoader.jsx
import './PageLoader.css'

export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-content">
        <div className="loader-spinner"></div>
        <h2>Loading Page...</h2>
        <p>Please wait while we prepare your content</p>
      </div>
    </div>
  )
}
```

### Page Loader Styles

```css
/* components/PageLoader.css */
.page-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.loader-content {
  text-align: center;
}

.loader-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 53, 128, 0.1);
  border-top: 4px solid #003580;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30px;
}

.loader-content h2 {
  color: #003580;
  font-size: 24px;
  margin: 20px 0 10px;
}

.loader-content p {
  color: #666;
  font-size: 14px;
}
```

---

## 4. BUTTON LOADING STATE

### Create Loading Button Component

```javascript
// components/LoadingButton.jsx
import './LoadingButton.css'

export default function LoadingButton({
  children,
  isLoading,
  disabled,
  onClick,
  variant = 'primary'
}) {
  return (
    <button
      className={`loading-btn loading-btn-${variant}`}
      disabled={isLoading || disabled}
      onClick={onClick}
    >
      {isLoading ? (
        <>
          <span className="btn-spinner"></span>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
```

### Button Loading Styles

```css
/* components/LoadingButton.css */
.loading-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.loading-btn-primary {
  background: #003580;
  color: white;
}

.loading-btn-primary:hover:not(:disabled) {
  background: #0052a3;
  box-shadow: 0 4px 12px rgba(0, 53, 128, 0.3);
}

.loading-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Usage

```javascript
import { useState } from 'react'
import LoadingButton from '../components/LoadingButton'
import { useToast } from '../hooks/useToast'

export function BookingForm() {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleBooking = async () => {
    setIsLoading(true)
    try {
      await bookFlight(flightData)
      toast.success('Flight booked successfully!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LoadingButton isLoading={isLoading} onClick={handleBooking}>
      Book Flight
    </LoadingButton>
  )
}
```

---

## 5. AOS ANIMATIONS (SCROLL ANIMATIONS)

### Installation

```bash
npm install aos
```

### Setup (App.jsx or main.jsx)

```javascript
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      offset: 100
    })
  }, [])

  return (
    // Your app
  )
}
```

### Usage on Components

```javascript
// Flight Card with AOS
export function FlightCard({ flight }) {
  return (
    <div
      data-aos="fade-up"
      data-aos-delay="100"
      className="flight-card"
    >
      <div className="flight-header">
        <h3>{flight.airline}</h3>
      </div>
      <div className="flight-details">
        {/* flight info */}
      </div>
    </div>
  )
}

// Hotel Card with Zoom
export function HotelCard({ hotel }) {
  return (
    <div
      data-aos="zoom-in"
      data-aos-duration="800"
      className="hotel-card"
    >
      <img src={hotel.image} alt={hotel.name} />
      <h2>{hotel.name}</h2>
      <p>{hotel.price}</p>
    </div>
  )
}

// Section with Fade
export function BookingSection() {
  return (
    <section
      data-aos="fade-in"
      data-aos-duration="1200"
      className="booking-section"
    >
      <h2>Special Offers</h2>
      {/* content */}
    </section>
  )
}
```

### Common AOS Animations

```javascript
// Entrance animations
data-aos="fade"          // Simple fade
data-aos="fade-up"       // Fade while moving up
data-aos="fade-down"     // Fade while moving down
data-aos="zoom-in"       // Zoom entrance
data-aos="flip-up"       // Flip animation
data-aos="slide-up"      // Slide from bottom

// Properties
data-aos-duration="800"  // Duration in ms (default: 400)
data-aos-delay="200"     // Delay before animation
data-aos-offset="100"    // Pixels from viewport to start
data-aos-once="false"    // Animate every time visible
```

---

## 6. COMPLETE LOGIN FLOW WITH TOAST + LOADER

```javascript
// pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingButton from '../components/LoadingButton'
import { useToast } from '../hooks/useToast'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setIsLoading(true)
    
    try {
      await login(email, password)
      toast.success('✅ Login successful! Welcome back.')
      
      // Small delay for better UX
      setTimeout(() => {
        navigate('/')
      }, 500)
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Login failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <LoadingButton
        isLoading={isLoading}
        variant="primary"
      >
        Sign In
      </LoadingButton>
    </form>
  )
}
```

---

## 7. COMPLETE FLIGHT BOOKING WITH ANIMATIONS

```javascript
// pages/BookingPage.jsx
import { useState } from 'react'
import AOS from 'aos'
import { useToast } from '../hooks/useToast'
import LoadingButton from '../components/LoadingButton'

export default function BookingPage() {
  const toast = useToast()
  const [isBooking, setIsBooking] = useState(false)

  const handleBooking = async () => {
    setIsBooking(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('✈️ Flight booked successfully!')
    } catch (error) {
      toast.error('Booking failed: ' + error.message)
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="booking-page">
      {/* Booking Summary */}
      <section
        data-aos="fade-up"
        data-aos-duration="800"
        className="booking-summary"
      >
        <h2>Booking Summary</h2>
        <div className="summary-card">
          <p>Flight: Delhi → Mumbai</p>
          <p>Date: 2026-06-01</p>
          <p>Amount: ₹5,000</p>
        </div>
      </section>

      {/* Traveller Details */}
      <section
        data-aos="fade-up"
        data-aos-delay="200"
        className="traveller-details"
      >
        <h2>Traveller Details</h2>
        <form>
          <input type="text" placeholder="Full Name" />
          <input type="email" placeholder="Email" />
          <input type="tel" placeholder="Phone" />
        </form>
      </section>

      {/* Payment Section */}
      <section
        data-aos="zoom-in"
        data-aos-delay="400"
        className="payment-section"
      >
        <h2>Payment</h2>
        <LoadingButton
          isLoading={isBooking}
          onClick={handleBooking}
          variant="primary"
        >
          Confirm Booking
        </LoadingButton>
      </section>
    </div>
  )
}
```

---

## 8. BEST PRACTICES

### ✅ DO

```javascript
// 1. Show context-specific messages
toast.success('✈️ Flight booked successfully!')  // ✅ Specific
// Instead of: toast.success('Success')          // ❌ Generic

// 2. Use icons
toast.success('🏨 Hotel reserved!')
toast.error('❌ Payment failed')
toast.loading('⏳ Processing...')

// 3. Keep animations subtle
data-aos-duration="800"   // ✅ Smooth
// Instead of 3000ms+      // ❌ Too slow

// 4. Disable buttons while loading
<LoadingButton isLoading={isLoading} />

// 5. Show loader for network calls
setIsLoading(true)
await api.post('/booking')
setIsLoading(false)

// 6. Use AOS only on visible elements
// Don't animate every single element
```

### ❌ DON'T

```javascript
// 1. Overuse animations
data-aos="fade-up"
data-aos="fade-down"
data-aos="zoom-in"
// ❌ Too many animations = cluttered UI

// 2. Show multiple toasts
toast.success('Msg 1')
toast.success('Msg 2')
toast.success('Msg 3')
// ❌ Spam, show one at a time

// 3. Long animation durations
data-aos-duration="5000"  // ❌ Too slow

// 4. Forget to stop loading state
setIsLoading(true)
await api.post() // If error, isLoading never resets
// ✅ Always use finally block

// 5. Animate on every scroll
// Only animate meaningful sections
```

---

## 9. COMPLETE EXAMPLE (Integration)

```javascript
// App.jsx
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useEffect } from 'react'
import RouteLoader from './components/RouteLoader'
import Header from './components/Header'
import Footer from './components/Footer'
import { Routes, Route } from 'react-router-dom'

export default function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      offset: 100
    })
  }, [])

  return (
    <>
      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          },
          success: {
            style: { background: '#10b981', color: '#fff' },
            icon: '✅'
          },
          error: {
            style: { background: '#ef4444', color: '#fff' },
            icon: '❌'
          }
        }}
      />

      {/* Route Loader */}
      <RouteLoader />

      {/* Layout */}
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/booking" element={<BookingPage />} />
      </Routes>
      <Footer />
    </>
  )
}
```

---

## Summary Checklist

- ✅ Install `react-hot-toast` for notifications
- ✅ Setup global `Toaster` in App.jsx
- ✅ Create `RouteLoader` for page transitions
- ✅ Create `LoadingButton` for form submissions
- ✅ Install and setup AOS for animations
- ✅ Use toast for all user actions (login, booking, etc)
- ✅ Show loader while API calls in progress
- ✅ Keep animations subtle and purposeful
- ✅ Always use try/catch/finally for loading states
- ✅ Test on slow networks to ensure UX is good
