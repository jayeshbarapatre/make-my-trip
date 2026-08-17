import { sendMail, verifyConnection, isConfigured } from './email/mailer.js'
import { renderBookingConfirmation } from './email/templates/booking.js'
import { renderWelcome, renderOtp } from './email/templates/account.js'
import { renderLayout, heroBanner, card, row, esc } from './email/layout.js'
import { brand } from './email/brand.js'
import * as emailLogService from './email/emailLogService.js'
import { validateEmail } from '../utils/validation.js'
import { generateTicketPDF, generateInvoicePDF } from './email/pdfService.js'

export { validateEmail, verifyConnection, isConfigured }

/**
 * Single send path for every transactional email: writes a Firestore log,
 * sends, then records the real outcome. Never reports success without a messageId.
 */
const deliver = async ({ to, rendered, emailType, templateKey, userId, bookingId, payloadSnapshot, attachments }) => {
  if (!to || !validateEmail(to)) {
    const message = `Invalid recipient email address: ${to || '(empty)'}`
    console.error(`❌ ${emailType}: ${message}`)
    return { success: false, error: message, code: 'EINVALIDRECIPIENT' }
  }

  let log = null
  try {
    log = await emailLogService.createLog({
      emailType,
      templateKey: templateKey || emailType,
      recipientEmail: to,
      subject: rendered.subject,
      userId,
      bookingId,
      payloadSnapshot
    })
    await emailLogService.markSending(log.id)
  } catch (err) {
    // Logging is observability, not delivery — a Firestore hiccup must not block the email.
    console.warn(`⚠️ Email log unavailable (${err.message}); sending anyway`)
  }

  try {
    const result = await sendMail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments
    })
    if (log) await emailLogService.markSent(log.id, result.response, result.messageId, result.attempts)
    return { success: true, ...result, logId: log?.id }
  } catch (err) {
    if (log) await emailLogService.markFailed(log.id, err.message)
    return { success: false, error: err.message, code: err.code, logId: log?.id }
  }
}

export const sendBookingConfirmationEmail = async (booking, opts = {}) => {
  const to = booking?.userEmail || booking?.email || booking?.contact?.email
  const rendered = renderBookingConfirmation(booking, opts)

  const attachments = [...(opts.attachments || [])]

  try {
    const typeCode = (booking.type || 'booking').toUpperCase().substring(0, 2)
    const ticketId = `TRP-${typeCode}-${booking.bookingId || Date.now().toString().slice(-6)}`
    
    const [ticketPdf, invoicePdf] = await Promise.all([
      generateTicketPDF(booking),
      generateInvoicePDF(booking, `INV-${ticketId}`)
    ])

    attachments.push({
      filename: `Ticket-${ticketId}.pdf`,
      content: ticketPdf,
      contentType: 'application/pdf'
    })
    
    attachments.push({
      filename: `Invoice-INV-${ticketId}.pdf`,
      content: invoicePdf,
      contentType: 'application/pdf'
    })
  } catch (err) {
    console.error('Failed to generate PDF attachments:', err.message)
  }

  return deliver({
    to,
    rendered,
    emailType: 'booking_confirmation',
    templateKey: `booking_confirmation_${(booking?.type || 'flight').toLowerCase()}`,
    userId: booking?.userId,
    bookingId: booking?.bookingId,
    payloadSnapshot: {
      bookingId: booking?.bookingId,
      pnr: booking?.pnr,
      type: booking?.type,
      totalAmount: booking?.totalAmount,
      status: booking?.status
    },
    attachments
  })
}

export const sendWelcomeEmail = async (user) =>
  deliver({
    to: user?.email,
    rendered: renderWelcome(user),
    emailType: 'welcome',
    userId: user?.id,
    payloadSnapshot: { name: user?.name, email: user?.email }
  })

export const sendOTPEmail = async (email, otp, purpose = 'verify', ttlMinutes = 5) =>
  deliver({
    to: email,
    rendered: renderOtp({ otp, purpose, ttlMinutes }),
    emailType: 'otp',
    templateKey: `otp_${purpose}`,
    // The code itself is deliberately never persisted to the log.
    payloadSnapshot: { purpose, ttlMinutes }
  })

export const sendAdminContactNotification = async (inquiry) => {
  const adminEmail = process.env.ADMIN_EMAIL || brand.supportEmail
  const rendered = {
    subject: `New contact inquiry from ${inquiry?.name || 'a visitor'}`,
    html: renderLayout({
      preheader: `${inquiry?.subject || 'New inquiry'} — from ${inquiry?.email || 'unknown'}`,
      hero: heroBanner({ title: 'Contact Form', subtitle: 'New inquiry received', color: brand.primary }),
      body: `
        ${card('Inquiry', [
          row('Name', inquiry?.name),
          row('Email', inquiry?.email),
          row('Phone', inquiry?.phone),
          row('Subject', inquiry?.subject)
        ])}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
          style="border:1px solid ${brand.line};border-radius:10px;margin:0 0 16px;">
          <tr><td style="padding:14px 18px;background:${brand.wash};border-bottom:1px solid ${brand.line};
            font:700 12px/1 Arial,Helvetica,sans-serif;color:${brand.primary};letter-spacing:.8px;
            text-transform:uppercase;">Message</td></tr>
          <tr><td style="padding:16px 18px;font:400 13px/1.7 Arial,Helvetica,sans-serif;
            color:${brand.ink};white-space:pre-wrap;">${esc(inquiry?.message || '')}</td></tr>
        </table>`
    }),
    text: `New contact inquiry\n\nName: ${inquiry?.name}\nEmail: ${inquiry?.email}\nPhone: ${inquiry?.phone || '—'}\nSubject: ${inquiry?.subject}\n\n${inquiry?.message}`
  }

  return deliver({
    to: adminEmail,
    rendered,
    emailType: 'contact_inquiry',
    payloadSnapshot: { name: inquiry?.name, email: inquiry?.email, subject: inquiry?.subject }
  })
}

export const getEmailMode = () => ({
  configured: isConfigured(),
  host: process.env.SMTP_HOST || null,
  from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || null,
  description: 'Email is delivered to each recipient\'s real address'
})

export default {
  sendBookingConfirmationEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendAdminContactNotification,
  getEmailMode,
  verifyConnection,
  isConfigured,
  validateEmail
}
