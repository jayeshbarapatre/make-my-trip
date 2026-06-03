import axios from 'axios'

async function testSignup() {
  try {
    const res = await axios.post('https://make-my-trip-wb8n.onrender.com/api/v1/auth/signup', {
      name: "Test User",
      email: "test321@test.com",
      password: "Password@123",
      phone: "9876543210"
    })
    console.log("Signup Response:", res.data)
  } catch (err) {
    if (err.response) {
      console.log("Status:", err.response.status)
      console.log("Response Body:", err.response.data)
    } else {
      console.log("Error:", err.message)
    }
  }
}

testSignup()
