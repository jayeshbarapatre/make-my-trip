import { contentStore } from '../services/contentStore.js'
import { sanitizeText } from '../utils/sanitize.js'

// Migrated from Prisma/MongoDB to Firestore. listFaqs is public and used to
// hang for ~15s against an unreachable MongoDB.

const store = contentStore('faqs', { sortField: 'sortOrder', sortDir: 'asc' })

export const listFaqs = async (_req, res) => {
  try {
    res.json({ message: 'FAQs fetched', data: await store.list({ activeOnly: true }) })
  } catch (error) {
    console.error('Error fetching FAQs:', error.message)
    res.status(500).json({ message: 'Failed to fetch FAQs' })
  }
}

export const listAllFaqs = async (_req, res) => {
  try {
    res.json({ message: 'FAQs fetched', data: await store.list() })
  } catch (error) {
    console.error('Error fetching FAQs:', error.message)
    res.status(500).json({ message: 'Failed to fetch FAQs' })
  }
}

export const createFaq = async (req, res) => {
  try {
    const question = sanitizeText(req.body?.question, 300)
    const answer = sanitizeText(req.body?.answer, 4000)

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' })
    }

    const faq = await store.create({
      question,
      answer,
      sortOrder: Number(req.body.sortOrder) || 0,
      status: req.body.status === 'inactive' ? 'inactive' : 'active'
    }, req.adminId)

    res.status(201).json({ message: 'FAQ created', data: faq })
  } catch (error) {
    console.error('Error creating FAQ:', error.message)
    res.status(500).json({ message: 'Failed to create FAQ' })
  }
}

export const updateFaq = async (req, res) => {
  try {
    const faq = await store.update(req.params.id, {
      question: req.body.question !== undefined ? sanitizeText(req.body.question, 300) : undefined,
      answer: req.body.answer !== undefined ? sanitizeText(req.body.answer, 4000) : undefined,
      sortOrder: req.body.sortOrder !== undefined ? Number(req.body.sortOrder) || 0 : undefined,
      status: req.body.status
    }, req.adminId)

    if (!faq) return res.status(404).json({ message: 'FAQ not found' })

    res.json({ message: 'FAQ updated', data: faq })
  } catch (error) {
    console.error('Error updating FAQ:', error.message)
    res.status(500).json({ message: 'Failed to update FAQ' })
  }
}

export const deleteFaq = async (req, res) => {
  try {
    const ok = await store.remove(req.params.id, req.adminId)
    if (!ok) return res.status(404).json({ message: 'FAQ not found' })
    res.json({ message: 'FAQ deleted' })
  } catch (error) {
    console.error('Error deleting FAQ:', error.message)
    res.status(500).json({ message: 'Failed to delete FAQ' })
  }
}
