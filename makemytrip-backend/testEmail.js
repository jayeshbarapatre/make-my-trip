import { sendBookingConfirmationEmail } from './src/services/emailService.js';
import dotenv from 'dotenv';
dotenv.config();

const dummyBooking = {
  bookingId: "MMT-TR-123456",
  pnr: "PNR-1234567890",
  type: "train",
  fromCity: "New Delhi",
  toCity: "Mumbai",
  departureDate: "2026-05-18",
  totalAmount: 4290,
  travellers: {
    contact: {
      email: process.env.SMTP_USER // Send to self for testing
    }
  }
};

console.log("Testing email using SMTP_USER:", process.env.SMTP_USER);

sendBookingConfirmationEmail(dummyBooking).then(success => {
  if (success) {
    console.log("Test email sent successfully!");
  } else {
    console.log("Test email failed.");
  }
  process.exit(0);
});
