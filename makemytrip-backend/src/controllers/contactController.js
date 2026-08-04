import { contentStore } from '../services/contentStore.js'
import { sanitizeText } from '../utils/sanitize.js'
import { sendAdminContactNotification } from '../services/emailService.js'

// Migrated from Prisma/MongoDB to Firestore. submitInquiry is public and used
// to hang for ~15s against an unreachable MongoDB.

const inquiries = contentStore('contact_inquiries')
const notifications = contentStore('notifications')

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? ''))

export const submitInquiry = async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name, 120)
    const email = sanitizeText(req.body?.email, 200)
    const subject = sanitizeText(req.body?.subject, 200)
    const message = sanitizeText(req.body?.message, 4000)

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required' })
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }

    const inquiry = await inquiries.create({
      name,
      email,
      phone: sanitizeText(req.body?.phone, 20) || null,
      subject,
      message,
      status: 'new'
    })

    await notifications.create({
      title: 'New Contact Inquiry',
      message: `New inquiry from ${name} (${email})`,
      type: 'inquiry',
      referenceId: inquiry.id,
      isRead: false
    })

    // Fire and forget: a mail outage must not lose the inquiry, which is
    // already stored above.
    sendAdminContactNotification({ name, email, phone: inquiry.phone, subject, message })
      .catch((err) => console.warn('⚠️ Contact notification email failed:', err.message))

    res.status(201).json({ message: 'Inquiry submitted successfully', data: inquiry })
  } catch (error) {
    console.error('Error submitting inquiry:', error.message)
    res.status(500).json({ message: 'Failed to submit inquiry' })
  }
}

export const listInquiries = async (req, res) => {
  try {
    const rows = await inquiries.list(
      req.query.status ? { where: { field: 'status', value: req.query.status } } : {}
    )
    res.json({ message: 'Inquiries fetched', data: rows })
  } catch (error) {
    console.error('Error fetching inquiries:', error.message)
    res.status(500).json({ message: 'Failed to fetch inquiries' })
  }
}

export const getInquiry = async (req, res) => {
  try {
    const inquiry = await inquiries.getById(req.params.id)
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' })
    res.json({ message: 'Inquiry fetched', data: inquiry })
  } catch (error) {
    console.error('Error fetching inquiry:', error.message)
    res.status(500).json({ message: 'Failed to fetch inquiry' })
  }
}

export const updateInquiryStatus = async (req, res) => {
  try {
    const status = sanitizeText(req.body?.status, 40)
    if (!status) return res.status(400).json({ message: 'Status is required' })

    const inquiry = await inquiries.update(req.params.id, { status }, req.adminId)
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' })

    res.json({ message: 'Inquiry status updated', data: inquiry })
  } catch (error) {
    console.error('Error updating inquiry:', error.message)
    res.status(500).json({ message: 'Failed to update inquiry' })
  }
}

export const deleteInquiry = async (req, res) => {
  try {
    const ok = await inquiries.remove(req.params.id, req.adminId)
    if (!ok) return res.status(404).json({ message: 'Inquiry not found' })
    res.json({ message: 'Inquiry deleted' })
  } catch (error) {
    console.error('Error deleting inquiry:', error.message)
    res.status(500).json({ message: 'Failed to delete inquiry' })
  }
}
