import 'dotenv/config'
import '../src/config/firebase.js'
import { searchFlights } from '../src/controllers/flightController.js'

// Mock Express request and response
const req = {
  query: {
    from: 'New Delhi',
    to: 'Bengaluru',
    date: '2026-05-14'
  }
}

const res = {
  status: function(code) {
    this.statusCode = code
    return this
  },
  json: function(data) {
    console.log('Response Code:', this.statusCode || 200)
    console.log('Response Data:', JSON.stringify(data, null, 2).slice(0, 500) + '\n... [truncated]')
  }
}

console.log('Running searchFlights test...')
searchFlights(req, res).catch(err => {
  console.error('Unhandled Search Error:', err)
})
