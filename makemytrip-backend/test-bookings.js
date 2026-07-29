import axios from 'axios'

const API_URL = 'http://localhost:5000/api/v1'
const TEST_EMAIL = 'dev646795@gmail.com'
const TEST_PASSWORD = 'Test@12345'

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
  section: (msg) => console.log(`\n${colors.yellow}📌 ${msg}${colors.reset}`)
}

let testUser = null
let token = null

// Register test user
async function registerUser() {
  log.section('Step 1: Register Test User')
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      phone: '9876543210'
    })

    testUser = response.data.data.user
    token = response.data.data.token
    log.success(`Registered user: ${TEST_EMAIL}`)
    return true
  } catch (error) {
    if (error.response?.status === 409) {
      log.info('User already exists, attempting login...')
      return await loginUser()
    }
    log.error(`Registration failed: ${error.response?.data?.message || error.message}`)
    return false
  }
}

// Login user
async function loginUser() {
  log.section('Step 1B: Login Existing User')
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })

    testUser = response.data.data.user
    token = response.data.data.token
    log.success(`Logged in as: ${TEST_EMAIL}`)
    return true
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.message || error.message}`)
    return false
  }
}

// Get available flights
async function searchFlights() {
  log.section('Flight Booking: Step 2 - Search')
  try {
    const response = await axios.get(`${API_URL}/flights`, {
      params: {
        from: 'New Delhi',
        to: 'Mumbai',
        date: new Date().toISOString().split('T')[0],
        passengers: 1
      },
      headers: { Authorization: `Bearer ${token}` }
    })

    const flights = response.data?.data || []
    log.success(`Found ${flights.length} flights`)
    return flights.length > 0 ? flights[0] : null
  } catch (error) {
    log.error(`Flight search failed: ${error.message}`)
    return null
  }
}

// Get available hotels
async function searchHotels() {
  log.section('Hotel Booking: Step 2 - Search')
  try {
    const response = await axios.get(`${API_URL}/hotels`, {
      params: {
        city: 'Mumbai',
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        guests: 1,
        rooms: 1
      },
      headers: { Authorization: `Bearer ${token}` }
    })

    const hotels = response.data?.data || []
    log.success(`Found ${hotels.length} hotels`)
    return hotels.length > 0 ? hotels[0] : null
  } catch (error) {
    log.error(`Hotel search failed: ${error.message}`)
    return null
  }
}

// Create flight booking
async function bookFlight(flight) {
  log.section('Flight Booking: Step 3 - Create Booking')
  if (!flight) {
    log.error('No flight available')
    return null
  }

  try {
    const response = await axios.post(`${API_URL}/bookings/flights`, {
      flightId: flight.id || 'FL-001',
      passengers: [{ name: 'Test Traveller', age: 30, gender: 'Male' }],
      totalAmount: flight.price * 1.18,
      baseFare: flight.price,
      taxes: flight.price * 0.18,
      userEmail: TEST_EMAIL,
      userName: testUser.name
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const booking = response.data?.data
    log.success(`Flight booking created: ${booking.bookingId}`)
    return booking
  } catch (error) {
    log.error(`Flight booking failed: ${error.response?.data?.message || error.message}`)
    return null
  }
}

// Create hotel booking
async function bookHotel(hotel) {
  log.section('Hotel Booking: Step 3 - Create Booking')
  if (!hotel) {
    log.error('No hotel available')
    return null
  }

  try {
    const response = await axios.post(`${API_URL}/bookings/hotels`, {
      hotelId: hotel.id || 'HT-001',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rooms: 1,
      guests: 1,
      totalAmount: hotel.price * 1.18,
      baseFare: hotel.price,
      taxes: hotel.price * 0.18,
      userEmail: TEST_EMAIL,
      userName: testUser.name
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const booking = response.data?.data
    log.success(`Hotel booking created: ${booking.bookingId}`)
    return booking
  } catch (error) {
    log.error(`Hotel booking failed: ${error.response?.data?.message || error.message}`)
    return null
  }
}

// Check email logs
async function checkEmailLogs() {
  log.section('Email Verification')
  try {
    const response = await axios.get(`${API_URL}/admin/email-logs`, {
      params: {
        emailType: 'booking_confirmation',
        limit: 10
      },
      headers: { Authorization: `Bearer ${token}` }
    })

    const logs = response.data?.data || []
    log.info(`Total confirmation emails logged: ${logs.length}`)

    logs.forEach((log, i) => {
      console.log(`  ${i + 1}. To: ${log.recipientEmail} | Status: ${log.status} | Type: ${log.emailType}`)
    })

    return logs
  } catch (error) {
    log.info('Email logs not accessible (requires admin)')
  }
}

// Main test runner
async function runTests() {
  console.clear()
  log.test('MAKEMYTRIP BOOKING SYSTEM - END-TO-END TEST')
  log.info(`Testing email delivery to: ${TEST_EMAIL}`)

  // Register/Login
  if (!await registerUser()) return

  // Search and book each type
  const flight = await searchFlights()
  if (flight) {
    await bookFlight(flight)
  }

  const hotel = await searchHotels()
  if (hotel) {
    await bookHotel(hotel)
  }

  // Check email logs
  await checkEmailLogs()

  log.section('Test Summary')
  log.info('✅ All tests completed')
  log.info('📧 Check dev646795@gmail.com for confirmation emails')
  log.info('⏱️  Note: Emails are queued asynchronously. Check after 5-10 seconds.')
}

runTests().catch(console.error)
