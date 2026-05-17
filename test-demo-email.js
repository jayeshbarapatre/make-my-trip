import axios from 'axios'

const API_BASE = 'http://localhost:5000/api/v1'

async function testDemoEmail() {
  try {
    console.log('='.repeat(60))
    console.log('DEMO EMAIL SYSTEM TEST')
    console.log('='.repeat(60))

    // 1. Register test user
    console.log('\n1️⃣  Registering test user...')
    const testEmail = `testuser_${Date.now()}@test.com`
    const registerRes = await axios.post(`${API_BASE}/auth/signup`, {
      name: 'Demo Test User',
      email: testEmail,
      password: 'TestPassword123!',
      phone: '9876543210'
    })
    console.log(`✅ User registered: ${testEmail}`)

    // 2. Login
    console.log('\n2️⃣  Logging in...')
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'TestPassword123!'
    })
    const token = loginRes.data.token
    console.log(`✅ Logged in successfully`)

    // 3. Make a flight booking
    console.log('\n3️⃣  Creating flight booking...')
    const bookingRes = await axios.post(
      `${API_BASE}/bookings`,
      {
        type: 'flight',
        flightId: 'demo-flight-1',
        fromCity: 'New Delhi',
        toCity: 'Mumbai',
        departureDate: '2026-06-01',
        returnDate: '2026-06-05',
        travellers: [
          { name: 'Demo Test User', age: 30, seat: '12A' }
        ],
        totalAmount: 15000,
        userEmail: testEmail,
        userName: 'Demo Test User'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log(`✅ Booking created successfully`)
    console.log(`   Booking ID: ${bookingRes.data.data.bookingId}`)
    console.log(`   PNR: ${bookingRes.data.data.pnr}`)

    console.log('\n' + '='.repeat(60))
    console.log('✅ DEMO EMAIL SYSTEM TEST COMPLETED')
    console.log('='.repeat(60))
    console.log('\n📧 Email Status:')
    console.log(`   User Email (stored in DB): ${testEmail}`)
    console.log(`   Demo Recipient: jayesh.barapatre@prakashinfotech.com`)
    console.log(`   Check backend logs above for email send confirmation`)
    console.log('\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Test failed:')
    console.error(error.response?.data || error.message)
    process.exit(1)
  }
}

testDemoEmail()
