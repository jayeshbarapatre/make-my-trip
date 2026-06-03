import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  errorFormat: 'pretty',
})

// Test connection on startup (non-blocking)
prisma.$connect()
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.log('⚠️ Database connection error (will retry):', err.message))

export default prisma
