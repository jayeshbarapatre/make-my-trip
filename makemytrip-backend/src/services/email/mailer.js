import nodemailer from 'nodemailer'
import { brand } from './brand.js'

const RETRYABLE = new Set([
  'ETIMEDOUT', 'ECONNRESET', 'ECONNECTION', 'ESOCKET', 'EDNS', 'ECONNREFUSED', 'EAI_AGAIN'
])

let transporter = null
let verifyPromise = null

export const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)

const getTransporter = () => {
  if (transporter) return transporter
  if (!isConfigured()) return null

  const port = parseInt(process.env.SMTP_PORT, 10) || 587
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS, 10) || 3,
    maxMessages: 100,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  })
  return transporter
}

/** Verifies SMTP once at boot so misconfiguration surfaces immediately, not on first booking. */
export const verifyConnection = async () => {
  if (!isConfigured()) {
    return { ok: false, reason: 'SMTP_HOST, SMTP_USER and SMTP_PASS must all be set in .env' }
  }
  if (!verifyPromise) {
    verifyPromise = getTransporter().verify()
      .then(() => ({ ok: true, host: process.env.SMTP_HOST, user: process.env.SMTP_USER }))
      .catch(err => {
        verifyPromise = null
        return { ok: false, reason: err.message, code: err.code }
      })
  }
  return verifyPromise
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const fromHeader = () => {
  const name = process.env.SMTP_FROM_NAME || brand.name
  const addr = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
  return `"${name}" <${addr}>`
}

/**
 * Sends one message, retrying only on transient transport errors.
 * Rejects on permanent failure — callers must not report success without a messageId.
 */
export const sendMail = async ({ to, subject, html, text, attachments = [], replyTo, headers = {} }) => {
  if (!to) throw new Error('Recipient address is required')

  const tx = getTransporter()
  if (!tx) {
    const err = new Error('SMTP is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASS in makemytrip-backend/.env')
    err.code = 'ESMTPCONFIG'
    throw err
  }

  const recipient = String(to).trim().toLowerCase()
  const maxAttempts = parseInt(process.env.EMAIL_MAX_ATTEMPTS, 10) || 3
  let lastErr = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const info = await tx.sendMail({
        from: fromHeader(),
        to: recipient,
        replyTo: replyTo || process.env.SUPPORT_EMAIL || undefined,
        subject,
        html,
        text,
        attachments,
        headers: { 'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...headers }
      })

      console.log(`✅ Email sent → ${recipient} | "${subject}" | id=${info.messageId}`)
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Preview URL: ${previewUrl}`);
      }
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        recipient,
        attempts: attempt
      }
    } catch (err) {
      lastErr = err
      const retryable = RETRYABLE.has(err.code) || (err.responseCode >= 400 && err.responseCode < 500)
      if (!retryable || attempt === maxAttempts) break
      const backoff = 800 * Math.pow(2, attempt - 1)
      console.warn(`⚠️ Email attempt ${attempt}/${maxAttempts} to ${recipient} failed (${err.code || err.message}); retrying in ${backoff}ms`)
      await sleep(backoff)
    }
  }

  console.error(`❌ Email FAILED → ${recipient} | "${subject}" | ${lastErr?.code || ''} ${lastErr?.message}`)
  throw lastErr
}

export const closeMailer = async () => {
  if (transporter) {
    transporter.close()
    transporter = null
    verifyPromise = null
  }
}

export default { sendMail, verifyConnection, isConfigured, closeMailer }
