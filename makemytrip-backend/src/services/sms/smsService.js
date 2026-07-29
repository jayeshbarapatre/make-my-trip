import axios from 'axios'

/**
 * Normalises an Indian-first phone number to E.164.
 * Returns null when the input cannot be a valid mobile number.
 */
export const toE164 = (input, defaultCountry = process.env.SMS_DEFAULT_COUNTRY_CODE || '91') => {
  if (!input) return null
  const raw = String(input).trim()
  const hasPlus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null

  if (hasPlus) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null

  // Bare 10-digit Indian mobile
  if (digits.length === 10) return `+${defaultCountry}${digits}`
  // Already carries the country code
  if (digits.length > 10 && digits.length <= 15) return `+${digits}`
  return null
}

export const maskPhone = (e164) => {
  if (!e164) return ''
  return e164.length <= 4 ? e164 : `${e164.slice(0, -4).replace(/\d/g, '•')}${e164.slice(-4)}`
}

const SUPPORTED = ['twilio']

const providerName = () => (process.env.SMS_PROVIDER || 'twilio').toLowerCase()

export const isConfigured = () => {
  if (providerName() !== 'twilio') return false
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID)
  )
}

export const providerStatus = () => {
  const provider = providerName()
  const configured = isConfigured()
  return {
    provider,
    configured,
    live: configured,
    supported: SUPPORTED,
    reason: configured
      ? null
      : SUPPORTED.includes(provider)
        ? 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER must be set in .env'
        : `Unsupported SMS_PROVIDER "${provider}". Supported: ${SUPPORTED.join(', ')}.`
  }
}

/** Twilio Programmable Messaging over its REST API (Basic auth, no extra SDK needed). */
const sendViaTwilio = async (to, body) => {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN

  const params = new URLSearchParams({ To: to, Body: body })
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    params.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID)
  } else {
    params.set('From', process.env.TWILIO_PHONE_NUMBER)
  }

  try {
    const { data } = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      params.toString(),
      {
        auth: { username: sid, password: token },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    )

    // Twilio accepts asynchronously; only an immediate `failed` is a definite failure.
    if (data.status === 'failed') {
      const err = new Error(data.error_message || 'Twilio rejected the message')
      err.code = data.error_code
      throw err
    }

    return { provider: 'twilio', messageId: data.sid, status: data.status }
  } catch (err) {
    const tw = err.response?.data
    if (tw) {
      const e = new Error(`Twilio error ${tw.code}: ${tw.message}`)
      e.code = tw.code
      e.moreInfo = tw.more_info
      throw e
    }
    throw err
  }
}

/**
 * Sends an SMS through the configured provider. Throws on any failure —
 * callers must never report "OTP sent" unless this resolves.
 */
export const sendSms = async (phone, body) => {
  const to = toE164(phone)
  if (!to) {
    const err = new Error('Invalid mobile number. Enter a 10-digit number or a number in +<country><number> format.')
    err.code = 'EINVALIDPHONE'
    throw err
  }

  if (!isConfigured()) {
    const err = new Error(providerStatus().reason)
    err.code = 'ESMSCONFIG'
    throw err
  }

  const result = await sendViaTwilio(to, body)
  console.log(`📲 SMS sent → ${maskPhone(to)} via twilio (${result.status})`)

  return { success: true, live: true, to, masked: maskPhone(to), ...result }
}

export const sendOtpSms = async (phone, otp, ttlMinutes = 5) => {
  const brandName = process.env.BRAND_NAME || 'MakeMyTrip'
  const body = `${otp} is your ${brandName} verification code. It is valid for ${ttlMinutes} minutes. Do not share it with anyone.`
  return sendSms(phone, body)
}

export default { sendSms, sendOtpSms, toE164, maskPhone, isConfigured, providerStatus }
