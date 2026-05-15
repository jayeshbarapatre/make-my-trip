import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendBookingConfirmationEmail = async (booking) => {
  try {
    // Attempt to extract email from various possible payload structures
    let userEmail = booking.userEmail || booking.contact?.email || booking.travellers?.contact?.email;
    
    if (!userEmail) {
      console.log('No email address provided in booking contact info. Skipping email confirmation.');
      return false;
    }

    const mailOptions = {
      from: `"MakeMyTrip" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Booking Confirmation - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0;">MakeMyTrip</h1>
            <p style="color: #94a3b8; margin: 5px 0 0;">Booking Confirmed!</p>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #0f172a; margin-top: 0;">Hello,</h2>
            <p style="color: #475569;">Your booking has been successfully confirmed. Here are your details:</p>
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px;"><strong>Booking ID:</strong> ${booking.bookingId}</p>
              <p style="margin: 0 0 10px;"><strong>PNR:</strong> ${booking.pnr}</p>
              <p style="margin: 0 0 10px;"><strong>Type:</strong> ${booking.type.toUpperCase()}</p>
              <p style="margin: 0 0 10px;"><strong>Route:</strong> ${booking.fromCity} &rarr; ${booking.toCity}</p>
              <p style="margin: 0 0 10px;"><strong>Date:</strong> ${booking.departureDate}</p>
              <p style="margin: 0;"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
            </div>
            
            <p style="color: #475569;">Thank you for choosing MakeMyTrip!</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #64748b; font-size: 12px;">
            &copy; ${new Date().getFullYear()} MakeMyTrip. All rights reserved.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
};
