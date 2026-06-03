import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getSettings = async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst()

    if (!settings) {
      settings = await prisma.setting.create({
        data: {},
      })
    }

    res.json({ message: 'Settings fetched', data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ message: 'Failed to fetch settings' })
  }
}

export const updateSettings = async (req, res) => {
  try {
    const { primaryColor, secondaryColor, accentColor, footerBg, headerBg, logo, favicon, announcementBar, announcementActive } = req.body

    let settings = await prisma.setting.findFirst()

    if (!settings) {
      settings = await prisma.setting.create({ data: {} })
    }

    const updated = await prisma.setting.update({
      where: { id: settings.id },
      data: {
        primaryColor,
        secondaryColor,
        accentColor,
        footerBg,
        headerBg,
        logo,
        favicon,
        announcementBar,
        announcementActive,
      },
    })

    res.json({ message: 'Settings updated', data: updated })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ message: 'Failed to update settings' })
  }
}
