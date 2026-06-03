import 'dotenv/config'
import prisma from '../src/config/prismaClient.js'
import bcrypt from 'bcryptjs'

async function createAdmins() {
  const usersToCreate = [
    { email: 'jayne@yopmail.com', password: 'User@123', name: 'Jayne Admin' },
    { email: 'jayesh@gmail.com', password: 'Pass@123#', name: 'Jayesh Admin' }
  ];

  try {
    for (const u of usersToCreate) {
      const existing = await prisma.user.findUnique({
        where: { email: u.email },
      })

      const hashedPassword = await bcrypt.hash(u.password, 10)

      if (existing) {
        await prisma.user.update({
          where: { email: u.email },
          data: {
            password: hashedPassword,
            is_admin: true,
          }
        })
        console.log(`✅ Updated existing user ${u.email} to be an Admin with password ${u.password}`)
      } else {
        await prisma.user.create({
          data: {
            name: u.name,
            email: u.email,
            phone: '+919876543210',
            password: hashedPassword,
            is_admin: true,
            is_vendor: false,
          }
        })
        console.log(`✅ Created new Admin user: ${u.email} with password ${u.password}`)
      }
    }
  } catch (error) {
    console.error('❌ Error creating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmins()
