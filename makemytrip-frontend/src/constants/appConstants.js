// Frontend application constants

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
}

// Booking Types
export const BOOKING_TYPES = {
  FLIGHT: 'flight',
  HOTEL: 'hotel',
  TRAIN: 'train',
  BUS: 'bus',
  CAB: 'cab'
}

// Trip Types
export const TRIP_TYPES = {
  ONE_WAY: 'one-way',
  ROUND_TRIP: 'round-trip',
  MULTI_CITY: 'multi-city'
}

// Passenger Types
export const PASSENGER_TYPES = {
  ADULT: 'adult',
  CHILD: 'child',
  INFANT: 'infant'
}

// Seat Classes
export const SEAT_CLASSES = {
  ECONOMY: 'Economy',
  BUSINESS: 'Business',
  FIRST: 'First'
}

// Room Types
export const ROOM_TYPES = {
  SINGLE: 'Single',
  DOUBLE: 'Double',
  SUITE: 'Suite',
  DELUXE: 'Deluxe'
}

// User Menu Items
export const USER_MENU = [
  { label: 'My Trips', href: '/my-trips', icon: 'plane' },
  { label: 'Profile', href: '/profile', icon: 'user' },
  { label: 'Saved', href: '/saved', icon: 'bookmark' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
  { label: 'Help', href: '/help', icon: 'help' },
  { label: 'Logout', href: '/logout', icon: 'logout' }
]

// Admin Menu Items
export const ADMIN_MENU = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'chart' },
  { label: 'Flights', href: '/admin/flights', icon: 'plane' },
  { label: 'Hotels', href: '/admin/hotels', icon: 'building' },
  { label: 'Bookings', href: '/admin/bookings', icon: 'ticket' },
  { label: 'Users', href: '/admin/users', icon: 'users' },
  { label: 'Vendors', href: '/admin/vendors', icon: 'shop' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings' }
]

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#003580',
  SECONDARY: '#0F172A',
  ACCENT: '#1a73e8',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  LIGHT: '#f3f4f6',
  DARK: '#1f2937'
}

// Toast Positions
export const TOAST_POSITION = {
  TOP: 'top-center',
  BOTTOM: 'bottom-center',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right'
}

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

// Input Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10,15}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100
}

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FLIGHTS: '/flights',
  HOTELS: '/hotels',
  TRAINS: '/trains',
  BUSES: '/buses',
  CABS: '/cabs',
  MY_TRIPS: '/my-trips',
  PROFILE: '/profile',
  ADMIN_DASHBOARD: '/admin/dashboard',
  VENDOR_DASHBOARD: '/vendor/dashboard'
}

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  ADMIN_TOKEN: 'adminToken',
  VENDOR_TOKEN: 'vendorToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SEARCH_HISTORY: 'searchHistory',
  SAVED_FLIGHTS: 'savedFlights',
  SAVED_HOTELS: 'savedHotels'
}

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'DD/MM/YYYY',
  LONG: 'DD MMMM YYYY',
  API: 'YYYY-MM-DD',
  DISPLAY: 'DD MMM YYYY'
}

// Sorting Options
export const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'departure', label: 'Departure Time' },
  { value: 'duration', label: 'Duration' },
  { value: 'rating', label: 'Rating' }
]

// Filter Ranges
export const FILTER_RANGES = {
  PRICE_MIN: 0,
  PRICE_MAX: 100000,
  RATING_MIN: 1,
  RATING_MAX: 5,
  DISTANCE_MAX: 50 // km
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  ITEMS_PER_PAGE: [10, 20, 50]
}

// Error Codes
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
}
