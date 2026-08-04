import { db } from '../config/firebase.js'
import { now } from '../utils/time.js'
import { contentStore } from '../services/contentStore.js'

// Migrated from Prisma/MongoDB to Firestore. The admin shell polls the unread
// count on every page, so this hanging took the whole panel with it.

const store = contentStore('notifications')

export const getNotifications = async (_req, res) => {
  try {
    res.json({ message: 'Notifications fetched', data: await store.list() })
  } catch (error) {
    console.error('Error fetching notifications:', error.message)
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
}

export const getUnreadCount = async (_req, res) => {
  try {
    const snap = await db.collection('notifications').where('isRead', '==', false).count().get()
    res.json({ message: 'Unread count', data: { count: snap.data().count } })
  } catch (error) {
    console.error('Error fetching unread count:', error.message)
    res.status(500).json({ message: 'Failed to fetch unread count' })
  }
}

export const markAsRead = async (req, res) => {
  try {
    const notification = await store.update(req.params.id, { isRead: true }, req.adminId)
    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    res.json({ message: 'Notification marked as read', data: notification })
  } catch (error) {
    console.error('Error marking notification as read:', error.message)
    res.status(500).json({ message: 'Failed to mark notification as read' })
  }
}

export const markAllAsRead = async (req, res) => {
  try {
    const snap = await db.collection('notifications').where('isRead', '==', false).get()

    // Firestore caps a batch at 500 writes.
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = db.batch()
      for (const doc of snap.docs.slice(i, i + 450)) {
        batch.update(doc.ref, { isRead: true, updatedAt: now() })
      }
      await batch.commit()
    }

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking all notifications as read:', error.message)
    res.status(500).json({ message: 'Failed to mark all notifications as read' })
  }
}

export const deleteNotification = async (req, res) => {
  try {
    const ok = await store.remove(req.params.id, req.adminId)
    if (!ok) return res.status(404).json({ message: 'Notification not found' })
    res.json({ message: 'Notification deleted' })
  } catch (error) {
    console.error('Error deleting notification:', error.message)
    res.status(500).json({ message: 'Failed to delete notification' })
  }
}
