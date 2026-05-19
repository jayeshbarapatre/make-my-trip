import 'dotenv/config'
import prisma from '../src/config/prismaClient.js'

const makeUserAdmin = async (email) => {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { is_admin: true },
      select: { id: true, name: true, email: true, is_admin: true }
    })

    console.log(`✅ User ${user.name} (${email}) is now an admin`)
    process.exit(0)
  } catch (err) {
    if (err.code === 'P2025') {
      console.log(`❌ User with email ${email} not found`)
    } else {
      console.error('Error:', err.message)
    }
    process.exit(1)
  }
}

const email = process.argv[2]
if (!email) {
  console.log('Usage: node scripts/makeAdmin.js <email>')
  console.log('Example: node scripts/makeAdmin.js jayesh@gmail.com')
  process.exit(1)
}

makeUserAdmin(email)
