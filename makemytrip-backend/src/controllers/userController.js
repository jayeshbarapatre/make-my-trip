import prisma from '../config/prismaClient.js'

export const getProfile = async (req, res) => {
  try {
    const targetId = req.userId || req.user?.id
    const user = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, name: true, email: true, phone: true } })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ success: true, data: { user } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const targetId = req.userId || req.user?.id
    const { name, phone, email } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email })
      },
      select: { id: true, name: true, email: true, phone: true }
    })

    res.json({ success: true, data: { user: updatedUser }, message: "Profile updated successfully." })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
