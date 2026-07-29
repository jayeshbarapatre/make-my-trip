import { db } from '../config/firebase.js'

// Users are stored in the `users` collection keyed by email, with an `id` field holding the UID.
const findUserDocById = async (userId) => {
  const snapshot = await db.collection('users').where('id', '==', userId).limit(1).get()
  return snapshot.empty ? null : snapshot.docs[0]
}

export const getProfile = async (req, res) => {
  try {
    const userDoc = await findUserDocById(req.userId || req.user?.id)
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { id, name, email, phone, is_admin } = userDoc.data()
    res.json({ success: true, data: { user: { id, name, email, phone, is_admin: is_admin || false } } })
  } catch (err) {
    console.error('Get profile error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const userDoc = await findUserDocById(req.userId || req.user?.id)
    if (!userDoc) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { name, phone } = req.body
    const updates = {
      ...(name && { name }),
      ...(phone && { phone }),
      updatedAt: new Date().toISOString()
    }

    await userDoc.ref.update(updates)

    const { id, email, is_admin, ...rest } = { ...userDoc.data(), ...updates }
    res.json({
      success: true,
      data: { user: { id, name: rest.name, email, phone: rest.phone, is_admin: is_admin || false } },
      message: 'Profile updated successfully.'
    })
  } catch (err) {
    console.error('Update profile error:', err.message)
    res.status(500).json({ message: err.message })
  }
}
