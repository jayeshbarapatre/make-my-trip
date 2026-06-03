import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const listFaqs = async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ message: 'FAQs fetched', data: faqs })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    res.status(500).json({ message: 'Failed to fetch FAQs' })
  }
}

export const listAllFaqs = async (req, res) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ message: 'FAQs fetched', data: faqs })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    res.status(500).json({ message: 'Failed to fetch FAQs' })
  }
}

export const createFaq = async (req, res) => {
  try {
    const { question, answer, sortOrder, status } = req.body

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' })
    }

    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        sortOrder: sortOrder || 0,
        status: status || 'active',
      },
    })

    res.status(201).json({ message: 'FAQ created', data: faq })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    res.status(500).json({ message: 'Failed to create FAQ' })
  }
}

export const updateFaq = async (req, res) => {
  try {
    const { id } = req.params
    const { question, answer, sortOrder, status } = req.body

    const faq = await prisma.faq.update({
      where: { id },
      data: { question, answer, sortOrder, status },
    })

    res.json({ message: 'FAQ updated', data: faq })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'FAQ not found' })
    }
    console.error('Error updating FAQ:', error)
    res.status(500).json({ message: 'Failed to update FAQ' })
  }
}

export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.faq.delete({ where: { id } })

    res.json({ message: 'FAQ deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'FAQ not found' })
    }
    console.error('Error deleting FAQ:', error)
    res.status(500).json({ message: 'Failed to delete FAQ' })
  }
}
