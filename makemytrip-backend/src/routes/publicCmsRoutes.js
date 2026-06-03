import express from 'express'
import { getPageBySlug } from '../controllers/cmsController.js'
import { getFooter } from '../controllers/footerController.js'
import { submitInquiry } from '../controllers/contactController.js'
import { listJobs, getJob, applyJob } from '../controllers/careersController.js'
import { listFaqs } from '../controllers/faqController.js'
import { getSettings } from '../controllers/settingsController.js'

const router = express.Router()

// CMS Pages - Public
router.get('/pages/:slug', getPageBySlug)

// Footer - Public
router.get('/footer', getFooter)

// FAQs - Public
router.get('/faqs', listFaqs)

// Careers - Public
router.get('/jobs', listJobs)
router.get('/jobs/:id', getJob)
router.post('/jobs/:id/apply', applyJob)

// Contact Form - Public
router.post('/contact', submitInquiry)

// Settings - Public (colors for frontend)
router.get('/settings', getSettings)

export default router
