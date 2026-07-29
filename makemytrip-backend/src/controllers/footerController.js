import prisma from '../config/prismaClient.js'

export const getFooter = async (req, res) => {
  try {
    const sections = await prisma.footerSection.findMany({
      where: { status: 'active' },
      include: { links: { where: { status: 'active' }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ message: 'Footer fetched', data: sections })
  } catch (error) {
    console.error('Error fetching footer:', error)
    res.status(500).json({ message: 'Failed to fetch footer' })
  }
}

export const listSections = async (req, res) => {
  try {
    const sections = await prisma.footerSection.findMany({
      include: { links: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    })

    res.json({ message: 'Sections fetched', data: sections })
  } catch (error) {
    console.error('Error fetching sections:', error)
    res.status(500).json({ message: 'Failed to fetch sections' })
  }
}

export const createSection = async (req, res) => {
  try {
    const { title, sortOrder, status } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Title is required' })
    }

    const section = await prisma.footerSection.create({
      data: {
        title,
        sortOrder: sortOrder || 0,
        status: status || 'active',
      },
    })

    res.status(201).json({ message: 'Section created', data: section })
  } catch (error) {
    console.error('Error creating section:', error)
    res.status(500).json({ message: 'Failed to create section' })
  }
}

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params
    const { title, sortOrder, status } = req.body

    const section = await prisma.footerSection.update({
      where: { id },
      data: { title, sortOrder, status },
    })

    res.json({ message: 'Section updated', data: section })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Section not found' })
    }
    console.error('Error updating section:', error)
    res.status(500).json({ message: 'Failed to update section' })
  }
}

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.footerSection.delete({ where: { id } })

    res.json({ message: 'Section deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Section not found' })
    }
    console.error('Error deleting section:', error)
    res.status(500).json({ message: 'Failed to delete section' })
  }
}

export const createLink = async (req, res) => {
  try {
    const { sectionId, title, url, target, sortOrder, status } = req.body

    if (!sectionId || !title) {
      return res.status(400).json({ message: 'Section ID and title are required' })
    }

    const link = await prisma.footerLink.create({
      data: {
        sectionId,
        title,
        url: url || null,
        target: target || '_self',
        sortOrder: sortOrder || 0,
        status: status || 'active',
      },
    })

    res.status(201).json({ message: 'Link created', data: link })
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(404).json({ message: 'Section not found' })
    }
    console.error('Error creating link:', error)
    res.status(500).json({ message: 'Failed to create link' })
  }
}

export const updateLink = async (req, res) => {
  try {
    const { id } = req.params
    const { title, url, target, sortOrder, status } = req.body

    const link = await prisma.footerLink.update({
      where: { id },
      data: { title, url, target, sortOrder, status },
    })

    res.json({ message: 'Link updated', data: link })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Link not found' })
    }
    console.error('Error updating link:', error)
    res.status(500).json({ message: 'Failed to update link' })
  }
}

export const deleteLink = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.footerLink.delete({ where: { id } })

    res.json({ message: 'Link deleted' })
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Link not found' })
    }
    console.error('Error deleting link:', error)
    res.status(500).json({ message: 'Failed to delete link' })
  }
}
