import express from 'express'
import { getPageBySlug } from '../controllers/cmsController.js'
import { getFooter } from '../controllers/footerController.js'
import { submitInquiry } from '../controllers/contactController.js'
import { listJobs, getJob, applyJob } from '../controllers/careersController.js'
import { listFaqs } from '../controllers/faqController.js'
import { getSettings } from '../controllers/settingsController.js'
import { createLimiter, generalLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// Every route here is unauthenticated, so all buckets are keyed by address.
router.use(generalLimiter)

// CMS Pages - Public
router.get('/pages/:slug', getPageBySlug)

// Footer - Public
router.get('/footer', getFooter)

// FAQs - Public
router.get('/faqs', listFaqs)

// Careers - Public
router.get('/jobs', listJobs)
router.get('/jobs/:id', getJob)
// Anonymous writes that reach a human inbox — the two spam targets in the
// public surface, so both carry the tighter create policy.
router.post('/jobs/:id/apply', createLimiter, applyJob)

// Contact Form - Public
router.post('/contact', createLimiter, submitInquiry)

// Settings - Public (colors for frontend)
router.get('/settings', getSettings)

export default router
