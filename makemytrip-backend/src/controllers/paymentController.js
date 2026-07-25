import Razorpay from 'razorpay'
import crypto from 'crypto'
import prisma from '../config/prismaClient.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', notes = {} } = req.body

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required.' })
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay operates in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        ...notes,
        userId: req.user?._id || req.user?.id
      }
    }

    const order = await razorpay.orders.create(options)

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    })
  } catch (err) {
    console.error('Razorpay order creation error:', err)
    res.status(500).json({ message: 'Failed to create payment order', error: err.message })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, bookingData } = req.body

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Missing payment verification details' })
    }

    const hmac = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    const isValidSignature = hmac === signature

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      })
    }

    // Create booking if payment data provided
    let booking = null
    if (bookingData) {
      const db = req.mockPrisma || prisma
      const userId = req.userId || req.user?.id || bookingData.userId
      const {
        type = 'flight',
        fromCity,
        toCity,
        departureDate,
        returnDate,
        travellers,
        totalAmount,
        baseFare,
        taxes,
        convenience,
        discount,
        gst,
        paymentMethod,
        userEmail,
        userName,
        ...otherData
      } = bookingData

      const bookingId = 'MMT-' + (type === 'hotel' ? 'HT-' : 'FL-') + Math.floor(100000 + Math.random() * 900000)
      const pnr = (type === 'hotel' ? 'HTL-' : 'PNR-') + Math.floor(100000 + Math.random() * 900000)

      booking = await db.booking.create({
        data: {
          userId,
          type,
          fromCity: fromCity || 'Unknown',
          toCity: toCity || 'Unknown',
          departureDate: departureDate || new Date().toISOString().split('T')[0],
          returnDate: returnDate || null,
          travellers: travellers || {},
          totalAmount: parseFloat(totalAmount),
          bookingId,
          pnr,
          status: 'confirmed',
          baseFare: baseFare || parseFloat(totalAmount) * 0.8,
          taxes: taxes || parseFloat(totalAmount) * 0.15,
          convenience: convenience || 0,
          discount: discount || 0,
          gst: gst || parseFloat(totalAmount) * 0.05,
          paymentMethod: paymentMethod || 'razorpay',
          paymentStatus: 'completed',
          transactionId: paymentId,
          ...otherData
        }
      })

      // Send confirmation email
      try {
        sendBookingConfirmationEmail({
          ...booking,
          userEmail: userEmail || booking.userEmail,
          userName: userName || booking.userName
        })
      } catch (emailErr) {
        console.warn('Email notification failed (non-critical):', emailErr.message)
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId,
        paymentId,
        booking: booking || { message: 'No booking data provided' }
      }
    })
  } catch (err) {
    console.error('Payment verification error:', err)
    res.status(500).json({ message: 'Payment verification failed', error: err.message })
  }
}
