import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const listJobs = async (req, res) => {
  try {
    const jobs = await prisma.jobPosition.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ message: 'Jobs fetched', data: jobs })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    res.status(500).json({ message: 'Failed to fetch jobs' })
  }
}

export const getJob = async (req, res) => {
  try {
    const { id } = req.params
    const job = await prisma.jobPosition.findUnique({
      where: { id },
      include: { applications: true },
    })

    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    res.json({ message: 'Job fetched', data: job })
  } catch (error) {
    console.error('Error fetching job:', error)
    res.status(500).json({ message: 'Failed to fetch job' })
  }
}

export const applyJob = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, resume, message } = req.body

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' })
    }

    const job = await prisma.jobPosition.findUnique({ where: { id } })
    if (!job) {
      return res.status(404).json({ message: 'Job not found' })
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        name,
        email,
        phone: phone || null,
        resume: resume || null,
        message: message || null,
        status: 'pending',
      },
    })

    res.status(201).json({ message: 'Application submitted', data: application })
  } catch (error) {
    console.error('Error applying to job:', error)
    res.status(500).json({ message: 'Failed to apply to job' })
  }
}

export const listAllJobs = async (req, res) => {
  try {
    const jobs = await prisma.jobPosition.findMany({
      orderBy: { createdAt: 'desc' },
      include: { applications: true },
    })

    res.json({ message: 'Jobs fetched', data: jobs })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    res.status(500).json({ message: 'Failed to fetch jobs' })
  }
}

export const createJob = async (req, res) => {
  try {
    const { title, department, location, experience, description, status } = req.body

    if (!title || !department || !location || !experience || !description) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const job = await prisma.jobPosition.create({
      data: {
        title,
        department,
        location,
        experience,
        description,
        status: status || 'active',
      },
    })

    res.status(201).json({ message: 'Job created', data: job })
  } catch (error) {
    console.error('Error creating job:', error)
    res.status(500).json({ message: 'Failed to create job' })
  }
}

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params
    const { title, department, location, experience, description, status } = req.body

    const job = await prisma.jobPosition.update({
      where: { id },
      data: { title, department, location, experience, description, status },
    })

    res.json({ message: 'Job updated', data: job })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Job not found' })
    }
    console.error('Error updating job:', error)
    res.status(500).json({ message: 'Failed to update job' })
  }
}

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.jobPosition.delete({ where: { id } })

    res.json({ message: 'Job deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Job not found' })
    }
    console.error('Error deleting job:', error)
    res.status(500).json({ message: 'Failed to delete job' })
  }
}

export const listApplications = async (req, res) => {
  try {
    const { jobId } = req.params

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ message: 'Applications fetched', data: applications })
  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({ message: 'Failed to fetch applications' })
  }
}

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }

    const application = await prisma.jobApplication.update({
      where: { id },
      data: { status },
    })

    res.json({ message: 'Application status updated', data: application })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Application not found' })
    }
    console.error('Error updating application:', error)
    res.status(500).json({ message: 'Failed to update application' })
  }
}
