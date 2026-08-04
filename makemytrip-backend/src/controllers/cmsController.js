import { contentStore } from '../services/contentStore.js'
import { sanitizeText } from '../utils/sanitize.js'

// Migrated from Prisma/MongoDB to Firestore. getPageBySlug is public and used
// to hang for ~15s against an unreachable MongoDB.

const store = contentStore('cms_pages')

// Slugs are the public URL segment, so keep them URL-safe and unique.
const normalizeSlug = (value) =>
  sanitizeText(value, 120).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')

const PAGE_FIELDS = [
  'metaTitle', 'metaDescription', 'metaKeywords', 'ogImage',
  'canonicalUrl', 'schemaJson', 'bannerImage', 'shortDescription'
]

const pickFields = (body) =>
  Object.fromEntries(PAGE_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]))

export const listCmsPages = async (_req, res) => {
  try {
    res.json({ message: 'CMS pages fetched', data: await store.list() })
  } catch (error) {
    console.error('Error listing CMS pages:', error.message)
    res.status(500).json({ message: 'Failed to fetch CMS pages' })
  }
}

export const createCmsPage = async (req, res) => {
  try {
    const { title, content, status } = req.body
    const slug = normalizeSlug(req.body.slug)

    if (!title || !slug || !content) {
      return res.status(400).json({ message: 'Title, slug, and content are required' })
    }

    if (await store.findOneBy('slug', slug)) {
      return res.status(409).json({ message: 'Slug already exists' })
    }

    const page = await store.create({
      title: sanitizeText(title, 200),
      slug,
      // `content` is authored rich text — deliberately not run through the
      // plain-text sanitizer, which would strip the editor's markup.
      content,
      status: status === 'inactive' ? 'inactive' : 'active',
      ...pickFields(req.body)
    }, req.adminId)

    res.status(201).json({ message: 'CMS page created', data: page })
  } catch (error) {
    console.error('Error creating CMS page:', error.message)
    res.status(500).json({ message: 'Failed to create CMS page' })
  }
}

export const getPageBySlug = async (req, res) => {
  try {
    const page = await store.findOneBy('slug', req.params.slug)
    if (!page || page.status !== 'active') {
      return res.status(404).json({ message: 'Page not found' })
    }
    res.json({ message: 'Page fetched', data: page })
  } catch (error) {
    console.error('Error fetching page:', error.message)
    res.status(500).json({ message: 'Failed to fetch page' })
  }
}

export const updateCmsPage = async (req, res) => {
  try {
    let slug
    if (req.body.slug !== undefined) {
      slug = normalizeSlug(req.body.slug)
      if (!slug) return res.status(400).json({ message: 'Slug cannot be empty' })

      const clash = await store.findOneBy('slug', slug)
      if (clash && clash.id !== req.params.id) {
        return res.status(409).json({ message: 'Slug already exists' })
      }
    }

    const page = await store.update(req.params.id, {
      title: req.body.title !== undefined ? sanitizeText(req.body.title, 200) : undefined,
      slug,
      content: req.body.content,
      status: req.body.status,
      ...pickFields(req.body)
    }, req.adminId)

    if (!page) return res.status(404).json({ message: 'CMS page not found' })

    res.json({ message: 'CMS page updated', data: page })
  } catch (error) {
    console.error('Error updating CMS page:', error.message)
    res.status(500).json({ message: 'Failed to update CMS page' })
  }
}

export const deleteCmsPage = async (req, res) => {
  try {
    const ok = await store.remove(req.params.id, req.adminId)
    if (!ok) return res.status(404).json({ message: 'CMS page not found' })
    res.json({ message: 'CMS page deleted' })
  } catch (error) {
    console.error('Error deleting CMS page:', error.message)
    res.status(500).json({ message: 'Failed to delete CMS page' })
  }
}
