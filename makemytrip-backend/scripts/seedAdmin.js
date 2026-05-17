import 'dotenv/config'
import bcryptjs from 'bcryptjs'
import prisma from '../src/config/prismaClient.js'

const seedAdmin = async () => {
  console.log('🌱 Creating admin user...')

  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'jayesh@gopmail.com' }
    })

    if (existing && existing.is_admin) {
      console.log('✓ Admin already exists:', existing.email)
      await prisma.$disconnect()
      return
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash('User@123', 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'jayesh@gopmail.com',
        password: hashedPassword,
        phone: '9999999999',
        is_admin: true
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('')
    console.log('📧 Email: jayesh@gopmail.com')
    console.log('🔐 Password: User@123')
    console.log('')
    console.log('You can now login to the admin panel.')

  } catch (error) {
    console.error('❌ Failed to create admin:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()
