import nodemailer from 'nodemailer'

// ─── DEMO MODE CONFIGURATION ─────────────────────────────────────
const DEMO_MODE = process.env.EMAIL_DEMO_MODE === 'true'
const DEMO_EMAIL = process.env.DEMO_EMAIL_RECIPIENT || 'jayesh.barapatre@prakashinfotech.com'

const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  console.warn('⚠️ Email credentials not configured. Emails will be logged only.')
  return null
}

const transporter = createTransporter()

// ─── EMAIL VALIDATION ────────────────────────────────────────────
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email.trim())
}

export const sendBookingConfirmationEmail = async (booking) => {
  try {
    const userEmail = booking.userEmail || booking.email

    // Validate email format
    if (!userEmail || !validateEmail(userEmail)) {
      console.error('❌ Invalid email address:', userEmail)
      return { success: false, message: 'Invalid email address' }
    }

    if (!transporter) {
      console.log('📧 [TEST MODE] Booking confirmation email would be sent to:', userEmail)
      console.log('Booking Details:', { id: booking.bookingId, type: booking.type, amount: booking.totalAmount })
      return { messageId: 'test-' + Date.now(), success: true }
    }

    // ─── DEMO MODE: Override recipient email ──────────────────────
    const actualRecipient = DEMO_MODE ? DEMO_EMAIL : userEmail.trim().toLowerCase()

    const bookingType = booking.type === 'flight' ? 'Flight' : 'Hotel'
    const bookingDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // ─── LOG EMAIL REDIRECTION ───────────────────────────────────
    console.log(`📧 Email Service Log:`)
    console.log(`   • Mode: ${DEMO_MODE ? '🎯 DEMO' : '🚀 PRODUCTION'}`)
    console.log(`   • User Email (stored): ${userEmail.trim().toLowerCase()}`)
    console.log(`   • Actual Recipient: ${actualRecipient}`)
    console.log(`   • Booking ID: ${booking.bookingId}`)
    console.log(`   • Type: ${bookingType}`)

    const mailOptions = {
      from: `"MakeMyTrip" <${process.env.SMTP_USER}>`,
      to: actualRecipient,
      subject: `${bookingType} Booking Confirmation - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: #003580; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0;">MakeMyTrip</h1>
            <p style="margin: 10px 0 0 0;">${bookingType} Booking Confirmed ✓</p>
          </div>

          <div style="padding: 20px;">
            <h2>Dear ${booking.userName || 'Guest'},</h2>
            <p>Your ${bookingType.toLowerCase()} booking has been successfully confirmed!</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Booking ID:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${booking.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Reference (PNR):</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${booking.pnr || 'N/A'}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Total Amount:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Status:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">
                  <span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                    ${booking.status || 'Confirmed'}
                  </span>
                </td>
              </tr>
            </table>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Next Steps:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Check your booking details in the MakeMyTrip app</li>
                <li>Download your e-ticket/voucher</li>
                <li>Receive SMS updates about your booking</li>
                <li>Have a great trip!</li>
              </ul>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;">
                <strong>Need Help?</strong><br>
                Contact us at support@makemytrip.com or visit our website.
              </p>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p style="margin: 0;">
              <strong>Booking Confirmation Sent To:</strong> ${userEmail.trim().toLowerCase()}
            </p>
            <p style="margin: 5px 0 0 0;">
              © ${new Date().getFullYear()} MakeMyTrip. All rights reserved.
            </p>
            <p style="margin: 5px 0 0 0;">
              This is an automated email. Please do not reply to this email.
            </p>
            ${DEMO_MODE ? '<p style="margin: 5px 0 0 0; color: #ff6b6b;"><strong>[DEMO MODE]</strong> This is a demonstration booking.</p>' : ''}
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Booking confirmation email sent:', info.messageId)
    return {
      success: true,
      messageId: info.messageId,
      mode: DEMO_MODE ? 'DEMO' : 'PRODUCTION',
      userEmailStored: userEmail.trim().toLowerCase(),
      actualRecipient: actualRecipient
    }
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error.message)
    return {
      success: false,
      message: error.message,
      mode: DEMO_MODE ? 'DEMO' : 'PRODUCTION'
    }
  }
}

export const sendOTPEmail = async (email, otp) => {
  try {
    if (!transporter) {
      console.log(`📧 [TEST MODE] OTP email would be sent to ${email}: ${otp}`)
      return { messageId: 'test-' + Date.now() }
    }

    const mailOptions = {
      from: `"MakeMyTrip" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'MakeMyTrip - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #003580; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">MakeMyTrip</h1>
            <p style="margin: 10px 0 0 0;">Password Reset Code</p>
          </div>

          <div style="padding: 20px; background: #f9f9f9;">
            <p>Hello,</p>
            <p>We received a request to reset your MakeMyTrip account password.</p>

            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #003580;">
              <h2 style="color: #e63946; letter-spacing: 4px; margin: 0; font-size: 36px; font-family: monospace;">
                ${otp}
              </h2>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center;">
              <strong>This code is valid for 5 minutes.</strong>
            </p>

            <p style="color: #666;">
              If you did not request a password reset, please ignore this email. Your password will remain unchanged.
            </p>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;">
                <strong>Security Tip:</strong> Never share this code with anyone. MakeMyTrip support will never ask you for this code.
              </p>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">© ${new Date().getFullYear()} MakeMyTrip. All rights reserved.</p>
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ OTP email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message)
    throw error
  }
}

// ─── UTILITY: Get Email Mode ─────────────────────────────────────
export const getEmailMode = () => ({
  mode: DEMO_MODE ? 'DEMO' : 'PRODUCTION',
  demoEmail: DEMO_MODE ? DEMO_EMAIL : null,
  description: DEMO_MODE
    ? `All emails redirected to: ${DEMO_EMAIL}`
    : 'Emails sent to user addresses'
})

export const sendWelcomeEmail = async (user) => {
  try {
    if (!transporter) {
      console.log(`📧 [TEST MODE] Welcome email would be sent to ${user.email}`)
      return { messageId: 'test-' + Date.now(), success: true }
    }

    const mailOptions = {
      from: `"MakeMyTrip" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Welcome to MakeMyTrip!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #003580; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">Welcome to MakeMyTrip!</h1>
          </div>

          <div style="padding: 20px; background: #f9f9f9;">
            <p>Hi ${user.name},</p>
            <p>Your account has been successfully created! You're now ready to book flights, hotels, and more.</p>

            <h3 style="color: #003580;">What You Can Do:</h3>
            <ul style="line-height: 1.8;">
              <li>✈️ <strong>Book Flights:</strong> Search & book flights to thousands of destinations</li>
              <li>🏨 <strong>Reserve Hotels:</strong> Find & book hotels worldwide</li>
              <li>🚌 <strong>Book Buses & Cabs:</strong> Easy local transportation</li>
              <li>💳 <strong>Secure Payments:</strong> Multiple payment options available</li>
              <li>🎫 <strong>E-Tickets:</strong> Digital tickets & confirmations</li>
            </ul>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://makemytrip.com" style="background: #003580; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Start Exploring →
              </a>
            </div>

            <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;">
                <strong>Tip:</strong> Download the MakeMyTrip mobile app for better deals and exclusive offers!
              </p>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">Have questions? Contact support@makemytrip.com</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} MakeMyTrip. All rights reserved.</p>
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Welcome email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message)
  }
}

export const sendAdminContactNotification = async (inquiry) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@makemytrip.com'

    if (!transporter) {
      console.log(`📧 [TEST MODE] Contact inquiry notification would be sent to ${adminEmail}`)
      console.log('Inquiry:', inquiry)
      return { messageId: 'test-' + Date.now(), success: true }
    }

    const mailOptions = {
      from: `"MakeMyTrip" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `New Contact Inquiry from ${inquiry.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: #003580; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0;">New Contact Inquiry</h1>
          </div>

          <div style="padding: 20px;">
            <p>A new contact inquiry has been received from your website.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Name:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${inquiry.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Email:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Phone:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${inquiry.phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #eee;"><strong>Subject:</strong></td>
                <td style="padding: 10px; border: 1px solid #eee;">${inquiry.subject}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td colspan="2" style="padding: 10px; border: 1px solid #eee;"><strong>Message:</strong></td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; border: 1px solid #eee; white-space: pre-wrap;">${inquiry.message}</td>
              </tr>
            </table>

            <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;">
                <strong>Action Required:</strong> Please review and respond to this inquiry at your earliest convenience.
              </p>
            </div>
          </div>

          <div style="background: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} MakeMyTrip. All rights reserved.
            </p>
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Contact inquiry notification sent to admin:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending contact inquiry notification:', error.message)
    return { success: false, message: error.message }
  }
}
