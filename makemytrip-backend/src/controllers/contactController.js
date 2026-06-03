import { PrismaClient } from '@prisma/client'
import { sendAdminContactNotification } from '../services/emailService.js'

const prisma = new PrismaClient()

export const submitInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required' })
    }

    const inquiry = await prisma.contactInquiry.create({
      data: { name, email, phone: phone || null, subject, message, status: 'new' },
    })

    await prisma.notification.create({
      data: {
        title: 'New Contact Inquiry',
        message: `New inquiry from ${name} (${email})`,
        type: 'inquiry',
        referenceId: inquiry.id,
      },
    })

    await sendAdminContactNotification({ name, email, phone, subject, message })

    res.status(201).json({ message: 'Inquiry submitted successfully', data: inquiry })
  } catch (error) {
    console.error('Error submitting inquiry:', error)
    res.status(500).json({ message: 'Failed to submit inquiry' })
  }
}

export const listInquiries = async (req, res) => {
  try {
    const { status } = req.query
    const where = status ? { status } : {}

    const inquiries = await prisma.contactInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ message: 'Inquiries fetched', data: inquiries })
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    res.status(500).json({ message: 'Failed to fetch inquiries' })
  }
}

export const getInquiry = async (req, res) => {
  try {
    const { id } = req.params
    const inquiry = await prisma.contactInquiry.findUnique({ where: { id } })

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' })
    }

    res.json({ message: 'Inquiry fetched', data: inquiry })
  } catch (error) {
    console.error('Error fetching inquiry:', error)
    res.status(500).json({ message: 'Failed to fetch inquiry' })
  }
}

export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }

    const inquiry = await prisma.contactInquiry.update({
      where: { id },
      data: { status },
    })

    res.json({ message: 'Inquiry status updated', data: inquiry })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Inquiry not found' })
    }
    console.error('Error updating inquiry:', error)
    res.status(500).json({ message: 'Failed to update inquiry' })
  }
}

export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.contactInquiry.delete({ where: { id } })

    res.json({ message: 'Inquiry deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Inquiry not found' })
    }
    console.error('Error deleting inquiry:', error)
    res.status(500).json({ message: 'Failed to delete inquiry' })
  }
}
