export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body
    if (!amount) return res.status(400).json({ message: "Amount is required." })

    const orderId = "order_rzp_" + Date.now() + "_" + Math.floor(Math.random() * 1000)
    res.json({
      success: true,
      data: {
        id: orderId,
        amount: Math.round(amount * 100), // Razorpay operates in paise
        currency,
        status: "created"
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
