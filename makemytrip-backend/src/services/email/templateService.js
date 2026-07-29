import prisma from '../../config/prismaClient.js'
import { DEFAULT_TEMPLATES } from '../../config/defaultEmailTemplates.js'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let templateCache = {}
let cacheTimestamp = {}

export const getTemplate = async (key) => {
  try {
    // Check cache first
    if (templateCache[key] && (Date.now() - cacheTimestamp[key]) < CACHE_TTL) {
      console.log(`📧 Template cache hit: ${key}`)
      return templateCache[key]
    }

    // Try to fetch from database
    const template = await prisma.emailTemplate.findUnique({ where: { key } })

    if (template && template.isActive) {
      templateCache[key] = template
      cacheTimestamp[key] = Date.now()
      console.log(`📧 Template loaded from DB: ${key}`)
      return template
    }

    // Fall back to defaults
    const defaultTemplate = DEFAULT_TEMPLATES[key]
    if (defaultTemplate) {
      console.log(`📧 Using default template: ${key}`)
      return defaultTemplate
    }

    // Template not found
    throw new Error(`Email template not found: ${key}`)
  } catch (error) {
    console.error(`Error fetching template ${key}:`, error.message)
    // Last resort: try to return a default
    if (DEFAULT_TEMPLATES[key]) {
      console.warn(`Falling back to default template for ${key}`)
      return DEFAULT_TEMPLATES[key]
    }
    throw error
  }
}

export const clearCache = () => {
  templateCache = {}
  cacheTimestamp = {}
  console.log('📧 Template cache cleared')
}

export const listTemplates = async () => {
  try {
    return await prisma.emailTemplate.findMany({
      orderBy: { module: 'asc', key: 'asc' }
    })
  } catch (error) {
    console.error('Error listing templates:', error.message)
    throw error
  }
}

export const getTemplateByKey = async (key) => {
  try {
    return await prisma.emailTemplate.findUnique({ where: { key } })
  } catch (error) {
    console.error(`Error fetching template ${key}:`, error.message)
    throw error
  }
}

export const createTemplate = async (data) => {
  try {
    const template = await prisma.emailTemplate.create({
      data: {
        key: data.key,
        name: data.name,
        module: data.module,
        subject: data.subject,
        htmlBody: data.htmlBody,
        variables: data.variables || [],
        isActive: data.isActive ?? true,
        updatedBy: data.updatedBy
      }
    })
    clearCache()
    return template
  } catch (error) {
    console.error('Error creating template:', error.message)
    throw error
  }
}

export const updateTemplate = async (key, data) => {
  try {
    const template = await prisma.emailTemplate.update({
      where: { key },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.subject && { subject: data.subject }),
        ...(data.htmlBody && { htmlBody: data.htmlBody }),
        ...(data.variables && { variables: data.variables }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.updatedBy && { updatedBy: data.updatedBy }),
        updatedAt: new Date()
      }
    })
    clearCache()
    return template
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(`Template not found: ${key}`)
    }
    console.error('Error updating template:', error.message)
    throw error
  }
}

export const toggleTemplate = async (key) => {
  try {
    const template = await prisma.emailTemplate.findUnique({ where: { key } })
    if (!template) throw new Error(`Template not found: ${key}`)

    const updated = await prisma.emailTemplate.update({
      where: { key },
      data: { isActive: !template.isActive }
    })
    clearCache()
    return updated
  } catch (error) {
    console.error('Error toggling template:', error.message)
    throw error
  }
}

export const deleteTemplate = async (key) => {
  try {
    await prisma.emailTemplate.delete({ where: { key } })
    clearCache()
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error(`Template not found: ${key}`)
    }
    console.error('Error deleting template:', error.message)
    throw error
  }
}

export const upsertTemplate = async (key, data) => {
  try {
    const template = await prisma.emailTemplate.upsert({
      where: { key },
      update: {
        name: data.name,
        module: data.module,
        subject: data.subject,
        htmlBody: data.htmlBody,
        variables: data.variables || [],
        isActive: data.isActive ?? true,
        updatedBy: data.updatedBy,
        updatedAt: new Date()
      },
      create: {
        key,
        name: data.name,
        module: data.module,
        subject: data.subject,
        htmlBody: data.htmlBody,
        variables: data.variables || [],
        isActive: data.isActive ?? true,
        updatedBy: data.updatedBy
      }
    })
    clearCache()
    return template
  } catch (error) {
    console.error('Error upserting template:', error.message)
    throw error
  }
}

export default {
  getTemplate,
  clearCache,
  listTemplates,
  getTemplateByKey,
  createTemplate,
  updateTemplate,
  toggleTemplate,
  deleteTemplate,
  upsertTemplate
}
