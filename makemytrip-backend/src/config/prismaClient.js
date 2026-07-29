import { PrismaClient } from '@prisma/client'

// Prisma remains only for the legacy admin/vendor portal paths. All user-facing
// data lives in Firestore — see CLAUDE.md.

let prisma = null
let initialized = false

const initializePrisma = () => {
  if (initialized) return prisma
  initialized = true

  prisma = new PrismaClient({ errorFormat: 'pretty' })

  // Fire and forget: awaiting here would block server startup.
  prisma.$connect()
    .then(() => console.log('✅ Prisma connected to database'))
    .catch((err) => console.warn('⚠️ Prisma connection failed (will retry):', err.message))

  return prisma
}

export default prisma || initializePrisma()
