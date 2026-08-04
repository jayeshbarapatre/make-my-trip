import { db } from '../../config/firebase.js'
import { now } from '../../utils/time.js'

const COLLECTION = 'emailLogs'

const toRecord = (doc) => ({ id: doc.id, ...doc.data() })

export const createLog = async (data) => {
  const ref = db.collection(COLLECTION).doc()
  const record = {
    emailType: data.emailType,
    templateKey: data.templateKey || data.emailType,
    recipientEmail: (data.recipientEmail || '').toLowerCase(),
    subject: data.subject || '',
    bookingId: data.bookingId || null,
    userId: data.userId || null,
    status: 'queued',
    attempts: 0,
    maxAttempts: parseInt(process.env.EMAIL_MAX_ATTEMPTS, 10) || 3,
    payloadSnapshot: data.payloadSnapshot || null,
    lastError: null,
    providerMessageId: null,
    smtpResponse: null,
    sentAt: null,
    createdAt: now(),
    updatedAt: now()
  }
  await ref.set(record)
  return { id: ref.id, ...record }
}

const patch = async (logId, fields) => {
  if (!logId) return null
  try {
    await db.collection(COLLECTION).doc(logId).update({ ...fields, updatedAt: now() })
  } catch (err) {
    console.warn(`⚠️ Could not update email log ${logId}: ${err.message}`)
  }
  return logId
}

export const markSending = (logId) => patch(logId, { status: 'sending' })

export const markSent = (logId, smtpResponse, providerMessageId, attempts = 1) =>
  patch(logId, {
    status: 'sent',
    sentAt: new Date().toISOString(),
    smtpResponse: smtpResponse || null,
    providerMessageId: providerMessageId || null,
    attempts,
    lastError: null
  })

export const markFailed = (logId, errorMessage, attempts) =>
  patch(logId, {
    status: 'failed',
    lastError: String(errorMessage || 'Unknown error').slice(0, 900),
    ...(attempts !== undefined && { attempts })
  })

export const incrementAttempt = async (logId) => {
  const doc = await db.collection(COLLECTION).doc(logId).get()
  if (!doc.exists) return null
  const data = doc.data()
  const attempts = (data.attempts || 0) + 1
  return patch(logId, { attempts, status: attempts < (data.maxAttempts || 3) ? 'retrying' : 'failed' })
}

export const resetForResend = (logId) => patch(logId, {
  status: 'queued', attempts: 0, lastError: null, smtpResponse: null, providerMessageId: null, sentAt: null
})

export const getLogById = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get()
  return doc.exists ? toRecord(doc) : null
}

const matches = (log, where) => Object.entries(where || {}).every(([k, val]) =>
  val === undefined || val === null || val === '' ||
  String(log[k] ?? '').toLowerCase() === String(val).toLowerCase())

/**
 * Filters and sorts in memory — a Firestore where+orderBy would need a composite
 * index for every combination the admin filters can produce.
 */
export const listLogs = async (where = {}, _orderBy, skip = 0, take = 50) => {
  const snap = await db.collection(COLLECTION).limit(2000).get()
  return snap.docs.map(toRecord)
    .filter(l => matches(l, where))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(skip, skip + take)
}

export const getLogCount = async (where = {}) => {
  const snap = await db.collection(COLLECTION).limit(2000).get()
  return snap.docs.map(toRecord).filter(l => matches(l, where)).length
}

export const getStatsByType = async () => {
  const snap = await db.collection(COLLECTION).limit(2000).get()
  const stats = {}
  for (const doc of snap.docs) {
    const { emailType = 'unknown', status = 'unknown' } = doc.data()
    stats[emailType] = stats[emailType] || { emailType, sent: 0, failed: 0, queued: 0, retrying: 0, total: 0 }
    stats[emailType].total++
    if (stats[emailType][status] !== undefined) stats[emailType][status]++
  }
  return Object.values(stats)
}

export default {
  createLog, markSending, markSent, markFailed, incrementAttempt, resetForResend,
  getLogById, listLogs, getLogCount, getStatsByType
}
