// Default email templates — seeded into DB and used as fallback
// All templates are responsive HTML with inline styles (Gmail/Outlook safe)

const BRAND_COLOR = '#003580'
const ACCENT_COLOR = '#e63946'

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  color: #333;
`

const HEADER_STYLE = `
  background: ${BRAND_COLOR};
  color: white;
  padding: 20px;
  text-align: center;
  border-radius: 8px 8px 0 0;
`

const TABLE_STYLE = `
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  background: white;
`

const TD_STYLE = `
  padding: 12px;
  border: 1px solid #eee;
`

const BUTTON_STYLE = `
  display: inline-block;
  background: ${BRAND_COLOR};
  color: white;
  padding: 12px 30px;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
  margin: 20px 0;
`

const FOOTER_STYLE = `
  background: #f9f9f9;
  padding: 15px;
  text-align: center;
  border-top: 1px solid #ddd;
  font-size: 12px;
  color: #666;
`

export const DEFAULT_TEMPLATES = {
  booking_confirmation_flight: {
    key: 'booking_confirmation_flight',
    name: 'Flight Booking Confirmation',
    module: 'flight',
    subject: 'Flight Booking Confirmed - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Flight Booking Confirmed ✓</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>Your flight booking has been successfully confirmed!</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>PNR:</strong></td>
        <td style="${TD_STYLE}">{{pnr}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Airline:</strong></td>
        <td style="${TD_STYLE}">{{airlineName}} {{flightNumber}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Route:</strong></td>
        <td style="${TD_STYLE}">{{fromCity}} → {{toCity}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Departure:</strong></td>
        <td style="${TD_STYLE}">{{date departureDate 'long'}} at {{time departureTime}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Arrival:</strong></td>
        <td style="${TD_STYLE}">{{time arrivalTime}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Total Fare:</strong></td>
        <td style="${TD_STYLE}"><strong>{{currency totalAmount}}</strong></td>
      </tr>
    </table>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Fare Breakdown:</h3>
      <table style="${TABLE_STYLE}">
        <tr>
          <td style="${TD_STYLE}">Base Fare:</td>
          <td style="${TD_STYLE}">{{currency baseFare}}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="${TD_STYLE}">Taxes & Fees:</td>
          <td style="${TD_STYLE}">{{currency taxes}}</td>
        </tr>
        <tr>
          <td style="${TD_STYLE}">Convenience Fee:</td>
          <td style="${TD_STYLE}">{{currency convenience}}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="${TD_STYLE}"><strong>Total:</strong></td>
          <td style="${TD_STYLE}"><strong>{{currency totalAmount}}</strong></td>
        </tr>
      </table>
    </div>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>✓ Payment Confirmed</strong><br>Your payment has been received successfully. E-ticket sent separately.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">View Booking</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Need Help?</strong><br>Contact us at {{supportEmail}}</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
    <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply.</p>
  </div>
</div>
    `,
    variables: ['bookingId', 'pnr', 'userName', 'airlineName', 'flightNumber', 'fromCity', 'toCity', 'departureDate', 'departureTime', 'arrivalTime', 'baseFare', 'taxes', 'convenience', 'totalAmount', 'supportEmail']
  },

  booking_confirmation_hotel: {
    key: 'booking_confirmation_hotel',
    name: 'Hotel Booking Confirmation',
    module: 'hotel',
    subject: 'Hotel Booking Confirmed - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Hotel Booking Confirmed ✓</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>Your hotel reservation has been successfully confirmed!</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Confirmation ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Hotel:</strong></td>
        <td style="${TD_STYLE}">{{hotelName}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Location:</strong></td>
        <td style="${TD_STYLE}">{{toCity}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Check-in:</strong></td>
        <td style="${TD_STYLE}">{{date departureDate 'long'}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Check-out:</strong></td>
        <td style="${TD_STYLE}">{{date returnDate 'long'}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Nights:</strong></td>
        <td style="${TD_STYLE}">{{nights}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Total Cost:</strong></td>
        <td style="${TD_STYLE}"><strong>{{currency totalAmount}}</strong></td>
      </tr>
    </table>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Price Breakdown:</h3>
      <table style="${TABLE_STYLE}">
        <tr>
          <td style="${TD_STYLE}">Room Rate:</td>
          <td style="${TD_STYLE}">{{currency baseFare}}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="${TD_STYLE}">Taxes ({{taxRate}}%):</td>
          <td style="${TD_STYLE}">{{currency taxes}}</td>
        </tr>
        <tr>
          <td style="${TD_STYLE}">Service Fee:</td>
          <td style="${TD_STYLE}">{{currency convenience}}</td>
        </tr>
        <tr style="background: #f9f9f9;">
          <td style="${TD_STYLE}"><strong>Total:</strong></td>
          <td style="${TD_STYLE}"><strong>{{currency totalAmount}}</strong></td>
        </tr>
      </table>
    </div>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>✓ Payment Confirmed</strong><br>Your payment has been received. Confirmation sent to the hotel.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">View Reservation</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Questions?</strong><br>Contact our support team at {{supportEmail}}</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
    <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply.</p>
  </div>
</div>
    `,
    variables: ['bookingId', 'userName', 'hotelName', 'toCity', 'departureDate', 'returnDate', 'nights', 'baseFare', 'taxes', 'taxRate', 'convenience', 'totalAmount', 'supportEmail']
  },

  booking_confirmation_bus: {
    key: 'booking_confirmation_bus',
    name: 'Bus Booking Confirmation',
    module: 'bus',
    subject: 'Bus Ticket Confirmed - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Bus Ticket Confirmed ✓</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>Your bus ticket has been successfully booked!</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Operator:</strong></td>
        <td style="${TD_STYLE}">{{airlineName}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Route:</strong></td>
        <td style="${TD_STYLE}">{{fromCity}} to {{toCity}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Date:</strong></td>
        <td style="${TD_STYLE}">{{date departureDate 'long'}} at {{time departureTime}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Passengers:</strong></td>
        <td style="${TD_STYLE}">{{passengerCount}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Total Fare:</strong></td>
        <td style="${TD_STYLE}"><strong>{{currency totalAmount}}</strong></td>
      </tr>
    </table>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>✓ Booking Confirmed</strong><br>Your ticket details are below. Keep this email for your records.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">Download Ticket</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Support:</strong><br>{{supportEmail}}</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['bookingId', 'userName', 'airlineName', 'fromCity', 'toCity', 'departureDate', 'departureTime', 'passengerCount', 'totalAmount', 'supportEmail']
  },

  booking_confirmation_cab: {
    key: 'booking_confirmation_cab',
    name: 'Cab Booking Confirmation',
    module: 'cab',
    subject: 'Cab Ride Confirmed - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Cab Ride Confirmed ✓</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>Your cab ride has been successfully booked!</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Confirmation ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Pickup:</strong></td>
        <td style="${TD_STYLE}">{{fromCity}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Drop-off:</strong></td>
        <td style="${TD_STYLE}">{{toCity}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Vehicle:</strong></td>
        <td style="${TD_STYLE}">{{airlineName}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Total Fare:</strong></td>
        <td style="${TD_STYLE}"><strong>{{currency totalAmount}}</strong></td>
      </tr>
    </table>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>✓ Ride Confirmed</strong><br>Driver details will be sent shortly.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">Track Ride</a>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['bookingId', 'userName', 'fromCity', 'toCity', 'airlineName', 'totalAmount', 'supportEmail']
  },

  booking_confirmation_train: {
    key: 'booking_confirmation_train',
    name: 'Train Ticket Confirmation',
    module: 'train',
    subject: 'Train Ticket Confirmed - {{pnr}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Train Ticket Confirmed ✓</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>Your train ticket has been successfully booked!</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>PNR:</strong></td>
        <td style="${TD_STYLE}">{{pnr}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Route:</strong></td>
        <td style="${TD_STYLE}">{{fromCity}} to {{toCity}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Date of Journey:</strong></td>
        <td style="${TD_STYLE}">{{date departureDate 'long'}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Departure:</strong></td>
        <td style="${TD_STYLE}">{{time departureTime}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Arrival:</strong></td>
        <td style="${TD_STYLE}">{{time arrivalTime}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Class:</strong></td>
        <td style="${TD_STYLE}">{{cabinClass}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Total Fare:</strong></td>
        <td style="${TD_STYLE}"><strong>{{currency totalAmount}}</strong></td>
      </tr>
    </table>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>✓ Ticket Confirmed</strong><br>Save your PNR and bring printed/mobile ticket to the railway station.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">View E-Ticket</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Important:</strong> Report 30 minutes before departure.</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['pnr', 'bookingId', 'userName', 'fromCity', 'toCity', 'departureDate', 'departureTime', 'arrivalTime', 'cabinClass', 'totalAmount']
  },

  welcome: {
    key: 'welcome',
    name: 'Welcome Email',
    module: 'system',
    subject: 'Welcome to MakeMyTrip!',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">Welcome to MakeMyTrip!</h1>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Hi {{name}},</h2>
    <p>Your account has been successfully created! You're now ready to explore amazing travel deals.</p>

    <h3 style="color: ${BRAND_COLOR};">What You Can Do:</h3>
    <ul style="line-height: 1.8;">
      <li>✈️ <strong>Book Flights:</strong> Search & book flights to thousands of destinations</li>
      <li>🏨 <strong>Reserve Hotels:</strong> Find & book hotels worldwide</li>
      <li>🚌 <strong>Book Buses:</strong> Easy intercity transportation</li>
      <li>🚕 <strong>Book Cabs:</strong> Convenient local rides</li>
      <li>🚂 <strong>Book Trains:</strong> Comfortable rail journeys</li>
      <li>💳 <strong>Secure Payments:</strong> Multiple payment options</li>
    </ul>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}" style="${BUTTON_STYLE}">Start Exploring</a>
    </div>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Pro Tip:</strong> Download our mobile app for exclusive deals and better prices!</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['name', 'email']
  },

  otp_verification: {
    key: 'otp_verification',
    name: 'OTP Verification',
    module: 'system',
    subject: 'Your MakeMyTrip Verification Code',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Verification Code</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <p>Hello,</p>
    <p>We received a request to verify your email address. Use the code below to complete your verification:</p>

    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid ${BRAND_COLOR};">
      <h2 style="color: ${ACCENT_COLOR}; letter-spacing: 4px; margin: 0; font-size: 36px; font-family: monospace;">{{otp}}</h2>
    </div>

    <p style="color: #666; font-size: 14px; text-align: center;"><strong>This code is valid for 10 minutes.</strong></p>

    <p style="color: #666;">If you did not request this verification, please ignore this email. Your account remains secure.</p>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Security Tip:</strong> Never share this code with anyone. We will never ask for this code via phone or email.</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['otp', 'email']
  },

  payment_receipt: {
    key: 'payment_receipt',
    name: 'Payment Receipt',
    module: 'system',
    subject: 'Payment Receipt - {{invoiceNumber}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Payment Receipt</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <p>Thank you for your payment! Here's your receipt:</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Invoice Number:</strong></td>
        <td style="${TD_STYLE}">{{invoiceNumber}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Amount:</strong></td>
        <td style="${TD_STYLE}">{{currency totalAmount}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Payment Method:</strong></td>
        <td style="${TD_STYLE}">{{capitalize paymentMethod}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Status:</strong></td>
        <td style="${TD_STYLE}"><span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px;">✓ Paid</span></td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Transaction ID:</strong></td>
        <td style="${TD_STYLE}">{{transactionId}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Date:</strong></td>
        <td style="${TD_STYLE}">{{date createdAt 'long'}}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">View Booking</a>
    </div>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>✓ Payment Successful</strong><br>Your booking is confirmed. E-ticket details sent separately.</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">Keep this receipt for your records.</p>
    <p style="margin: 5px 0 0 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['invoiceNumber', 'bookingId', 'totalAmount', 'paymentMethod', 'transactionId', 'createdAt']
  },

  booking_cancellation: {
    key: 'booking_cancellation',
    name: 'Booking Cancellation',
    module: 'system',
    subject: 'Booking Cancelled - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Booking Cancelled</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>Your booking has been cancelled as requested.</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Booking Type:</strong></td>
        <td style="${TD_STYLE}">{{capitalize bookingType}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Status:</strong></td>
        <td style="${TD_STYLE}"><span style="background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 4px;">Cancelled</span></td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Original Amount:</strong></td>
        <td style="${TD_STYLE}">{{currency totalAmount}}</td>
      </tr>
    </table>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Refund:</strong> If you paid, your refund will be processed within 3-5 business days. Refund details will be sent separately.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}" style="${BUTTON_STYLE}">New Booking</a>
    </div>

    <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Have feedback?</strong> We'd love to hear from you at {{supportEmail}}</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['userName', 'bookingId', 'bookingType', 'totalAmount', 'supportEmail']
  },

  refund_initiated: {
    key: 'refund_initiated',
    name: 'Refund Initiated',
    module: 'system',
    subject: 'Refund Initiated - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Refund Processing</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>We have initiated a refund for your cancelled booking.</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Refund Amount:</strong></td>
        <td style="${TD_STYLE}">{{currency refundAmount}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Status:</strong></td>
        <td style="${TD_STYLE}"><span style="background: #ffc107; color: #333; padding: 4px 8px; border-radius: 4px;">Processing</span></td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Expected Timeline:</strong></td>
        <td style="${TD_STYLE}">3-5 business days</td>
      </tr>
    </table>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>What's next:</strong> The amount will be refunded to your original payment method. Check your account statement after 5 days.</p>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Cancellation Charges (if any):</strong> Some bookings may have cancellation charges deducted as per the policy.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/support" style="${BUTTON_STYLE}">Track Refund</a>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['userName', 'bookingId', 'refundAmount', 'cancellationCharge']
  },

  refund_completed: {
    key: 'refund_completed',
    name: 'Refund Completed',
    module: 'system',
    subject: 'Refund Completed - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Refund Completed ✓</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Dear {{userName}},</h2>
    <p>Your refund has been successfully processed!</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Refunded Amount:</strong></td>
        <td style="${TD_STYLE}"><strong>{{currency refundAmount}}</strong></td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Status:</strong></td>
        <td style="${TD_STYLE}"><span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px;">✓ Completed</span></td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Refund Date:</strong></td>
        <td style="${TD_STYLE}">{{date refundDate 'long'}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Refund To:</strong></td>
        <td style="${TD_STYLE}">{{paymentMethod}}</td>
      </tr>
    </table>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>✓ Refund Successful</strong><br>The amount has been credited to your account. It may take 1-2 business days to reflect in your statement.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}" style="${BUTTON_STYLE}">Book Again</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Feedback:</strong> Help us improve! Share your experience at {{supportEmail}}</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">Thank you for choosing MakeMyTrip!</p>
    <p style="margin: 5px 0 0 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['userName', 'bookingId', 'refundAmount', 'refundDate', 'paymentMethod', 'supportEmail']
  },

  travel_reminder: {
    key: 'travel_reminder',
    name: 'Travel Reminder',
    module: 'system',
    subject: 'Travel Reminder - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Your Trip is Coming Up!</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Hi {{userName}},</h2>
    <p>Get ready for your upcoming trip! Here are your booking details:</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Booking ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Booking Type:</strong></td>
        <td style="${TD_STYLE}">{{capitalize bookingType}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Date:</strong></td>
        <td style="${TD_STYLE}">{{date travelDate 'long'}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>From:</strong></td>
        <td style="${TD_STYLE}">{{fromCity}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>To:</strong></td>
        <td style="${TD_STYLE}">{{toCity}}</td>
      </tr>
    </table>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Pre-Travel Checklist:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Download your e-ticket / confirmation</li>
        <li>Arrange your transportation to the station/airport</li>
        <li>Keep required ID/documents ready</li>
        <li>Reach at least 2 hours before departure</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">View Ticket</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Emergency?</strong> Contact us at {{supportEmail}}</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">Have a great trip!</p>
    <p style="margin: 5px 0 0 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['userName', 'bookingId', 'bookingType', 'travelDate', 'fromCity', 'toCity', 'supportEmail']
  },

  hotel_checkin_reminder: {
    key: 'hotel_checkin_reminder',
    name: 'Hotel Check-in Reminder',
    module: 'system',
    subject: 'Check-in Tomorrow - {{bookingId}}',
    htmlBody: `
<div style="max-width: 600px; margin: 0 auto; ${BASE_STYLES}">
  <div style="${HEADER_STYLE}">
    <h1 style="margin: 0;">MakeMyTrip</h1>
    <p style="margin: 10px 0 0 0;">Hotel Check-in Reminder</p>
  </div>

  <div style="padding: 20px; background: white; border: 1px solid #eee;">
    <h2>Hi {{userName}},</h2>
    <p>Your hotel check-in is tomorrow! Here are your reservation details:</p>

    <table style="${TABLE_STYLE}">
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Confirmation ID:</strong></td>
        <td style="${TD_STYLE}">{{bookingId}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Hotel:</strong></td>
        <td style="${TD_STYLE}">{{hotelName}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Check-in Date:</strong></td>
        <td style="${TD_STYLE}">{{date checkInDate 'long'}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Check-out Date:</strong></td>
        <td style="${TD_STYLE}">{{date checkOutDate 'long'}}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="${TD_STYLE}"><strong>Nights:</strong></td>
        <td style="${TD_STYLE}">{{nights}}</td>
      </tr>
      <tr>
        <td style="${TD_STYLE}"><strong>Check-in Time:</strong></td>
        <td style="${TD_STYLE}">{{checkInTime}}</td>
      </tr>
    </table>

    <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Quick Tips for Check-in:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Keep your confirmation email or booking ID ready</li>
        <li>Carry a valid ID for check-in</li>
        <li>Contact the hotel if you'll arrive late</li>
        <li>Check available room amenities and services</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${process.env.APP_BASE_URL || 'https://makemytrip.com'}/bookings" style="${BUTTON_STYLE}">View Booking</a>
    </div>

    <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Hotel Address:</strong><br>{{hotelAddress}}</p>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Need assistance?</strong> Contact {{supportEmail}}</p>
    </div>
  </div>

  <div style="${FOOTER_STYLE}">
    <p style="margin: 0;">Enjoy your stay!</p>
    <p style="margin: 5px 0 0 0;">© 2024 MakeMyTrip. All rights reserved.</p>
  </div>
</div>
    `,
    variables: ['userName', 'bookingId', 'hotelName', 'checkInDate', 'checkOutDate', 'nights', 'checkInTime', 'hotelAddress', 'supportEmail']
  }
}
