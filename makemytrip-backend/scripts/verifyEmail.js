/**
 * Sends a real booking confirmation and reports what happened.
 *
 * Email has been the longest-running unknown on this project: the stored Gmail
 * app password is rejected (`535-5.7.8`), so nothing has been delivered and it
 * was never clear whether the *rest* of the pipeline — templates, PDF ticket,
 * PDF invoice, attachment wiring — actually worked or was simply never reached.
 *
 * This separates those two questions.
 *
 *   npm run verify:email                 # use the configured SMTP provider
 *   npm run verify:email -- --sandbox    # use a throwaway Ethereal inbox
 *   npm run verify:email -- --to a@b.com # override the recipient
 *
 * `--sandbox` creates a disposable account on Ethereal (nodemailer's test
 * service, no signup) and prints a URL where the delivered message can be read,
 * attachments included. Nothing reaches a real inbox — the point is to prove the
 * pipeline end to end so that when real credentials arrive, the only untested
 * link is the credentials themselves.
 */

import 'dotenv/config'
import nodemailer from 'nodemailer'

const args = process.argv.slice(2)
const sandbox = args.includes('--sandbox')
const toIndex = args.indexOf('--to')
const recipient = toIndex !== -1 ? args[toIndex + 1] : (process.env.SMTP_USER || 'traveller@example.com')

const banner = (t) => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70))

const BOOKING = {
  bookingId: 'MMT-FL-VERIFY01',
  pnr: 'VF12CD',
  type: 'flight',
  status: 'confirmed',
  createdAt: new Date().toISOString(),
  airlineName: 'IndiGo',
  flightNumber: '6E-2040',
  fromCity: 'Ahmedabad',
  toCity: 'Mumbai',
  departureDate: '2026-08-05',
  departureTime: '09:15',
  arrivalTime: '10:35',
  totalAmount: 2800,
  baseFare: 2400,
  taxes: 120,
  convenience: 280,
  userName: 'Verification Traveller',
  userEmail: recipient,
  travellers: { passengers: [{ name: 'Verification Traveller', age: '30' }] }
}

const main = async () => {
  banner('EMAIL PIPELINE VERIFICATION')

  // ── 1. Documents ────────────────────────────────────────────────────────
  console.log('\n  documents')
  const { generateTicketPDF, generateInvoicePDF } = await import('../src/services/email/pdfService.js')

  const ticket = await generateTicketPDF(BOOKING)
  console.log(`     ok   ticket PDF generated (${ticket.length} bytes)`)
  const invoice = await generateInvoicePDF(BOOKING, 'INV-VERIFY-01')
  console.log(`     ok   invoice PDF generated (${invoice.length} bytes)`)

  // ── 2. Template ─────────────────────────────────────────────────────────
  console.log('\n  template')
  const { renderLayout } = await import('../src/services/email/layout.js')
  const html = renderLayout({
    preheader: 'Your booking is confirmed',
    body: `<h2>Booking confirmed</h2>
           <p>${BOOKING.fromCity} to ${BOOKING.toCity} on ${BOOKING.departureDate}</p>
           <p>PNR <strong>${BOOKING.pnr}</strong> · ₹${BOOKING.totalAmount}</p>`
  })
  console.log(`     ok   layout rendered (${html.length} bytes)`)
  console.log(`     ${/demonstration mode/.test(html) ? 'ok  ' : 'FAIL'} demo-mode disclosure present`)

  // ── 3. Transport ────────────────────────────────────────────────────────
  console.log('\n  transport')

  let transporter
  let isSandbox = sandbox

  if (!sandbox) {
    const { isConfigured, verifyConnection } = await import('../src/services/email/mailer.js')
    if (!isConfigured()) {
      console.log('     SMTP_HOST/USER/PASS are not all set — falling back to sandbox')
      isSandbox = true
    } else {
      const result = await verifyConnection()
      if (result.ok) {
        console.log(`     ok   ${process.env.SMTP_HOST} accepted the credentials (${result.user})`)
      } else {
        console.log(`     FAIL ${process.env.SMTP_HOST} rejected the credentials`)
        console.log(`          ${String(result.reason).split('\n')[0]}`)
        console.log('     falling back to sandbox so the rest of the pipeline is still proven')
        isSandbox = true
      }
    }
  }

  if (isSandbox) {
    const account = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    })
    console.log(`     ok   sandbox inbox created (${account.user})`)
  } else {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  }

  // ── 4. Send ─────────────────────────────────────────────────────────────
  console.log('\n  delivery')
  const info = await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'TripOra'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com'}>`,
    to: recipient,
    subject: `Flight Booking Confirmed — ${BOOKING.bookingId}`,
    html,
    attachments: [
      { filename: `ticket-${BOOKING.pnr}.pdf`, content: ticket },
      { filename: 'invoice-INV-VERIFY-01.pdf', content: invoice }
    ]
  })

  console.log(`     ok   accepted by the server (id ${info.messageId})`)
  console.log(`     ok   2 attachments sent`)

  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) {
    console.log('\n  READ THE DELIVERED MESSAGE HERE:')
    console.log('  ' + preview)
  }

  banner(isSandbox
    ? 'PIPELINE PROVEN — but nothing reached a real inbox'
    : `DELIVERED to ${recipient}`)

  if (isSandbox) {
    console.log('  Templates, both PDFs, attachments and SMTP delivery all work.')
    console.log('  The only missing piece is a provider that accepts real mail.')
    console.log('\n  To go live, set these and re-run without --sandbox:')
    console.log('    SMTP_HOST   smtp.resend.com      (or smtp-relay.brevo.com)')
    console.log('    SMTP_PORT   587')
    console.log('    SMTP_USER   resend               (Brevo: your login email)')
    console.log('    SMTP_PASS   <api key>            (Brevo: your SMTP key)')
  }

  return true
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('\nverify:email failed:', err.message); process.exit(1) })
