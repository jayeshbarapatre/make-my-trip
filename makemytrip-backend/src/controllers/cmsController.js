import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const listCmsPages = async (req, res) => {
  try {
    const pages = await prisma.cmsPage.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ message: 'CMS pages fetched', data: pages })
  } catch (error) {
    console.error('Error fetching CMS pages:', error)
    res.status(500).json({ message: 'Failed to fetch CMS pages' })
  }
}

export const createCmsPage = async (req, res) => {
  try {
    const { title, slug, metaTitle, metaDescription, metaKeywords, ogImage, canonicalUrl, schemaJson, bannerImage, shortDescription, content, status } = req.body

    if (!title || !slug || !content) {
      return res.status(400).json({ message: 'Title, slug, and content are required' })
    }

    const existingPage = await prisma.cmsPage.findUnique({ where: { slug } })
    if (existingPage) {
      return res.status(409).json({ message: 'Slug already exists' })
    }

    const page = await prisma.cmsPage.create({
      data: {
        title,
        slug,
        metaTitle,
        metaDescription,
        metaKeywords,
        ogImage,
        canonicalUrl,
        schemaJson,
        bannerImage,
        shortDescription,
        content,
        status: status || 'active',
      },
    })

    res.status(201).json({ message: 'CMS page created', data: page })
  } catch (error) {
    console.error('Error creating CMS page:', error)
    res.status(500).json({ message: 'Failed to create CMS page' })
  }
}

export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params
    const page = await prisma.cmsPage.findUnique({ where: { slug } })

    if (!page) {
      return res.status(404).json({ message: 'Page not found' })
    }

    res.json({ message: 'Page fetched', data: page })
  } catch (error) {
    console.error('Error fetching page:', error)
    res.status(500).json({ message: 'Failed to fetch page' })
  }
}

export const updateCmsPage = async (req, res) => {
  try {
    const { id } = req.params
    const { title, slug, metaTitle, metaDescription, metaKeywords, ogImage, canonicalUrl, schemaJson, bannerImage, shortDescription, content, status } = req.body

    const page = await prisma.cmsPage.update({
      where: { id },
      data: {
        title,
        slug,
        metaTitle,
        metaDescription,
        metaKeywords,
        ogImage,
        canonicalUrl,
        schemaJson,
        bannerImage,
        shortDescription,
        content,
        status,
      },
    })

    res.json({ message: 'CMS page updated', data: page })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'CMS page not found' })
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Slug already exists' })
    }
    console.error('Error updating CMS page:', error)
    res.status(500).json({ message: 'Failed to update CMS page' })
  }
}

export const deleteCmsPage = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.cmsPage.delete({ where: { id } })

    res.json({ message: 'CMS page deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'CMS page not found' })
    }
    console.error('Error deleting CMS page:', error)
    res.status(500).json({ message: 'Failed to delete CMS page' })
  }
}
