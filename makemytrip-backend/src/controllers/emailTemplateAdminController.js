import * as templateService from '../services/email/templateService.js'
import { renderTemplate } from '../services/email/templateEngine.js'
import prisma from '../config/prismaClient.js'

// List all templates
export const listTemplates = async (req, res) => {
  try {
    const templates = await templateService.listTemplates()

    res.json({
      message: 'Email templates retrieved',
      data: {
        templates,
        total: templates.length
      }
    })
  } catch (err) {
    console.error('List templates error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Get single template by key
export const getTemplate = async (req, res) => {
  try {
    const { key } = req.params

    if (!key) {
      return res.status(400).json({ message: 'Template key is required' })
    }

    const template = await templateService.getTemplateByKey(key)

    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    res.json({
      message: 'Template retrieved',
      data: { template }
    })
  } catch (err) {
    console.error('Get template error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Create new template
export const createTemplate = async (req, res) => {
  try {
    const { key, name, module, subject, htmlBody, variables } = req.body

    const errors = {}
    if (!key || !key.trim()) errors.key = 'Template key is required'
    if (!name || !name.trim()) errors.name = 'Template name is required'
    if (!module || !module.trim()) errors.module = 'Module is required'
    if (!subject || !subject.trim()) errors.subject = 'Subject template is required'
    if (!htmlBody || !htmlBody.trim()) errors.htmlBody = 'HTML body is required'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const existing = await templateService.getTemplateByKey(key)
    if (existing) {
      return res.status(409).json({ message: 'Template with this key already exists' })
    }

    const template = await templateService.createTemplate({
      key: key.trim(),
      name: name.trim(),
      module: module.trim(),
      subject: subject.trim(),
      htmlBody: htmlBody.trim(),
      variables: variables || [],
      updatedBy: req.adminId
    })

    res.status(201).json({
      message: 'Template created successfully',
      data: { template }
    })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Template key already exists' })
    }
    console.error('Create template error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { key } = req.params
    const { name, subject, htmlBody, variables, isActive } = req.body

    if (!key) {
      return res.status(400).json({ message: 'Template key is required' })
    }

    const errors = {}
    if (name && !name.trim()) errors.name = 'Name cannot be empty'
    if (subject && !subject.trim()) errors.subject = 'Subject cannot be empty'
    if (htmlBody && !htmlBody.trim()) errors.htmlBody = 'HTML body cannot be empty'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const template = await templateService.updateTemplate(key, {
      ...(name && { name: name.trim() }),
      ...(subject && { subject: subject.trim() }),
      ...(htmlBody && { htmlBody: htmlBody.trim() }),
      ...(variables && { variables }),
      ...(isActive !== undefined && { isActive }),
      updatedBy: req.adminId
    })

    res.json({
      message: 'Template updated successfully',
      data: { template }
    })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Template not found' })
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message })
    }
    console.error('Update template error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Toggle template active status
export const toggleTemplate = async (req, res) => {
  try {
    const { key } = req.params

    if (!key) {
      return res.status(400).json({ message: 'Template key is required' })
    }

    const template = await templateService.toggleTemplate(key)

    res.json({
      message: `Template ${template.isActive ? 'activated' : 'deactivated'}`,
      data: { template }
    })
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message })
    }
    console.error('Toggle template error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { key } = req.params

    if (!key) {
      return res.status(400).json({ message: 'Template key is required' })
    }

    await templateService.deleteTemplate(key)

    res.json({ message: 'Template deleted successfully' })
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message })
    }
    console.error('Delete template error:', err)
    res.status(500).json({ message: err.message })
  }
}

// Preview template with sample data
export const previewTemplate = async (req, res) => {
  try {
    const { key } = req.params
    const { data } = req.body

    if (!key) {
      return res.status(400).json({ message: 'Template key is required' })
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ message: 'Sample data is required' })
    }

    const template = await templateService.getTemplateByKey(key)

    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    // Render with sample data
    const renderedSubject = renderTemplate(template.subject, data)
    const renderedHtml = renderTemplate(template.htmlBody, data)

    res.json({
      message: 'Template preview rendered',
      data: {
        subject: renderedSubject,
        html: renderedHtml
      }
    })
  } catch (err) {
    console.error('Preview template error:', err)
    res.status(500).json({ message: err.message })
  }
}

export default {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  toggleTemplate,
  deleteTemplate,
  previewTemplate
}
