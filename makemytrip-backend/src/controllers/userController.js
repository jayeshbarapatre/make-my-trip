import User from '../models/User.js'
import { getMongoConnectionStatus } from '../config/db.js'
import { postgresDB, saveMockDb } from '../config/prismaClient.js'

export const getProfile = async (req, res) => {
  try {
    const targetId = req.userId || req.user?.id || "usr_1111-2222-3333-4444"
    let user = null

    if (getMongoConnectionStatus()) {
      user = await User.findById(targetId).select('-password')
    }
    if (!user) {
      const found = postgresDB.users.find(u => u.id === targetId)
      if (found) {
        const { password, ...safeUser } = found
        user = safeUser
      }
    }

    if (!user) {
      user = {
        id: targetId,
        name: "Jayesh Sharma",
        email: "jayesh@gmail.com",
        phone: "9876543210"
      }
    }

    res.json({ success: true, data: { user } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const targetId = req.userId || req.user?.id || "usr_1111-2222-3333-4444"
    const { name, phone, email } = req.body

    let updatedUser = null

    if (getMongoConnectionStatus()) {
      const u = await User.findById(targetId)
      if (u) {
        if (name) u.name = name
        if (phone) u.phone = phone
        if (email) u.email = email
        await u.save()
        updatedUser = { id: u._id, name: u.name, phone: u.phone, email: u.email }
      }
    }

    // Update postgresDB
    let pUser = postgresDB.users.find(u => u.id === targetId)
    if (!pUser) {
      pUser = { id: targetId, name: name || "Jayesh Sharma", phone: phone || "9876543210", email: email || "jayesh@gmail.com", password: "mobile_otp_user", createdAt: new Date() }
      postgresDB.users.push(pUser)
    }
    if (name) pUser.name = name
    if (phone) pUser.phone = phone
    if (email) pUser.email = email
    updatedUser = { id: pUser.id, name: pUser.name, phone: pUser.phone, email: pUser.email }
    saveMockDb()

    res.json({ success: true, data: { user: updatedUser }, message: "Profile updated successfully." })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
