import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'

const WISHLISTABLE = new Set(['hotel', 'flight', 'bus', 'train', 'cab'])

// Deterministic id per (user, item): toggling is idempotent and a user can
// never accumulate duplicate wishlist rows for the same listing.
const wishlistDocId = (userId, type, itemId) => `${userId}__${type}__${itemId}`

export const listWishlist = async (req, res) => {
  try {
    const snap = await db.collection('wishlists').where('userId', '==', req.principal.uid).get()

    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((w) => !w.isDeleted)
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))

    res.json({ success: true, data: items })
  } catch (err) {
    console.error('List wishlist failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not load your wishlist' })
  }
}

export const addToWishlist = async (req, res) => {
  try {
    const { type, itemId, snapshot } = req.body
    const userId = req.principal.uid

    if (!WISHLISTABLE.has(type)) {
      return res.status(400).json({ success: false, message: 'Unsupported wishlist item type' })
    }
    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required' })
    }

    const ref = db.collection('wishlists').doc(wishlistDocId(userId, type, itemId))

    await ref.set(
      {
        userId,
        type,
        itemId,
        // A small denormalised copy so the wishlist renders without N reads,
        // and still shows something if the listing is later withdrawn.
        snapshot: snapshot ?? null,
        isDeleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      },
      { merge: true }
    )

    const saved = await ref.get()
    res.status(201).json({ success: true, data: { id: ref.id, ...saved.data() } })
  } catch (err) {
    console.error('Add to wishlist failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not save to your wishlist' })
  }
}

export const removeFromWishlist = async (req, res) => {
  try {
    const { type, itemId } = req.params
    const ref = db.collection('wishlists').doc(wishlistDocId(req.principal.uid, type, itemId))

    const snap = await ref.get()
    if (!snap.exists) {
      return res.status(404).json({ success: false, message: 'Not in your wishlist' })
    }

    await ref.delete()
    res.json({ success: true, message: 'Removed from wishlist' })
  } catch (err) {
    console.error('Remove from wishlist failed:', err.message)
    res.status(500).json({ success: false, message: 'Could not update your wishlist' })
  }
}
