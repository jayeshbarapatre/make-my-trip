/* Icon Utility - Using react-icons with Font Awesome, Iconoir, and HugeIcons */

// Font Awesome Icons
import { FaHeart, FaStar, FaChevronLeft, FaChevronRight, FaChevronDown, FaSearch, FaCheck, FaClock, FaMapPin, FaCalendarAlt, FaUser, FaBell, FaSignOutAlt, FaShoppingCart, FaFilter, FaCreditCard, FaPhone, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaHome, FaHotel, FaPlane, FaTrain, FaBus, FaTaxi, FaUmbrella, FaCompass, FaPassport, FaShip, FaShieldAlt, FaTheaterMasks, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaPlus, FaSave, FaTimes } from 'react-icons/fa'

// Iconoir Icons
import { CiHeart, CiStar, CiSearch, CiMapPin, CiCalendar, CiUser, CiLogout, CiShoppingCart, CiFilter, CiPhone, CiMail, CiLock } from 'react-icons/ci'

// HugeIcons (if available)
import { HiOutlineHeart, HiOutlineStar, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineChevronDown } from 'react-icons/hi2'

/**
 * Centralized icon component system
 * Mix and match from Font Awesome, Iconoir, and HugeIcons
 */

export const Icons = {
  // Heart/Like
  heart: (props = {}) => (
    <FaHeart {...props} />
  ),
  heartOutline: (props = {}) => (
    <CiHeart {...props} />
  ),

  // Star/Rating
  star: (props = {}) => (
    <FaStar {...props} />
  ),
  starOutline: (props = {}) => (
    <CiStar {...props} />
  ),

  // Navigation
  chevronLeft: (props = {}) => (
    <FaChevronLeft {...props} />
  ),
  chevronRight: (props = {}) => (
    <FaChevronRight {...props} />
  ),
  chevronDown: (props = {}) => (
    <FaChevronDown {...props} />
  ),

  // Search
  search: (props = {}) => (
    <FaSearch {...props} />
  ),
  searchOutline: (props = {}) => (
    <CiSearch {...props} />
  ),

  // Check/Confirm
  check: (props = {}) => (
    <FaCheck {...props} />
  ),

  // Location
  mapPin: (props = {}) => (
    <FaMapPin {...props} />
  ),
  mapPinOutline: (props = {}) => (
    <CiMapPin {...props} />
  ),

  // Calendar/Date
  calendar: (props = {}) => (
    <FaCalendarAlt {...props} />
  ),
  calendarOutline: (props = {}) => (
    <CiCalendar {...props} />
  ),

  // User
  user: (props = {}) => (
    <FaUser {...props} />
  ),
  userOutline: (props = {}) => (
    <CiUser {...props} />
  ),

  // Logout
  logout: (props = {}) => (
    <FaSignOutAlt {...props} />
  ),
  logoutOutline: (props = {}) => (
    <CiLogout {...props} />
  ),

  // Cart/Bag
  cart: (props = {}) => (
    <FaShoppingCart {...props} />
  ),
  cartOutline: (props = {}) => (
    <CiShoppingCart {...props} />
  ),

  // Filter
  filter: (props = {}) => (
    <FaFilter {...props} />
  ),
  filterOutline: (props = {}) => (
    <CiFilter {...props} />
  ),

  // Payment/Card
  creditCard: (props = {}) => (
    <FaCreditCard {...props} />
  ),

  // Contact
  phone: (props = {}) => (
    <FaPhone {...props} />
  ),
  phoneOutline: (props = {}) => (
    <CiPhone {...props} />
  ),

  email: (props = {}) => (
    <FaEnvelope {...props} />
  ),
  emailOutline: (props = {}) => (
    <CiMail {...props} />
  ),

  // Security
  lock: (props = {}) => (
    <FaLock {...props} />
  ),
  lockOutline: (props = {}) => (
    <CiLock {...props} />
  ),

  // Visibility
  eye: (props = {}) => (
    <FaEye {...props} />
  ),
  eyeOff: (props = {}) => (
    <FaEyeSlash {...props} />
  ),

  // Services
  home: (props = {}) => (
    <FaHome {...props} />
  ),
  hotel: (props = {}) => (
    <FaHotel {...props} />
  ),
  plane: (props = {}) => (
    <FaPlane {...props} />
  ),
  train: (props = {}) => (
    <FaTrain {...props} />
  ),
  bus: (props = {}) => (
    <FaBus {...props} />
  ),
  taxi: (props = {}) => (
    <FaTaxi {...props} />
  ),
  compass: (props = {}) => (
    <FaCompass {...props} />
  ),
  passport: (props = {}) => (
    <FaPassport {...props} />
  ),
  ship: (props = {}) => (
    <FaShip {...props} />
  ),
  shield: (props = {}) => (
    <FaShieldAlt {...props} />
  ),
  attractions: (props = {}) => (
    <FaTheaterMasks {...props} />
  ),

  // Weather
  umbrella: (props = {}) => (
    <FaUmbrella {...props} />
  ),

  // Time
  clock: (props = {}) => (
    <FaClock {...props} />
  ),

  // Admin/CRUD
  edit: (props = {}) => (
    <FaEdit {...props} />
  ),
  delete: (props = {}) => (
    <FaTrash {...props} />
  ),
  toggleOn: (props = {}) => (
    <FaToggleOn {...props} />
  ),
  toggleOff: (props = {}) => (
    <FaToggleOff {...props} />
  ),
  plus: (props = {}) => (
    <FaPlus {...props} />
  ),
  save: (props = {}) => (
    <FaSave {...props} />
  ),
  close: (props = {}) => (
    <FaTimes {...props} />
  ),
}

// Icon size presets
export const iconSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
}

// Common icon color schemes
export const iconColors = {
  primary: 'var(--clr-primary, #1F6DB8)',
  error: 'var(--clr-error, #F44336)',
  success: 'var(--clr-success, #4CAF50)',
  warning: 'var(--clr-warning, #FF9800)',
  info: 'var(--clr-info, #2196F3)',
  text: 'var(--clr-text-primary, #212121)',
  textMuted: 'var(--clr-text-secondary, #757575)',
  white: '#ffffff',
}

/**
 * Quick icon renderer with size and color
 * Usage: <Icon.heart size={20} color={iconColors.error} />
 */
export default Icons
