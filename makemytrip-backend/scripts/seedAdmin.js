import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...')

    const adminEmail = 'admin@makemytrip.com'
    const adminPassword = 'Admin@123'

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log(`✓ Admin user "${adminEmail}" already exists`)
      console.log('Login with:')
      console.log(`  Email: ${adminEmail}`)
      console.log(`  Password: ${adminPassword}`)
      return
    }

    const hashedPassword = await bcryptjs.hash(adminPassword, 10)

    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        phone: '+919999999999',
        password: hashedPassword,
        is_admin: true,
        is_vendor: false,
      },
    })

    console.log('✅ Admin user created successfully!')
    console.log('\n📝 Login Credentials:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('\n🔗 Admin Panel: http://localhost:5173/admin/login')
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()
