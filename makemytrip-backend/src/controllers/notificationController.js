import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    })

    res.json({ message: 'Notifications fetched', data: notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
}

export const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({ where: { isRead: false } })

    res.json({ message: 'Unread count', data: { count } })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    res.status(500).json({ message: 'Failed to fetch unread count' })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    res.json({ message: 'Notification marked as read', data: notification })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Notification not found' })
    }
    console.error('Error marking notification as read:', error)
    res.status(500).json({ message: 'Failed to mark notification as read' })
  }
}

export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    })

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    res.status(500).json({ message: 'Failed to mark all notifications as read' })
  }
}

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.notification.delete({ where: { id } })

    res.json({ message: 'Notification deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Notification not found' })
    }
    console.error('Error deleting notification:', error)
    res.status(500).json({ message: 'Failed to delete notification' })
  }
}
