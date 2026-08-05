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

/**
 * Secret for `POST /payment/webhook`. Razorpay signs webhook bodies with the
 * value configured in the dashboard, which is deliberately NOT the API key
 * secret — using the wrong one silently rejects every delivery.
 */
export const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

export const isWebhookConfigured = Boolean(razorpayWebhookSecret)

if (!isGatewayConfigured) {
  console.warn('⚠️ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment and refund endpoints will return 503')
}

if (!isWebhookConfigured) {
  console.warn(
    '⚠️ RAZORPAY_WEBHOOK_SECRET not set — payment webhooks will be rejected. ' +
    'Until it is, a customer who closes the tab after paying leaves money captured with no booking.'
  )
}

// Razorpay works in the minor unit (paise); everything we persist is in rupees.
export const paiseToRupees = (paise) => Math.round(paise) / 100
export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100)
