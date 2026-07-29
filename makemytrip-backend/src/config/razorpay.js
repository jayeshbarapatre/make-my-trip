import Razorpay from 'razorpay'

// Single shared client. Constructing Razorpay with undefined keys yields an
// object that fails at the first API call with an opaque error, so callers get
// null instead and can return 503 up front.

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

export const isGatewayConfigured = Boolean(KEY_ID && KEY_SECRET)

export const razorpay = isGatewayConfigured
  ? new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  : null

export const razorpayKeySecret = KEY_SECRET

if (!isGatewayConfigured) {
  console.warn('⚠️ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment and refund endpoints will return 503')
}

// Razorpay works in the minor unit (paise); everything we persist is in rupees.
export const paiseToRupees = (paise) => Math.round(paise) / 100
export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100)
