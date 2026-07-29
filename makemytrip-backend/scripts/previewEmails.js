#!/usr/bin/env node
/**
 * Renders every email template to preview/*.html so they can be reviewed in a
 * browser without sending anything. Useful when the test inbox is unavailable.
 *
 *   npm run preview:email
 */
import 'dotenv/config'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

import { renderBookingConfirmation } from '../src/services/email/templates/booking.js'
import { renderWelcome, renderOtp } from '../src/services/email/templates/account.js'

const OUT = resolve(process.cwd(), 'preview')
mkdirSync(OUT, { recursive: true })

const iso = (d) => new Date(d).toISOString()
const soon = (days) => iso(Date.now() + days * 86400000)

const common = {
  userName: 'Jayesh Barapatre',
  userEmail: 'jayeshbarapatre4923@gmail.com',
  userPhone: '+91 98765 43210',
  status: 'confirmed',
  paymentStatus: 'completed',
  createdAt: iso(Date.now())
}

const samples = {
  flight: {
    ...common, type: 'flight',
    bookingId: 'MMT-FL-480921', pnr: 'PNR-771204',
    fromCity: 'Delhi (DEL)', toCity: 'Mumbai (BOM)',
    departureDate: soon(12), departureTime: '06:20', arrivalTime: '08:35', duration: '2h 15m',
    airlineName: 'IndiGo', flightNumber: '6E-2043', fareClass: 'Economy',
    baggage: '15 kg check-in + 7 kg cabin',
    passengers: [
      { title: 'Mr', firstName: 'Jayesh', lastName: 'Barapatre', gender: 'Male', age: 29, seat: '12A', type: 'Adult' },
      { title: 'Ms', firstName: 'Riya', lastName: 'Sharma', gender: 'Female', age: 27, seat: '12B', type: 'Adult' }
    ],
    baseFare: 7400, taxes: 1180, convenience: 236, gst: 84, discount: 300, totalAmount: 8600,
    paymentMethod: 'upi', transactionId: 'pay_QN4x81LmTZa9Kd'
  },
  hotel: {
    ...common, type: 'hotel',
    bookingId: 'MMT-HT-330514', pnr: 'HTL-889230',
    hotelName: 'The Leela Palace', hotelLocality: 'Chanakyapuri, New Delhi',
    roomName: 'Royal Premiere King Room', rooms: 2, nights: 3,
    checkIn: soon(20), checkOut: soon(23), departureDate: soon(20), returnDate: soon(23),
    travellers: { guests: 4, adults: 4, rooms: 2, nights: 3, roomName: 'Royal Premiere King Room' },
    passengers: [{ name: 'Jayesh Barapatre', type: 'Adult' }, { name: 'Riya Sharma', type: 'Adult' }],
    baseFare: 42000, taxes: 7560, discount: 2000, totalAmount: 47560,
    paymentMethod: 'credit_card', transactionId: 'pay_QN51ZzKpLm3Rd7'
  },
  train: {
    ...common, type: 'train',
    bookingId: 'MMT-TR-661208', pnr: 'PNR-4471209',
    fromCity: 'New Delhi (NDLS)', toCity: 'Lucknow (LKO)',
    departureDate: soon(9), departureTime: '06:10', arrivalTime: '12:40', duration: '6h 30m',
    trainName: 'Shatabdi Express', trainNumber: '12004', travelClass: 'AC Chair Car (CC)', quota: 'General',
    passengers: [
      { name: 'Jayesh Barapatre', gender: 'Male', age: 29, seat: 'C4 / 42', type: 'Adult' },
      { name: 'Aarav Mehta', gender: 'Male', age: 34, seat: 'C4 / 43', type: 'Adult' }
    ],
    baseFare: 2400, taxes: 120, convenience: 60, totalAmount: 2580,
    paymentMethod: 'netbanking', transactionId: 'pay_QN5A7wRtYb2Qe1'
  },
  bus: {
    ...common, type: 'bus',
    bookingId: 'MMT-BS-905417', pnr: 'BUS-220945',
    fromCity: 'Pune', toCity: 'Goa',
    departureDate: soon(5), departureTime: '21:30', arrivalTime: '07:15', duration: '9h 45m',
    busOperator: 'Neeta Travels', busType: 'AC Sleeper (2+1)',
    boardingPoint: 'Shivajinagar, Pune', droppingPoint: 'Mapusa, Goa',
    passengers: [{ name: 'Jayesh Barapatre', gender: 'Male', age: 29, seat: 'L6', type: 'Adult' }],
    baseFare: 1200, taxes: 60, convenience: 40, totalAmount: 1300,
    paymentMethod: 'razorpay', transactionId: 'pay_QN5BdQmXcE8Th4'
  },
  cab: {
    ...common, type: 'cab',
    bookingId: 'MMT-CB-118803', pnr: 'CAB-556621',
    fromCity: 'IGI Airport, T3', toCity: 'Cyber Hub, Gurugram',
    pickupLocation: 'IGI Airport, T3', dropLocation: 'Cyber Hub, Gurugram',
    departureDate: soon(2), departureTime: '14:45',
    cabType: 'Sedan', cabModel: 'Maruti Suzuki Dzire', licensePlate: 'DL 3C AB 4521',
    driverName: 'Ramesh Kumar', distance: '23 km', estimatedTime: '45 min',
    travellers: { passengers: 1, type: 'Sedan' },
    baseFare: 720, taxes: 36, totalAmount: 756,
    paymentMethod: 'wallet', transactionId: 'pay_QN5CfLpNvW1Yu6'
  }
}

const written = []

for (const [type, booking] of Object.entries(samples)) {
  const { html, subject } = renderBookingConfirmation(booking)
  const file = resolve(OUT, `booking-${type}.html`)
  writeFileSync(file, html)
  written.push([`booking-${type}.html`, subject])
}

const welcome = renderWelcome({ name: 'Jayesh Barapatre', email: common.userEmail, createdAt: iso(Date.now()) })
writeFileSync(resolve(OUT, 'welcome.html'), welcome.html)
written.push(['welcome.html', welcome.subject])

for (const purpose of ['login', 'signup', 'password_reset']) {
  const otp = renderOtp({ otp: '482913', purpose, ttlMinutes: 5 })
  writeFileSync(resolve(OUT, `otp-${purpose}.html`), otp.html)
  written.push([`otp-${purpose}.html`, otp.subject])
}

const index = `<!doctype html><meta charset="utf-8"><title>Email template previews</title>
<style>
 body{font:15px/1.6 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1f2937}
 h1{font-size:22px} li{margin:8px 0} a{color:#1a73e8} code{color:#6b7280;font-size:13px}
</style>
<h1>Email template previews</h1>
<p>Rendered locally — nothing was sent.</p>
<ul>${written.map(([f, s]) => `<li><a href="./${f}">${f}</a><br><code>${s}</code></li>`).join('')}</ul>`

writeFileSync(resolve(OUT, 'index.html'), index)

console.log(`\n✅ Wrote ${written.length} previews to ${OUT}`)
console.log(`   Open: ${resolve(OUT, 'index.html')}\n`)
written.forEach(([f, s]) => console.log(`   • ${f.padEnd(26)} ${s}`))
console.log('')
