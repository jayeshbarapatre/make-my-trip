import { PrismaClient } from '@prisma/client'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const prisma = new PrismaClient()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { filename, size, mimetype } = req.file
    const fileUrl = `/uploads/${filename}`

    const media = await prisma.mediaLibrary.create({
      data: {
        fileName: filename,
        fileUrl: fileUrl,
        fileType: mimetype,
        size: size,
      },
    })

    res.status(201).json({ message: 'File uploaded', data: media })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ message: 'Failed to upload file' })
  }
}

export const listMedia = async (req, res) => {
  try {
    const media = await prisma.mediaLibrary.findMany({
      orderBy: { createdAt: 'desc' },
    })

    res.json({ message: 'Media fetched', data: media })
  } catch (error) {
    console.error('Error fetching media:', error)
    res.status(500).json({ message: 'Failed to fetch media' })
  }
}

export const getMediaById = async (req, res) => {
  try {
    const { id } = req.params

    const media = await prisma.mediaLibrary.findUnique({ where: { id } })

    if (!media) {
      return res.status(404).json({ message: 'Media not found' })
    }

    res.json({ message: 'Media fetched', data: media })
  } catch (error) {
    console.error('Error fetching media:', error)
    res.status(500).json({ message: 'Failed to fetch media' })
  }
}

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params

    const media = await prisma.mediaLibrary.findUnique({ where: { id } })

    if (!media) {
      return res.status(404).json({ message: 'Media not found' })
    }

    const filePath = path.join(__dirname, '../../public', media.fileUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await prisma.mediaLibrary.delete({ where: { id } })

    res.json({ message: 'Media deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Media not found' })
    }
    console.error('Error deleting media:', error)
    res.status(500).json({ message: 'Failed to delete media' })
  }
}
