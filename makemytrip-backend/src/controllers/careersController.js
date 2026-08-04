import { contentStore } from '../services/contentStore.js'
import { sanitizeText } from '../utils/sanitize.js'

// Migrated from Prisma/MongoDB to Firestore. listJobs is public and used to
// hang for ~15s against an unreachable MongoDB.

const jobs = contentStore('job_positions')
const applications = contentStore('job_applications')

const JOB_FIELDS = ['department', 'location', 'type', 'experience', 'description', 'requirements', 'salaryRange']

const pickJobFields = (body) =>
  Object.fromEntries(JOB_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]))

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? ''))

export const listJobs = async (_req, res) => {
  try {
    res.json({ message: 'Jobs fetched', data: await jobs.list({ activeOnly: true }) })
  } catch (error) {
    console.error('Error fetching jobs:', error.message)
    res.status(500).json({ message: 'Failed to fetch jobs' })
  }
}

export const getJob = async (req, res) => {
  try {
    const job = await jobs.getById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found' })

    // Applicant details are not public; only expose the count on this route.
    const jobApplications = await applications.list({ where: { field: 'jobId', value: req.params.id } })

    res.json({ message: 'Job fetched', data: { ...job, applicationCount: jobApplications.length } })
  } catch (error) {
    console.error('Error fetching job:', error.message)
    res.status(500).json({ message: 'Failed to fetch job' })
  }
}

export const applyJob = async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name, 120)
    const email = sanitizeText(req.body?.email, 200)

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' })
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required' })
    }

    const job = await jobs.getById(req.params.id)
    if (!job || job.status !== 'active') {
      return res.status(404).json({ message: 'Job not found' })
    }

    const application = await applications.create({
      jobId: req.params.id,
      jobTitle: job.title ?? null,
      name,
      email,
      phone: sanitizeText(req.body?.phone, 20) || null,
      resume: sanitizeText(req.body?.resume, 500) || null,
      message: sanitizeText(req.body?.message, 4000) || null,
      status: 'pending'
    })

    res.status(201).json({ message: 'Application submitted', data: application })
  } catch (error) {
    console.error('Error applying to job:', error.message)
    res.status(500).json({ message: 'Failed to apply to job' })
  }
}

// ── Admin ──

export const listAllJobs = async (_req, res) => {
  try {
    res.json({ message: 'Jobs fetched', data: await jobs.list() })
  } catch (error) {
    console.error('Error fetching jobs:', error.message)
    res.status(500).json({ message: 'Failed to fetch jobs' })
  }
}

export const createJob = async (req, res) => {
  try {
    const title = sanitizeText(req.body?.title, 200)
    if (!title) return res.status(400).json({ message: 'Title is required' })

    const job = await jobs.create({
      title,
      status: req.body.status === 'inactive' ? 'inactive' : 'active',
      ...pickJobFields(req.body)
    }, req.adminId)

    res.status(201).json({ message: 'Job created', data: job })
  } catch (error) {
    console.error('Error creating job:', error.message)
    res.status(500).json({ message: 'Failed to create job' })
  }
}

export const updateJob = async (req, res) => {
  try {
    const job = await jobs.update(req.params.id, {
      title: req.body.title !== undefined ? sanitizeText(req.body.title, 200) : undefined,
      status: req.body.status,
      ...pickJobFields(req.body)
    }, req.adminId)

    if (!job) return res.status(404).json({ message: 'Job not found' })

    res.json({ message: 'Job updated', data: job })
  } catch (error) {
    console.error('Error updating job:', error.message)
    res.status(500).json({ message: 'Failed to update job' })
  }
}

export const deleteJob = async (req, res) => {
  try {
    const ok = await jobs.remove(req.params.id, req.adminId)
    if (!ok) return res.status(404).json({ message: 'Job not found' })
    res.json({ message: 'Job deleted' })
  } catch (error) {
    console.error('Error deleting job:', error.message)
    res.status(500).json({ message: 'Failed to delete job' })
  }
}

export const listApplications = async (req, res) => {
  try {
    const rows = await applications.list({ where: { field: 'jobId', value: req.params.jobId } })
    res.json({ message: 'Applications fetched', data: rows })
  } catch (error) {
    console.error('Error fetching applications:', error.message)
    res.status(500).json({ message: 'Failed to fetch applications' })
  }
}

export const updateApplicationStatus = async (req, res) => {
  try {
    const status = sanitizeText(req.body?.status, 40)
    if (!status) return res.status(400).json({ message: 'Status is required' })

    const application = await applications.update(req.params.id, { status }, req.adminId)
    if (!application) return res.status(404).json({ message: 'Application not found' })

    res.json({ message: 'Application status updated', data: application })
  } catch (error) {
    console.error('Error updating application:', error.message)
    res.status(500).json({ message: 'Failed to update application' })
  }
}
