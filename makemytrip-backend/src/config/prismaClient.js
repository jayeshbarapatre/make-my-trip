import { PrismaClient } from '@prisma/client'
import { createMockPrismaClient } from '../middleware/useMockData.js'

let prisma
if (process.env.USE_MOCK_DATA === 'true') {
  console.log('🎭 MOCK DATA MODE ENABLED - Using in-memory mock database')
  prisma = createMockPrismaClient()
} else {
  prisma = new PrismaClient({
    errorFormat: 'pretty',
  })

  // Test connection on startup (non-blocking)
  prisma.$connect()
    .then(() => console.log('✅ Database connected'))
    .catch((err) => console.log('⚠️ Database connection error (will retry):', err.message))
}

export default prisma
