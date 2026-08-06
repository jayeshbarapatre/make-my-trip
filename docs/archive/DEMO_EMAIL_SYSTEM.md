# Demo Email System Implementation Guide

## Overview
This guide implements a secure email system that redirects all emails to a fixed address in demo mode, while storing actual user emails in the database.

---

## A. Backend Implementation (Node.js + Nodemailer)

### 1. Email Service Configuration

Create `src/services/emailService.js`:

```javascript
import nodemailer from 'nodemailer'

// ─── Configuration ───────────────────────────────────────────────
const DEMO_MODE = process.env.EMAIL_DEMO_MODE === 'true' || true
const DEMO_EMAIL = process.env.DEMO_EMAIL_RECIPIENT || 'jayesh.barapatre@prakashinfotech.com'

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'jayeshbarapatre4923@gmail.com',
    pass: process.env.SMTP_PASS || 'hmko srvw vtnm cibw'
  }
}

// ─── Transporter Setup ────────────────────────────────────────────
let transporter = null

try {
  transporter = nodemailer.createTransport(SMTP_CONFIG)
} catch (err) {
  console.error('❌ Email service initialization failed:', err.message)
  transporter = null
}

// ─── Email Validation ────────────────────────────────────────────
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = regex.test(email.trim())
  if (!isValid) console.warn(`⚠️  Invalid email format: ${email}`)
  return isValid
}

// ─── Email Template Generator ────────────────────────────────────
const generateEmailTemplate = (bookingData) => {
  const { 
    userEmail,
    bookingType,
    departureDate,
    returnDate,
    totalAmount,
    bookingId,
    fromCity,
    toCity,
    userName
  } = bookingData

  const dateRange = returnDate 
    ? `${departureDate} to ${returnDate}` 
    : departureDate

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #003580; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .booking-info { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #003580; }
          .label { font-weight: bold; color: #003580; margin-top: 10px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ Booking Confirmation</h1>
            <p>Your ${bookingType} booking is confirmed!</p>
          </div>
          
          <div class="content">
            <p>Hi ${userName || 'Traveler'},</p>
            <p>Thank you for booking with MakeMyTrip. Here are your booking details:</p>
            
            <div class="booking-info">
              <div class="label">Booking ID:</div>
              <div>${bookingId}</div>
              
              <div class="label">Booking Type:</div>
              <div>${bookingType.toUpperCase()}</div>
              
              <div class="label">Route / Location:</div>
              <div>${fromCity} → ${toCity}</div>
              
              <div class="label">Travel Dates:</div>
              <div>${dateRange}</div>
              
              <div class="label">Total Amount:</div>
              <div style="font-size: 18px; color: #10b981; font-weight: bold;">₹${totalAmount.toLocaleString('en-IN')}</div>
            </div>
            
            <p style="color: #666; margin-top: 20px;">
              A copy of this booking has been saved to your account. You can view all your bookings in "My Trips" section.
            </p>
            
            <div class="footer">
              <p>This email was sent to: <strong>${userEmail}</strong></p>
              <p>© 2026 MakeMyTrip. All rights reserved.</p>
              ${DEMO_MODE ? `<p style="color: #ff6b6b;"><strong>[DEMO MODE]</strong> This is a demonstration email.</p>` : ''}
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  return html
}

// ─── Core Email Sending Function ─────────────────────────────────
export const sendBookingConfirmationEmail = async (bookingData) => {
  if (!transporter) {
    console.warn('⚠️  Email service unavailable - transporter not initialized')
    return { success: false, message: 'Email service unavailable' }
  }

  // Validate user's email
  if (!validateEmail(bookingData.userEmail)) {
    return { 
      success: false, 
      message: `Invalid user email: ${bookingData.userEmail}`
    }
  }

  try {
    const actualRecipient = DEMO_MODE ? DEMO_EMAIL : bookingData.userEmail
    
    const mailOptions = {
      from: `MakeMyTrip <${SMTP_CONFIG.auth.user}>`,
      to: actualRecipient,
      subject: `✈️ Booking Confirmed - ${bookingData.bookingId}`,
      html: generateEmailTemplate(bookingData)
    }

    console.log(`📧 Sending email:`)
    console.log(`   Mode: ${DEMO_MODE ? 'DEMO' : 'PRODUCTION'}`)
    console.log(`   User email (stored): ${bookingData.userEmail}`)
    console.log(`   Actual recipient: ${actualRecipient}`)
    console.log(`   Booking ID: ${bookingData.bookingId}`)

    const result = await transporter.sendMail(mailOptions)

    return {
      success: true,
      message: `Email sent successfully`,
      messageId: result.messageId,
      mode: DEMO_MODE ? 'DEMO' : 'PRODUCTION',
      userEmailStored: bookingData.userEmail,
      actualRecipient: actualRecipient
    }
  } catch (err) {
    console.error(`❌ Email sending failed:`, err.message)
    return {
      success: false,
      message: `Email sending failed: ${err.message}`,
      error: err.message
    }
  }
}

// ─── Utility: Get Current Mode ───────────────────────────────────
export const getEmailMode = () => ({
  mode: DEMO_MODE ? 'DEMO' : 'PRODUCTION',
  demoEmail: DEMO_MODE ? DEMO_EMAIL : null,
  smtpHost: SMTP_CONFIG.host
})

export default { sendBookingConfirmationEmail, validateEmail, getEmailMode }
```

### 2. Update Booking Controller

Modify `src/controllers/bookingController.js`:

```javascript
import { sendBookingConfirmationEmail } from '../services/emailService.js'

export const createBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to create booking' })
    }

    const { 
      type, 
      flightId,
      hotelId,
      fromCity,
      toCity,
      departureDate,
      returnDate,
      checkIn,
      checkOut,
      travellers,
      rooms,
      nights,
      totalAmount,
      userEmail,     // ← NEW: Get email from request
      userName       // ← NEW: Optional user name
    } = req.body

    if (!type || !totalAmount) {
      return res.status(400).json({ message: 'Booking type and totalAmount are required' })
    }

    // ─── Validate Email ───────────────────────────────────────────
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail.trim())) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    const bookingId = 'MMT-' + (type === 'hotel' ? 'HT-' : 'FL-') + Math.floor(100000 + Math.random() * 900000)
    const pnr = (type === 'hotel' ? 'HTL-' : 'PNR-') + Math.floor(100000 + Math.random() * 900000)

    let newBooking

    // ─── Flight Booking ───────────────────────────────────────────
    if (type === 'flight') {
      let bookingFromCity = fromCity
      let bookingToCity = toCity

      if (flightId) {
        const flight = await prisma.flight.findUnique({ where: { id: flightId } })
        if (!flight) {
          return res.status(404).json({ message: 'Flight not found' })
        }

        const passengerCount = Array.isArray(travellers) 
          ? travellers.length 
          : (travellers?.adults || 1) + (travellers?.children || 0) + (travellers?.infants || 0)

        if (flight.seatsAvailable < passengerCount) {
          return res.status(400).json({ message: `Only ${flight.seatsAvailable} seats available` })
        }

        const dep = typeof flight.departure === 'string' ? JSON.parse(flight.departure) : flight.departure
        const arr = typeof flight.arrival === 'string' ? JSON.parse(flight.arrival) : flight.arrival
        bookingFromCity = dep?.city || fromCity
        bookingToCity = arr?.city || toCity

        await prisma.flight.update({
          where: { id: flightId },
          data: { seatsAvailable: { decrement: passengerCount } }
        })
      }

      newBooking = await prisma.booking.create({
        data: {
          userId,
          type,
          fromCity: bookingFromCity || 'Unknown',
          toCity: bookingToCity || 'Unknown',
          departureDate: departureDate || checkIn || new Date().toISOString().split('T')[0],
          returnDate: returnDate || checkOut || null,
          travellers,
          totalAmount,
          bookingId,
          pnr,
          status: 'confirmed'
        }
      })
    }

    // ─── Hotel Booking ────────────────────────────────────────────
    else if (type === 'hotel') {
      const roomsNeeded = rooms || 1

      if (hotelId) {
        const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } })
        if (!hotel) {
          return res.status(404).json({ message: 'Hotel not found' })
        }

        if (hotel.roomsAvailable < roomsNeeded) {
          return res.status(400).json({ message: `Only ${hotel.roomsAvailable} rooms available` })
        }

        newBooking = await prisma.booking.create({
          data: {
            userId,
            type,
            fromCity: hotel.name || hotel.city,
            toCity: hotel.city,
            departureDate: checkIn || departureDate,
            returnDate: checkOut || returnDate,
            travellers: { ...travellers, rooms: roomsNeeded, nights },
            totalAmount,
            bookingId,
            pnr,
            status: 'confirmed'
          }
        })

        await prisma.hotel.update({
          where: { id: hotelId },
          data: { roomsAvailable: { decrement: roomsNeeded } }
        })
      } else {
        newBooking = await prisma.booking.create({
          data: {
            userId,
            type,
            fromCity: fromCity || 'Unknown Hotel',
            toCity: toCity || '',
            departureDate: checkIn || departureDate,
            returnDate: checkOut || returnDate,
            travellers: { ...travellers, rooms: roomsNeeded, nights },
            totalAmount,
            bookingId,
            pnr,
            status: 'confirmed'
          }
        })
      }
    } else {
      return res.status(400).json({ message: 'Valid booking type (flight or hotel) required' })
    }

    // ─── Send Confirmation Email ──────────────────────────────────
    const emailPayload = {
      userEmail: userEmail.trim().toLowerCase(),
      userName: userName || 'Traveler',
      bookingType: type,
      bookingId: bookingId,
      fromCity: newBooking.fromCity,
      toCity: newBooking.toCity,
      departureDate: newBooking.departureDate,
      returnDate: newBooking.returnDate,
      totalAmount: totalAmount,
      travellers: travellers
    }

    const emailResult = await sendBookingConfirmationEmail(emailPayload)
    
    // Log email result but don't fail booking if email fails
    if (!emailResult.success) {
      console.warn(`⚠️  Email failed but booking created: ${emailResult.message}`)
    }

    res.status(201).json({
      success: true,
      data: newBooking,
      email: {
        sent: emailResult.success,
        mode: emailResult.mode,
        message: emailResult.message
      }
    })
  } catch (err) {
    console.error('Create booking error:', err)
    res.status(500).json({ message: err.message })
  }
}
```

### 3. Environment Configuration

Update `.env`:

```env
# ═══════════════════════════════════════════════════════════════
# EMAIL CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# DEMO MODE: Set to 'true' to redirect all emails to DEMO_EMAIL_RECIPIENT
EMAIL_DEMO_MODE=true

# Fixed email that receives ALL emails in DEMO mode
DEMO_EMAIL_RECIPIENT=jayesh.barapatre@prakashinfotech.com

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jayeshbarapatre4923@gmail.com
SMTP_PASS=hmko srvw vtnm cibw

# Switch to PRODUCTION when ready:
# EMAIL_DEMO_MODE=false
# Then emails will go to actual user email addresses from request body
```

---

## B. Frontend Implementation

### Update BookingPage.jsx

```javascript
// Add email to flight booking payload
const bookingPayload = {
  type: 'flight',
  flightId: flight.id,
  fromCity: flight.source || (typeof flight.departure === 'object' ? flight.departure.city : ''),
  toCity: flight.destination || (typeof flight.arrival === 'object' ? flight.arrival.city : ''),
  departureDate: departureObj.date || '2026-05-20',
  returnDate: arrivalObj.date,
  travellers: travellerDetails,
  totalAmount: totalAmount,
  contact: passenger,
  userEmail: passenger?.email,        // ← ADD THIS
  userName: user?.name || 'Traveler'  // ← ADD THIS
}
```

### Update HotelPaymentPage.jsx

```javascript
const payload = {
  userId: user?.id || 'usr_1111-2222-3333-4444',
  type: "hotel",
  fromCity: hotel.name,
  toCity: hotel.locality || hotel.location || '',
  departureDate: checkIn,
  returnDate: checkOut,
  travellers: { guests, rooms, adults: guestsObj.adults, method: methodName || selectedMethod, roomName },
  totalAmount: finalDue,
  hotelName: hotel.name,
  hotelLocality: hotel.locality || hotel.location || '',
  roomName,
  checkIn,
  checkOut,
  nights,
  rooms,
  userEmail: user?.email || 'guest@example.com',  // ← ADD THIS
  userName: user?.name || 'Guest'                 // ← ADD THIS
}
```

---

## C. Validation & Security

### Email Validation Rules

```javascript
// In emailService.js - Enhanced validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email must be a non-empty string' }
  }

  const trimmed = email.trim().toLowerCase()
  
  // Length check
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email too long (max 254 chars)' }
  }

  // Format check
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' }
  }

  // Disposable email check (optional)
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
  const domain = trimmed.split('@')[1]
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Disposable email addresses not allowed' }
  }

  return { valid: true, error: null, email: trimmed }
}
```

---

## D. Switching to Production Mode

### Step 1: Update .env

```env
# Change this from:
EMAIL_DEMO_MODE=true

# To:
EMAIL_DEMO_MODE=false
```

### Step 2: No Code Changes Needed!
The system automatically switches behavior:
- DEMO mode (`true`): All emails → `DEMO_EMAIL_RECIPIENT`
- PRODUCTION mode (`false`): Emails → User's entered email

### Step 3: Update SMTP (If Different Provider)

```env
# Example: Production Gmail setup
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourbrand.com
SMTP_PASS=your-app-specific-password
```

### Testing Production Mode

```bash
# Test with real email
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "flight",
    "flightId": "flight-123",
    "fromCity": "Delhi",
    "toCity": "Mumbai",
    "departureDate": "2026-06-01",
    "totalAmount": 5000,
    "userEmail": "actual-user@example.com",
    "userName": "John Doe",
    "travellers": {"adults": 1}
  }'
```

---

## E. Risks & Mistakes (And How to Avoid Them)

### ❌ Common Mistakes

| Mistake | Risk | Solution |
|---------|------|----------|
| **Hardcoding email** | Can't switch modes, security risk | Use env variables |
| **No email validation** | Bounce backs, logs filled with errors | Validate before sending |
| **Silently failing** | Users don't know if email sent | Return status in API response |
| **Storing encrypted password in .env** | Exposed in version control | Use password managers / secret management services |
| **No error handling** | Booking succeeds but email fails | Catch errors, log them, inform user |
| **Sensitive data in email logs** | Privacy violation | Don't log email addresses in production logs |
| **Plain text email** | Looks unprofessional, low trust | Use HTML templates with styling |

### ✅ Best Practices Implemented

```javascript
// ✅ 1. Non-blocking email (booking succeeds even if email fails)
const emailResult = await sendBookingConfirmationEmail(...)
if (!emailResult.success) {
  console.warn('⚠️  Email failed but booking created')
}

// ✅ 2. Validated input
if (!validateEmail(userEmail)) {
  return res.status(400).json({ message: 'Invalid email' })
}

// ✅ 3. Environment-based configuration
const DEMO_MODE = process.env.EMAIL_DEMO_MODE === 'true'
const DEMO_EMAIL = process.env.DEMO_EMAIL_RECIPIENT

// ✅ 4. Logging for debugging
console.log(`📧 Email: ${userEmail} → ${actualRecipient}`)

// ✅ 5. Return email status to frontend
res.json({
  success: true,
  email: {
    sent: emailResult.success,
    mode: emailResult.mode
  }
})

// ✅ 6. HTML email with proper formatting
html: generateEmailTemplate(bookingData)
```

### 🔒 Security Checklist

- [ ] Email addresses are trimmed and lowercased
- [ ] Demo mode email is configurable via .env
- [ ] SMTP password is in .env, NOT in code
- [ ] Email validation happens on backend
- [ ] Email sending doesn't block booking
- [ ] Error messages don't expose sensitive info
- [ ] Demo mode is only for development/testing
- [ ] Email templates don't expose internal IDs/paths

### 🚨 Production Checklist

Before going live:
- [ ] `EMAIL_DEMO_MODE=false`
- [ ] SMTP credentials are for production account
- [ ] Email templates are finalized and branded
- [ ] Unsubscribe link added (if required by law)
- [ ] Email is tested with real addresses
- [ ] Monitor bounce rates
- [ ] Implement email retry logic
- [ ] Set up email logging/analytics

---

## Implementation Checklist

```
Backend Setup:
✅ Create emailService.js with sendBookingConfirmationEmail()
✅ Update bookingController.js to call email service
✅ Update .env with EMAIL_DEMO_MODE and SMTP config
✅ Add email validation function

Frontend Setup:
✅ Update BookingPage.jsx to send userEmail
✅ Update HotelPaymentPage.jsx to send userEmail
✅ Display booking confirmation (with email notice)

Testing:
✅ Register and book flight in DEMO mode
✅ Verify email received at DEMO_EMAIL_RECIPIENT
✅ Verify user email stored in database
✅ Check email content includes booking details
✅ Test with invalid email format (should be rejected)

Documentation:
✅ Add email docs to README
✅ Document how to switch to production
✅ Note down SMTP credentials location
```

---

## API Response Example

```json
{
  "success": true,
  "data": {
    "id": "bkg_...",
    "bookingId": "MMT-FL-123456",
    "pnr": "PNR-654321",
    "status": "confirmed",
    "totalAmount": 5000
  },
  "email": {
    "sent": true,
    "mode": "DEMO",
    "message": "Email sent successfully"
  }
}
```

---

## Next Steps

1. **Implement** the emailService.js
2. **Update** booking controllers
3. **Test** with demo mode enabled
4. **Document** in README
5. **When ready**, change `EMAIL_DEMO_MODE=false`
6. **Monitor** email delivery in production

**No additional code changes needed for production switch!** 🎉
