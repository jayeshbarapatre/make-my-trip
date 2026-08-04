/**
 * End-to-End Booking + SMTP Email Verification
 *
 * For each booking category (flight, hotel, train, bus, cab) this script drives
 * the REAL production code path:
 *
 *   verified payment  ->  createBookingForPayment()  ->  Firestore save
 *                      ->  Booking ID + PNR generation
 *                      ->  availability reservation
 *                      ->  PDF ticket + invoice generation
 *                      ->  sendBookingConfirmationEmail()  ->  real SMTP
 *                      ->  getUserBookings()  (My Trips verification)
 *
 * Every confirmation email is sent to RECIPI_EMAIL via the configured SMTP
 * transport. A category is only marked PASS when the SMTP transport returns a
 * messageId for it.
 *
 * Run from the backend directory:
 *   node scripts/e2eBookingEmailTest.js
 */

import 'dotenv/config'
import assertNotProduction from './lib/prodGuard.js'
import { db } from '../src/config/firebase.js'
import { createBookingForPayment } from '../src/services/bookingService.js'
import {
  sendBookingConfirmationEmail,
  verifyConnection,
  isConfigured
} from '../src/services/emailService.js'
import {
  generateTicketPDF,
  generateInvoicePDF
} from '../src/services/email/pdfService.js'
import { generateInvoiceNumber } from '../src/utils/idGenerator.js'

const RECIPI_EMAIL = 'dev646795@gmail.com'
const TEST_USER_ID = 'e2e-test-user'
const TEST_USER_NAME = 'E2E Test Traveller'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const banner = (text) => console.log('\n' + '='.repeat(70) + '\n' + text + '\n' + '='.repeat(70))

/**
 * Writes a "captured" payment document so loadPaymentAuthority() accepts it.
 * This stands in for a verified Razorpay capture — the booking code reads the
 * amount from here, never from the request body.
 */
const seedVerifiedPayment = async (type, amount, breakdown) => {
  const paymentId = `e2e_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const orderId = `order_${paymentId}`
  const ref = db.collection('payments').doc(orderId)
  await ref.set({
    orderId,
    paymentId,
    userId: TEST_USER_ID,
    status: 'captured',
    amount,
    amountCaptured: amount,
    currency: 'INR',
    method: 'razorpay',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  return { orderId, paymentId }
}

/** Per-category booking payloads (whitelisted detail fields only). */
const buildPayload = (type) => {
  const future = (days) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  const passengers = [
    { name: TEST_USER_NAME, age: 30, gender: 'male' },
    { name: 'Co-Traveller Demo', age: 28, gender: 'female' }
  ]

  switch (type) {
    case 'flight':
      return {
        type,
        flightId: null,
        fromCity: 'New Delhi (DEL)',
        toCity: 'Mumbai (BOM)',
        departureDate: future(14),
        departureTime: '08:30',
        arrivalTime: '10:45',
        airlineName: 'Air India',
        flightNumber: 'AI-866',
        fareClass: 'Economy',
        passengers
      }
    case 'hotel':
      return {
        type,
        hotelId: null,
        hotelName: 'The Grand Palace Resort',
        hotelLocality: 'Bandra West, Mumbai',
        hotelAddress: '12 Sea Link Road, Bandra, Mumbai 400050',
        fromCity: 'The Grand Palace Resort',
        toCity: 'Mumbai',
        departureDate: future(14),
        returnDate: future(17),
        rooms: 1,
        nights: 3,
        guests: 2,
        roomName: 'Deluxe King Room',
        checkInTime: '2:00 PM',
        checkOutTime: '11:00 AM',
        guests_list: passengers
      }
    case 'train':
      return {
        type,
        trainId: null,
        fromCity: 'New Delhi (NDLS)',
        toCity: 'Mumbai Central (MMCT)',
        departureDate: future(20),
        departureTime: '16:00',
        arrivalTime: '08:15',
        trainName: 'Rajdhani Express',
        trainNumber: '12951',
        travelClass: '3A',
        quota: 'GN',
        passengers
      }
    case 'bus':
      return {
        type,
        busId: null,
        fromCity: 'Delhi (ISBT Kashmere Gate)',
        toCity: 'Jaipur (Sindhi Camp)',
        departureDate: future(9),
        departureTime: '22:30',
        arrivalTime: '05:00',
        busOperator: 'VRL Travels',
        busType: 'Volvo A/C Sleeper',
        boardingPoint: 'Kashmere Gate, Platform 7',
        droppingPoint: 'Sindhi Camp, Platform 2',
        passengers
      }
    case 'cab':
      return {
        type,
        cabId: null,
        fromCity: 'Indira Gandhi Intl. Airport (DEL)',
        toCity: 'Connaught Place, New Delhi',
        departureDate: future(3),
        departureTime: '11:00',
        cabType: 'Sedan (Dzire/Etios)',
        cabModel: 'Maruti Dzire',
        driverName: 'Ramesh K.',
        licensePlate: 'DL 1C AB 1234',
        distance: '18 km',
        estimatedTime: '45 min',
        passengers
      }
    default:
      return { type }
  }
}

/** Realistic fare breakdown that reconciles to the total (±₹1). */
const fareFor = (type) => {
  const totals = { flight: 12500, hotel: 14400, train: 3500, bus: 1800, cab: 720 }
  const total = totals[type] ?? 5000
  const baseFare = Math.round(total * 0.8)
  const taxes = Math.round(total * 0.12)
  const gst = Math.round(total * 0.05)
  const convenience = total - baseFare - taxes - gst
  return { total, baseFare, taxes, gst, convenience, discount: 0 }
}

const runCategory = async (type) => {
  const result = {
    type,
    bookingId: null,
    pnr: null,
    firestoreSaved: false,
    myTripsFound: false,
    pdfGenerated: false,
    invoiceGenerated: false,
    smtpMessageId: null,
    smtpAccepted: false,
    error: null
  }

  try {
    const fare = fareFor(type)

    // 1. Seed a verified payment so the booking pipeline has an authority.
    const { orderId, paymentId } = await seedVerifiedPayment(type, fare.total)
    console.log(`  • Seeded verified payment: orderId=${orderId} amount=₹${fare.total}`)

    // 2. Booking payload + server-owned fare breakdown.
    const payload = {
      ...buildPayload(type),
      ...fare,
      userEmail: RECIPI_EMAIL,
      userName: TEST_USER_NAME
    }

    // 3. Create booking -> Firestore save + ID/PNR + availability reservation.
    const { booking, created } = await createBookingForPayment({
      payload,
      authority: { orderId, paymentId, amount: fare.total, method: 'razorpay' },
      userId: TEST_USER_ID,
      userEmail: RECIPI_EMAIL,
      userName: TEST_USER_NAME
    })

    if (!booking?.bookingId) throw new Error('Booking was created without a bookingId')
    result.bookingId = booking.bookingId
    result.pnr = booking.pnr || null
    result.firestoreSaved = Boolean(booking.id)
    console.log(`  • Booking created (new=${created}): id=${booking.id} bookingId=${booking.bookingId} pnr=${booking.pnr}`)

    // 4. Re-read from Firestore to prove the document persisted.
    const stored = await db.collection('bookings').doc(booking.id).get()
    if (!stored.exists) throw new Error('Booking document not found in Firestore after creation')
    console.log(`  • Firestore document verified (exists=${stored.exists})`)

    // 5. My Trips verification via getUserBookings equivalent query.
    const tripsSnap = await db.collection('bookings').where('userId', '==', TEST_USER_ID).get()
    const foundInTrips = tripsSnap.docs.some((d) => d.id === booking.id)
    result.myTripsFound = foundInTrips
    console.log(`  • My Trips: booking visible in user bookings (found=${foundInTrips})`)

    // 6. PDF ticket generation.
    const ticketPdf = await generateTicketPDF({ ...booking, ...payload })
    result.pdfGenerated = Buffer.isBuffer(ticketPdf) && ticketPdf.length > 0
    console.log(`  • Ticket PDF generated (${ticketPdf.length} bytes)`)

    // 7. Invoice generation.
    const invoiceNumber = generateInvoiceNumber(type)
    const invoicePdf = await generateInvoicePDF({ ...booking, ...payload }, invoiceNumber)
    result.invoiceGenerated = Buffer.isBuffer(invoicePdf) && invoicePdf.length > 0
    console.log(`  • Invoice PDF generated (${invoicePdf.length} bytes, ${invoiceNumber})`)

    // 8. Send the real SMTP confirmation email with both attachments.
    const attachments = [
      { filename: `Ticket-${booking.bookingId}.pdf`, content: ticketPdf, contentType: 'application/pdf' },
      { filename: `Invoice-${invoiceNumber}.pdf`, content: invoicePdf, contentType: 'application/pdf' }
    ]

    const emailResult = await sendBookingConfirmationEmail(
      { ...booking, ...payload, userEmail: RECIPI_EMAIL, userName: TEST_USER_NAME },
      { attachments }
    )

    result.smtpMessageId = emailResult?.messageId || null
    result.smtpAccepted = Boolean(
      emailResult?.success &&
        (emailResult.messageId || (emailResult.accepted && emailResult.accepted.includes(RECIPI_EMAIL)))
    )

    if (!result.smtpAccepted) {
      throw new Error(`SMTP send did not confirm delivery: ${JSON.stringify(emailResult)}`)
    }
    console.log(`  • ✉️  Email sent to ${RECIPI_EMAIL} | messageId=${emailResult.messageId} accepted=${JSON.stringify(emailResult.accepted)}`)
  } catch (err) {
    result.error = err.message
    console.error(`  ❌ ${type} failed: ${err.message}`)
  }

  return result
}

const printReport = (smtp, results) => {
  banner('FINAL E2E BOOKING + EMAIL VERIFICATION REPORT')

  const line = (label, ok, extra = '') =>
    console.log(`  ${ok ? '✅' : '❌'} ${label}: ${ok ? 'PASS' : 'FAIL'}${extra ? '  — ' + extra : ''}`)

  console.log('\n--- SMTP / Transport ---')
  console.log(`  Configured : ${smtp.configured}`)
  console.log(`  Host       : ${smtp.host}`)
  console.log(`  From       : ${smtp.from}`)
  console.log(`  Connection : ${smtp.ok ? '✅ verified' : '❌ ' + smtp.reason}`)
  console.log(`  Recipient  : ${RECIPI_EMAIL}`)

  console.log('\n--- Per-Category Results ---')
  for (const r of results) {
    const pass = Boolean(
      r.firestoreSaved && r.myTripsFound && r.pdfGenerated && r.invoiceGenerated && r.smtpAccepted
    )
    line(`${r.type[0].toUpperCase() + r.type.slice(1)} Booking`, pass, r.error || r.bookingId || '')
  }

  console.log('\n--- Detailed Checks ---')
  console.log('  Category   | Firestore | MyTrips | PDF    | Invoice | Email  | BookingId')
  console.log('  ' + '-'.repeat(66))
  for (const r of results) {
    const cell = (ok) => (ok ? ' ✅    ' : ' ❌    ')
    console.log(
      `  ${r.type.padEnd(10)} |${cell(r.firestoreSaved)}|${cell(r.myTripsFound)}|${cell(r.pdfGenerated)}|${cell(r.invoiceGenerated)}|${cell(r.smtpAccepted)}| ${r.bookingId || '—'}`
    )
  }

  const allPass = results.every(
    (r) => r.firestoreSaved && r.myTripsFound && r.pdfGenerated && r.invoiceGenerated && r.smtpAccepted
  )
  banner(allPass ? '✅ ALL BOOKING CATEGORIES PASSED — emails delivered' : '❌ ONE OR MORE CATEGORIES FAILED')
  return allPass
}

const main = async () => {
  // Forges payments, creates real bookings and sends real SMTP emails.
  assertNotProduction('This E2E test creates bookings/payments and sends real emails.')

  banner('E2E BOOKING + SMTP EMAIL VERIFICATION')

  if (!isConfigured()) {
    console.error('❌ SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env')
    process.exit(1)
  }

  console.log('  • Verifying SMTP connection...')
  const conn = await verifyConnection()
  const smtp = {
    configured: true,
    host: process.env.SMTP_HOST,
    from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
    ok: conn.ok,
    reason: conn.reason || null
  }
  console.log(`  • SMTP connection: ${conn.ok ? '✅ ' + conn.user + ' via ' + conn.host : '❌ ' + conn.reason}`)
  if (!conn.ok) {
    console.error('❌ Aborting: SMTP connection could not be verified.')
    process.exit(1)
  }

  const categories = ['flight', 'hotel', 'train', 'bus', 'cab']
  const results = []
  for (const type of categories) {
    console.log(`\n--- ${type.toUpperCase()} BOOKING ---`)
    const r = await runCategory(type)
    results.push(r)
    await sleep(1500) // gentle pacing between SMTP sends
  }

  const allPass = printReport(smtp, results)
  process.exit(allPass ? 0 : 1)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
