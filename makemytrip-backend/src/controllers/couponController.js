import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'
import { sanitizeText } from '../utils/sanitize.js'
import { writeAuditLog } from '../services/auditLog.js'

// Coupon codes are stored uppercase and used as the document id, so a code is
// unique by construction and lookups are a single point read.
const normalizeCode = (code) => sanitizeText(code, 32).toUpperCase().replace(/[^A-Z0-9_-]/g, '')

const DISCOUNT_TYPES = new Set(['percent', 'flat'])

/**
 * Evaluates a coupon against a cart. Returns the discount the server is willing
 * to honour — the client never computes this, so a tampered request cannot
 * manufacture a larger discount than the rules allow.
 */
export const evaluateCoupon = (coupon, { amount, type, userId, now = new Date() }) => {
  const reject = (reason) => ({ valid: false, reason, discount: 0 })

  if (!coupon || coupon.isDeleted) return reject('This code is not valid')
  if (coupon.isActive === false) return reject('This code is no longer active')

  const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null
  const validTo = coupon.validTo ? new Date(coupon.validTo) : null
  if (validFrom && now < validFrom) return reject('This code is not active yet')
  if (validTo && now > validTo) return reject('This code has expired')

  if (Array.isArray(coupon.appliesTo) && coupon.appliesTo.length && !coupon.appliesTo.includes(type)) {
    return reject(`This code cannot be used for ${type} bookings`)
  }

  const cartAmount = Number(amount) || 0
  if (coupon.minAmount && cartAmount < Number(coupon.minAmount)) {
    return reject(`This code needs a minimum booking value of ₹${Number(coupon.minAmount).toLocaleString('en-IN')}`)
  }

  if (coupon.maxRedemptions && (coupon.redemptionCount ?? 0) >= Number(coupon.maxRedemptions)) {
    return reject('This code has reached its usage limit')
  }

  const perUser = Number(coupon.maxPerUser ?? 0)
  if (perUser > 0 && userId) {
    const used = coupon.redemptionsByUser?.[userId] ?? 0
    if (used >= perUser) return reject('You have already used this code')
  }

  let discount = coupon.discountType === 'percent'
    ? Math.round((cartAmount * Number(coupon.discountValue)) / 100)
    : Math.round(Number(coupon.discountValue))

  if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount))
  // Never let a discount exceed the cart, which would imply paying the customer.
  discount = Math.max(0, Math.min(discount, cartAmount))

  if (discount <= 0) return reject('This code does not apply to your booking')

  return {
    valid: true,
    discount,
    payable: cartAmount - discount,
    code: coupon.code,
    description: coupon.description ?? null
  }
}

export const validateCoupon = async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code)
    if (!code) return res.status(400).json({ success: false, message: 'A coupon code is required' })

    const snap = await db.collection('coupons').doc(code).get()
    const result = evaluateCoupon(snap.exists ? { id: snap.id, ...snap.data() } : null, {
      amount: req.body?.amount,
      type: req.body?.type,
      userId: req.principal.uid
    })

    if (!result.valid) return res.status(200).json({ success: true, data: result })
    res.json({ success: true, data: result })
  } catch (err) {
    console.error('Validate coupon failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not check that code' })
  }
}

/**
 * Atomically records one redemption. Called when a booking is confirmed, not
 * when the code is previewed, so abandoned carts never consume inventory.
 */
export const redeemCoupon = async ({ code, userId, bookingId }) => {
  const ref = db.collection('coupons').doc(normalizeCode(code))

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw Object.assign(new Error('Coupon not found'), { code: 'NOT_FOUND' })

    const coupon = snap.data()
    if (coupon.maxRedemptions && (coupon.redemptionCount ?? 0) >= Number(coupon.maxRedemptions)) {
      throw Object.assign(new Error('This code has reached its usage limit'), { code: 'EXHAUSTED' })
    }

    tx.update(ref, {
      redemptionCount: FieldValue.increment(1),
      [`redemptionsByUser.${userId}`]: FieldValue.increment(1),
      lastRedeemedAt: FieldValue.serverTimestamp(),
      lastBookingId: bookingId ?? null
    })

    return { code: coupon.code, redemptionCount: (coupon.redemptionCount ?? 0) + 1 }
  })
}

// ── Admin ──

export const listCoupons = async (_req, res) => {
  try {
    const snap = await db.collection('coupons').get()
    res.json({
      success: true,
      data: snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => !c.isDeleted)
    })
  } catch (err) {
    console.error('List coupons failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load coupons' })
  }
}

export const upsertCoupon = async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code)
    if (!code) return res.status(400).json({ success: false, message: 'A coupon code is required' })

    const { discountType, discountValue } = req.body
    if (!DISCOUNT_TYPES.has(discountType)) {
      return res.status(400).json({ success: false, message: 'discountType must be "percent" or "flat"' })
    }

    const value = Number(discountValue)
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'discountValue must be a positive number' })
    }
    if (discountType === 'percent' && value > 100) {
      return res.status(400).json({ success: false, message: 'A percentage discount cannot exceed 100' })
    }

    const ref = db.collection('coupons').doc(code)
    const existing = await ref.get()

    const payload = {
      code,
      description: sanitizeText(req.body.description, 200) || null,
      discountType,
      discountValue: value,
      maxDiscount: req.body.maxDiscount != null ? Number(req.body.maxDiscount) : null,
      minAmount: req.body.minAmount != null ? Number(req.body.minAmount) : null,
      appliesTo: Array.isArray(req.body.appliesTo) ? req.body.appliesTo : [],
      validFrom: req.body.validFrom ?? null,
      validTo: req.body.validTo ?? null,
      maxRedemptions: req.body.maxRedemptions != null ? Number(req.body.maxRedemptions) : null,
      maxPerUser: req.body.maxPerUser != null ? Number(req.body.maxPerUser) : null,
      isActive: req.body.isActive !== false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: req.principal.uid,
      isDeleted: false,
      ...(existing.exists
        ? {}
        : {
            redemptionCount: 0,
            redemptionsByUser: {},
            createdAt: FieldValue.serverTimestamp(),
            createdBy: req.principal.uid
          })
    }

    await ref.set(payload, { merge: true })

    writeAuditLog({
      req,
      action: existing.exists ? 'coupon_updated' : 'coupon_created',
      entity: 'coupons',
      entityId: code,
      oldValue: existing.exists ? { discountType: existing.data().discountType, discountValue: existing.data().discountValue } : null,
      newValue: { discountType, discountValue: value, isActive: payload.isActive }
    })

    const saved = await ref.get()
    res.status(existing.exists ? 200 : 201).json({ success: true, data: { id: code, ...saved.data() } })
  } catch (err) {
    console.error('Upsert coupon failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not save the coupon' })
  }
}

export const deleteCoupon = async (req, res) => {
  try {
    const ref = db.collection('coupons').doc(normalizeCode(req.params.code))
    const snap = await ref.get()
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Coupon not found' })

    // Soft delete keeps redemption history attached to past bookings.
    await ref.update({
      isDeleted: true,
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: req.principal.uid
    })

    writeAuditLog({
      req,
      action: 'coupon_deleted',
      entity: 'coupons',
      entityId: req.params.code,
      oldValue: { isActive: snap.data().isActive },
      newValue: { isDeleted: true }
    })

    res.json({ success: true, message: 'Coupon removed' })
  } catch (err) {
    console.error('Delete coupon failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not remove the coupon' })
  }
}
