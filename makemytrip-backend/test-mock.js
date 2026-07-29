console.log('Testing mock data client...')
import { createMockPrismaClient } from './src/middleware/useMockData.js'
console.log('Mock function imported')
const mockPrisma = createMockPrismaClient()
console.log('Mock Prisma created')
console.log('Test complete')
process.exit(0)
