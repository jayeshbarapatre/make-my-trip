import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'

// Append-only audit trail. Writes are best-effort: an audit failure must never
// roll back or block the business operation it is recording, so every call is
// swallowed and reported to stderr instead of thrown.

export const AuditAction = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_RESET: 'password_reset',
  USER_UPDATED: 'user_updated',
  PAYMENT_ORDER_CREATED: 'payment_order_created',
  PAYMENT_VERIFIED: 'payment_verified',
  PAYMENT_REJECTED: 'payment_rejected',
  BOOKING_CREATED: 'booking_created',
  BOOKING_CANCELLED: 'booking_cancelled',
  REFUND_INITIATED: 'refund_initiated',
  REFUND_COMPLETED: 'refund_completed',
  VENDOR_APPROVED: 'vendor_approved',
  VENDOR_SUSPENDED: 'vendor_suspended',
  LISTING_CREATED: 'listing_created',
  LISTING_UPDATED: 'listing_updated',
  LISTING_DELETED: 'listing_deleted',
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  SETTINGS_CHANGED: 'settings_changed'
}

const clientIp = (req) => {
  const forwarded = req?.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim()
  return req?.ip || req?.socket?.remoteAddress || null
}

/**
 * @param {object} entry
 * @param {import('express').Request} [entry.req] Source request, for actor/IP/device attribution.
 * @param {string} entry.action One of AuditAction.
 * @param {string} entry.entity Collection or logical entity name.
 * @param {string} [entry.entityId]
 * @param {object} [entry.oldValue]
 * @param {object} [entry.newValue]
 * @param {'success'|'failure'} [entry.status]
 */
export const writeAuditLog = async ({
  req,
  action,
  entity,
  entityId = null,
  oldValue = null,
  newValue = null,
  status = 'success'
}) => {
  try {
    await db.collection('audit_logs').add({
      actorId: req?.user?.id || req?.userId || null,
      actorEmail: req?.user?.email || null,
      actorRole: req?.user?.role || 'customer',
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      status,
      ip: clientIp(req),
      device: req?.headers?.['user-agent'] || null,
      createdAt: FieldValue.serverTimestamp(),
      isDeleted: false
    })
  } catch (err) {
    console.error(`⚠️ audit_log write failed [${action}/${entity}]:`, err.message)
  }
}

export default { writeAuditLog, AuditAction }
