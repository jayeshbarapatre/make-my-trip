import 'dotenv/config'
import prisma from '../src/config/prismaClient.js'
import { DEFAULT_TEMPLATES } from '../src/config/defaultEmailTemplates.js'

async function seedTemplates() {
  try {
    console.log('🌱 Seeding email templates...')

    let createdCount = 0
    let updatedCount = 0

    for (const [key, template] of Object.entries(DEFAULT_TEMPLATES)) {
      const existing = await prisma.emailTemplate.findUnique({ where: { key } })

      if (existing) {
        // Update existing template to ensure latest defaults
        await prisma.emailTemplate.update({
          where: { key },
          data: {
            name: template.name,
            module: template.module,
            subject: template.subject,
            htmlBody: template.htmlBody,
            variables: template.variables,
            isActive: true
          }
        })
        updatedCount++
        console.log(`✅ Updated template: ${key}`)
      } else {
        // Create new template
        await prisma.emailTemplate.create({
          data: {
            key,
            name: template.name,
            module: template.module,
            subject: template.subject,
            htmlBody: template.htmlBody,
            variables: template.variables,
            isActive: true
          }
        })
        createdCount++
        console.log(`✨ Created template: ${key}`)
      }
    }

    console.log(`\n✅ Seeding complete!`)
    console.log(`   Created: ${createdCount}`)
    console.log(`   Updated: ${updatedCount}`)
    console.log(`   Total: ${createdCount + updatedCount}`)
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedTemplates()
