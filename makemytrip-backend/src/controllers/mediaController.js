import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { contentStore } from '../services/contentStore.js'

// Migrated from Prisma/MongoDB to Firestore. Files still live on disk under
// public/uploads; only the catalogue moved.

const store = contentStore('media_library')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_ROOT = path.resolve(__dirname, '../../public')

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { filename, size, mimetype } = req.file

    const media = await store.create({
      fileName: filename,
      fileUrl: `/uploads/${filename}`,
      fileType: mimetype,
      size
    }, req.adminId)

    res.status(201).json({ message: 'File uploaded', data: media })
  } catch (error) {
    console.error('Error uploading file:', error.message)
    res.status(500).json({ message: 'Failed to upload file' })
  }
}

export const listMedia = async (_req, res) => {
  try {
    res.json({ message: 'Media fetched', data: await store.list() })
  } catch (error) {
    console.error('Error fetching media:', error.message)
    res.status(500).json({ message: 'Failed to fetch media' })
  }
}

export const getMediaById = async (req, res) => {
  try {
    const media = await store.getById(req.params.id)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    res.json({ message: 'Media fetched', data: media })
  } catch (error) {
    console.error('Error fetching media:', error.message)
    res.status(500).json({ message: 'Failed to fetch media' })
  }
}

export const deleteMedia = async (req, res) => {
  try {
    const media = await store.getById(req.params.id)
    if (!media) return res.status(404).json({ message: 'Media not found' })

    // Resolve inside the upload root before unlinking: a stored fileUrl
    // containing ../ would otherwise delete an arbitrary file on disk.
    if (media.fileUrl) {
      const target = path.resolve(UPLOAD_ROOT, `.${media.fileUrl}`)
      if (target.startsWith(UPLOAD_ROOT + path.sep) && fs.existsSync(target)) {
        fs.unlinkSync(target)
      } else if (!target.startsWith(UPLOAD_ROOT + path.sep)) {
        console.warn(`⚠️ Refusing to delete media outside the upload root: ${media.fileUrl}`)
      }
    }

    await store.remove(req.params.id, req.adminId)

    res.json({ message: 'Media deleted' })
  } catch (error) {
    console.error('Error deleting media:', error.message)
    res.status(500).json({ message: 'Failed to delete media' })
  }
}
