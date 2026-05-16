import prisma from '../config/prismaClient.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

export const createBooking = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id || req.body.userId || "usr_1111-2222-3333-4444"
    const { 
      type = "flight", 
      fromCity = "Delhi", 
      toCity = "Bengaluru", 
      departureDate = "2026-05-20", 
      returnDate = null, 
      travellers = { adults: 1 }, 
      totalAmount = 5999,
      contact = null,
      userEmail = null
    } = req.body

    const bookingId = "MMT-" + (type === "hotel" ? "HT-" : "FL-") + Math.floor(100000 + Math.random() * 900000)
    const pnr = (type === "hotel" ? "HTL-" : "PNR-") + Math.floor(100000 + Math.random() * 900000)

    const newBooking = await prisma.booking.create({
      data: {
        userId,
        type,
        fromCity,
        toCity,
        departureDate,
        returnDate,
        travellers,
        totalAmount,
        bookingId,
        pnr
      }
    })

    // Attach extracted email info for the email service
    if (userEmail) newBooking.userEmail = userEmail;
    if (contact) newBooking.contact = contact;
    if (req.user?.email) newBooking.userEmail = req.user.email;

    // Send confirmation email asynchronously (no need to await)
    sendBookingConfirmationEmail(newBooking)

    res.status(201).json({ success: true, data: newBooking })
  } catch (err) {
    console.error("Create booking error:", err)
    res.status(500).json({ message: err.message })
  }
}

export const getUserBookings = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.userId || req.user?.id || "usr_1111-2222-3333-4444"
    const bookings = await prisma.booking.findMany({ where: { userId: targetUserId } })

    res.json({ success: true, data: bookings })
  } catch (err) {
    console.error("Get user bookings error:", err)
    res.status(500).json({ message: err.message })
  }
}

export const getBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id, bookingId: req.params.id } })
    if (!booking) return res.status(404).json({ message: "Booking not found." })

    res.json({ success: true, data: booking })
  } catch (err) {
    console.error("Get booking error:", err)
    res.status(500).json({ message: err.message })
  }
}

export const cancelBooking = async (req, res) => {
  try {
    const updated = await prisma.booking.update({ where: { id: req.params.id }, data: { status: "cancelled" } })
    if (!updated) return res.status(404).json({ message: "Booking not found." })
    saveMockDb()

    res.json({ success: true, data: updated, message: "Booking cancelled successfully." })
  } catch (err) {
    console.error("Cancel booking error:", err)
    res.status(500).json({ message: err.message })
  }
}
