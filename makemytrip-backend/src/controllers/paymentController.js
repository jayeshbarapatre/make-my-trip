import Razorpay from 'razorpay'
import crypto from 'crypto'

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
    const { orderId, paymentId, signature } = req.body

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

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId,
        paymentId
      }
    })
  } catch (err) {
    console.error('Payment verification error:', err)
    res.status(500).json({ message: 'Payment verification failed', error: err.message })
  }
}
