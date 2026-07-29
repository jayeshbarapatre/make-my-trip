import * as emailLogService from '../services/email/emailLogService.js'
import { sendBookingConfirmationEmail } from '../services/emailService.js'
import { db } from '../config/firebase.js'

const findBookingForLog = async (log) => {
  const bookingId = log.bookingId || log.payloadSnapshot?.bookingId
  if (!bookingId) return null
  const snap = await db.collection('bookings').where('bookingId', '==', bookingId).limit(1).get()
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// List email logs with filters and pagination
export const listLogs = async (req, res) => {
  try {
    const { status, emailType, page = 1, limit = 50, startDate, endDate } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (emailType && emailType !== 'all') {
      where.emailType = emailType
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Fetch logs and total count
    const logs = await emailLogService.listLogs(where, { createdAt: 'desc' }, skip, limitNum)
    const total = await emailLogService.getLogCount(where)

    res.json({
      message: 'Email logs retrieved',
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (err) {
    console.error('List logs error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Get single email log
export const getLog = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Log ID is required' })
    }

    const log = await emailLogService.getLogById(id)

    if (!log) {
      return res.status(404).json({ message: 'Email log not found' })
    }

    res.json({
      message: 'Email log retrieved',
      data: { log }
    })
  } catch (err) {
    console.error('Get log error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Resend email from log
export const resendLog = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Log ID is required' })
    }

    const log = await emailLogService.getLogById(id)

    if (!log) {
      return res.status(404).json({ message: 'Email log not found' })
    }

    if (!log.payloadSnapshot) {
      return res.status(400).json({ message: 'Cannot resend: missing payload data' })
    }

    await emailLogService.resetForResend(id)

    // Only booking confirmations carry enough payload to rebuild the message.
    // OTP codes are intentionally never stored, so they can never be resent from a log.
    if (log.emailType !== 'booking_confirmation') {
      return res.status(400).json({
        message: `Emails of type "${log.emailType}" cannot be resent from a log — ask the user to trigger a new one.`
      })
    }

    const booking = await findBookingForLog(log)
    if (!booking) {
      return res.status(404).json({ message: 'Original booking no longer exists; cannot rebuild this email.' })
    }

    const result = await sendBookingConfirmationEmail({ ...booking, userEmail: log.recipientEmail })

    if (!result.success) {
      return res.status(502).json({ message: `Resend failed: ${result.error}`, data: { logId: id } })
    }

    res.json({
      message: 'Email resent successfully',
      data: { logId: id, messageId: result.messageId }
    })
  } catch (err) {
    console.error('Resend log error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Get email statistics
export const getStats = async (req, res) => {
  try {
    const logStats = await emailLogService.getStatsByType()
    const allLogs = await emailLogService.listLogs({}, null, 0, 2000)

    const summary = {
      total: allLogs.length,
      queued: allLogs.filter(l => l.status === 'queued').length,
      sending: allLogs.filter(l => l.status === 'sending').length,
      sent: allLogs.filter(l => l.status === 'sent').length,
      failed: allLogs.filter(l => l.status === 'failed').length,
      retrying: allLogs.filter(l => l.status === 'retrying').length
    }

    res.json({
      message: 'Email statistics',
      data: { summary, byType: logStats }
    })
  } catch (err) {
    console.error('Get stats error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Delete old logs (cleanup)
export const cleanupOldLogs = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query

    if (isNaN(daysOld) || daysOld < 1) {
      return res.status(400).json({ message: 'daysOld must be a positive number' })
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld))

    const stale = (await emailLogService.listLogs({}, null, 0, 2000))
      .filter(l => ['sent', 'failed'].includes(l.status) && new Date(l.createdAt) < cutoffDate)

    // Firestore caps a batch at 500 writes.
    for (let i = 0; i < stale.length; i += 400) {
      const batch = db.batch()
      for (const log of stale.slice(i, i + 400)) {
        batch.delete(db.collection('emailLogs').doc(log.id))
      }
      await batch.commit()
    }

    res.json({
      message: `Deleted ${stale.length} old email logs`,
      data: { deletedCount: stale.length }
    })
  } catch (err) {
    console.error('Cleanup logs error:', err)
    res.status(500).json({ message: err.message })
  }
}

export default {
  listLogs,
  getLog,
  resendLog,
  getStats,
  cleanupOldLogs
}
