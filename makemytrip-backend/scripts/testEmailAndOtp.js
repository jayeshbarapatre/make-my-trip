#!/usr/bin/env node
/**
 * End-to-end verification for the email + OTP stack.
 *
 *   npm run test:email                      → send every template to SMTP_USER
 *   npm run test:email -- you@example.com   → send them somewhere else
 *   npm run test:email -- you@example.com --sms +919876543210
 *
 * Every email here goes through the real SMTP transport. Nothing is mocked.
 */
import 'dotenv/config'

import { verifyConnection, sendBookingConfirmationEmail, sendWelcomeEmail, sendOTPEmail, getEmailMode } from '../src/services/emailService.js'
import * as otpService from '../src/services/otpService.js'
import { sendOtpSms, providerStatus, toE164 } from '../src/services/sms/smsService.js'

const args = process.argv.slice(2)
const smsFlag = args.indexOf('--sms')
const smsTarget = smsFlag > -1 ? args[smsFlag + 1] : null
const to = args.find(a => a.includes('@')) || process.env.SMTP_USER

const results = []
const record = (name, ok, detail) => {
  results.push({ name, ok, detail })
  console.log(`${ok ? '  ✅' : '  ❌'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const iso = (d) => new Date(d).toISOString()
const soon = (days) => iso(Date.now() + days * 86400000)

const BOOKINGS = {
  flight: {
    type: 'flight',
    bookingId: 'MMT-FL-480921', pnr: 'PNR-771204', status: 'confirmed',
    userName: 'Jayesh Barapatre', userEmail: to, userPhone: '+919876543210',
    fromCity: 'Delhi (DEL)', toCity: 'Mumbai (BOM)',
    departureDate: soon(12), departureTime: '06:20', arrivalTime: '08:35', duration: '2h 15m',
    airlineName: 'IndiGo', flightNumber: '6E-2043', fareClass: 'Economy', baggage: '15 kg check-in + 7 kg cabin',
    passengers: [
      { title: 'Mr', firstName: 'Jayesh', lastName: 'Barapatre', gender: 'Male', age: 29, seat: '12A', type: 'Adult' },
      { title: 'Ms', firstName: 'Riya', lastName: 'Sharma', gender: 'Female', age: 27, seat: '12B', type: 'Adult' }
    ],
    baseFare: 7400, taxes: 1180, convenience: 236, gst: 84, discount: 300, totalAmount: 8600,
    paymentMethod: 'upi', paymentStatus: 'completed', transactionId: 'pay_QN4x81LmTZa9Kd',
    createdAt: iso(Date.now())
  },

  hotel: {
    type: 'hotel',
    bookingId: 'MMT-HT-330514', pnr: 'HTL-889230', status: 'confirmed',
    userName: 'Jayesh Barapatre', userEmail: to, userPhone: '+919876543210',
    hotelName: 'The Leela Palace', hotelLocality: 'Diplomatic Enclave, Chanakyapuri, New Delhi',
    roomName: 'Royal Premiere King Room', rooms: 2, nights: 3,
    checkIn: soon(20), checkOut: soon(23), departureDate: soon(20), returnDate: soon(23),
    checkInTime: '2:00 PM onwards', checkOutTime: 'by 11:00 AM',
    travellers: { guests: 4, adults: 4, rooms: 2, nights: 3, roomName: 'Royal Premiere King Room' },
    passengers: [
      { name: 'Jayesh Barapatre', type: 'Adult' },
      { name: 'Riya Sharma', type: 'Adult' }
    ],
    baseFare: 42000, taxes: 7560, convenience: 0, gst: 0, discount: 2000, totalAmount: 47560,
    paymentMethod: 'credit_card', paymentStatus: 'completed', transactionId: 'pay_QN51ZzKpLm3Rd7',
    createdAt: iso(Date.now())
  },

  train: {
    type: 'train',
    bookingId: 'MMT-TR-661208', pnr: 'PNR-4471209', status: 'confirmed',
    userName: 'Jayesh Barapatre', userEmail: to, userPhone: '+919876543210',
    fromCity: 'New Delhi (NDLS)', toCity: 'Lucknow (LKO)',
    departureDate: soon(9), departureTime: '06:10', arrivalTime: '12:40', duration: '6h 30m',
    trainName: 'Shatabdi Express', trainNumber: '12004', travelClass: 'AC Chair Car (CC)', quota: 'General',
    passengers: [
      { name: 'Jayesh Barapatre', gender: 'Male', age: 29, seat: 'C4 / 42', type: 'Adult' },
      { name: 'Aarav Mehta', gender: 'Male', age: 34, seat: 'C4 / 43', type: 'Adult' }
    ],
    baseFare: 2400, taxes: 120, convenience: 60, gst: 0, discount: 0, totalAmount: 2580,
    paymentMethod: 'netbanking', paymentStatus: 'completed', transactionId: 'pay_QN5A7wRtYb2Qe1',
    createdAt: iso(Date.now())
  },

  bus: {
    type: 'bus',
    bookingId: 'MMT-BS-905417', pnr: 'BUS-220945', status: 'confirmed',
    userName: 'Jayesh Barapatre', userEmail: to, userPhone: '+919876543210',
    fromCity: 'Pune', toCity: 'Goa',
    departureDate: soon(5), departureTime: '21:30', arrivalTime: '07:15', duration: '9h 45m',
    busOperator: 'Neeta Travels', busType: 'AC Sleeper (2+1)',
    boardingPoint: 'Shivajinagar, Pune', droppingPoint: 'Mapusa, Goa',
    passengers: [
      { name: 'Jayesh Barapatre', gender: 'Male', age: 29, seat: 'L6', type: 'Adult' }
    ],
    baseFare: 1200, taxes: 60, convenience: 40, gst: 0, discount: 0, totalAmount: 1300,
    paymentMethod: 'razorpay', paymentStatus: 'completed', transactionId: 'pay_QN5BdQmXcE8Th4',
    createdAt: iso(Date.now())
  },

  cab: {
    type: 'cab',
    bookingId: 'MMT-CB-118803', pnr: 'CAB-556621', status: 'confirmed',
    userName: 'Jayesh Barapatre', userEmail: to, userPhone: '+919876543210',
    fromCity: 'Indira Gandhi International Airport, T3', toCity: 'Cyber Hub, Gurugram',
    pickupLocation: 'Indira Gandhi International Airport, T3', dropLocation: 'Cyber Hub, Gurugram',
    departureDate: soon(2), departureTime: '14:45',
    cabType: 'Sedan', cabModel: 'Maruti Suzuki Dzire', licensePlate: 'DL 3C AB 4521',
    driverName: 'Ramesh Kumar', distance: '23 km', estimatedTime: '45 min',
    travellers: { passengers: 1, type: 'Sedan' },
    baseFare: 720, taxes: 36, convenience: 0, gst: 0, discount: 0, totalAmount: 756,
    paymentMethod: 'wallet', paymentStatus: 'completed', transactionId: 'pay_QN5CfLpNvW1Yu6',
    createdAt: iso(Date.now())
  }
}

const run = async () => {
  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  EMAIL + OTP VERIFICATION')
  console.log('═══════════════════════════════════════════════════════\n')

  const mode = getEmailMode()
  console.log(`Recipient : ${to}`)
  console.log(`SMTP      : ${mode.host} as ${mode.from} [${mode.mode}]`)
  console.log(`SMS       : ${providerStatus().provider} (live: ${providerStatus().live})\n`)

  if (!to) {
    console.error('No recipient. Set SMTP_USER in .env or pass an address as an argument.')
    process.exit(1)
  }

  console.log('── 1. SMTP connection ──')
  const conn = await verifyConnection()
  record('SMTP handshake', conn.ok, conn.ok ? `${conn.user} via ${conn.host}` : conn.reason)
  if (!conn.ok) {
    console.error('\nSMTP is not reachable — aborting before sending.\n')
    process.exit(1)
  }

  console.log('\n── 2. Registration welcome email ──')
  const welcome = await sendWelcomeEmail({ id: 'user_test', name: 'Jayesh Barapatre', email: to, createdAt: iso(Date.now()) })
  record('Welcome email', welcome.success, welcome.success ? welcome.messageId : welcome.error)

  console.log('\n── 3. Booking confirmation emails ──')
  for (const [type, booking] of Object.entries(BOOKINGS)) {
    const res = await sendBookingConfirmationEmail(booking)
    record(`${type.padEnd(6)} confirmation`, res.success, res.success ? res.messageId : res.error)
  }

  console.log('\n── 4. OTP email ──')
  const otpMail = await sendOTPEmail(to, '482913', 'login', 5)
  record('OTP email', otpMail.success, otpMail.success ? otpMail.messageId : otpMail.error)

  console.log('\n── 5. OTP lifecycle (Firestore) ──')
  const identifier = `test_${Date.now()}@example.com`
  const opts = { identifier, channel: 'email', purpose: 'login' }

  const issued = await otpService.issueOtp(opts)
  record('Issue OTP', /^\d{6}$/.test(issued.otp), `${issued.otp.length} digits, TTL ${issued.ttlMinutes}m`)

  const wrong = await otpService.verifyOtp({ ...opts, otp: '000000' })
  record('Reject wrong code', !wrong.ok, wrong.code)

  const right = await otpService.verifyOtp({ ...opts, otp: issued.otp })
  record('Accept correct code', right.ok, right.ok ? 'verified' : right.code)

  const replay = await otpService.verifyOtp({ ...opts, otp: issued.otp })
  record('Reject reuse of consumed code', !replay.ok, replay.code)

  // Cooldown
  const c1 = { identifier: `cool_${Date.now()}@example.com`, channel: 'email', purpose: 'login' }
  await otpService.issueOtp(c1)
  let cooled = false, cooledMsg = ''
  try { await otpService.issueOtp(c1) } catch (e) { cooled = e.code === 'EOTPCOOLDOWN'; cooledMsg = e.message }
  record('Enforce resend cooldown', cooled, cooledMsg)
  await otpService.clearOtp(c1)

  // Expiry — write a already-expired document, then verify.
  const { db } = await import('../src/config/firebase.js')
  const e1 = { identifier: `exp_${Date.now()}@example.com`, channel: 'email', purpose: 'login' }
  const eIssued = await otpService.issueOtp(e1)
  const key = `login_email_${e1.identifier}`
  await db.collection('otps').doc(key).update({ expiresAt: new Date(Date.now() - 1000).toISOString() })
  const expired = await otpService.verifyOtp({ ...e1, otp: eIssued.otp })
  record('Reject expired code', !expired.ok && expired.code === 'OTP_EXPIRED', expired.code)

  // Attempt cap
  const a1 = { identifier: `att_${Date.now()}@example.com`, channel: 'email', purpose: 'login' }
  await otpService.issueOtp(a1)
  let lastCode = ''
  for (let i = 0; i < 6; i++) lastCode = (await otpService.verifyOtp({ ...a1, otp: '111111' })).code
  record('Cap incorrect attempts', lastCode === 'OTP_TOO_MANY_ATTEMPTS' || lastCode === 'OTP_NOT_FOUND', lastCode)
  await otpService.clearOtp(a1)

  console.log('\n── 6. SMS delivery ──')
  const sms = providerStatus()
  if (!smsTarget) {
    console.log(`  ⏭  Skipped (pass --sms +91XXXXXXXXXX to test). Provider: ${sms.provider}, live: ${sms.live}`)
  } else if (!toE164(smsTarget)) {
    record('SMS send', false, `"${smsTarget}" is not a valid number`)
  } else {
    try {
      const r = await sendOtpSms(smsTarget, '123987', 5)
      record(`SMS via ${r.provider}`, r.live, r.live ? `${r.messageId} (${r.status}) → ${r.masked}` : 'console driver — nothing delivered')
    } catch (e) {
      record('SMS send', false, `${e.code || ''} ${e.message}`)
    }
  }

  console.log('\n═══════════════════════════════════════════════════════')
  const passed = results.filter(r => r.ok).length
  console.log(`  ${passed}/${results.length} checks passed`)
  const failed = results.filter(r => !r.ok)
  if (failed.length) {
    console.log('\n  Failures:')
    failed.forEach(f => console.log(`    • ${f.name}: ${f.detail}`))
  }
  console.log('═══════════════════════════════════════════════════════\n')
  console.log(`Check the inbox at ${to} — expect 7 messages (welcome, 5 bookings, OTP).\n`)

  process.exit(failed.length ? 1 : 0)
}

run().catch(err => {
  console.error('\n💥 Test run crashed:', err)
  process.exit(1)
})
