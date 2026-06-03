import { PrismaClient } from '@prisma/client'

// Replace with session pooler URL
const databaseUrl = "postgresql://postgres.kezqdkcqrnguufngokvh:Jayesh%408866121829@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
process.env.DATABASE_URL = databaseUrl

const prisma = new PrismaClient()

async function main() {
  console.log("Testing connection to Session Pooler database URL...")
  try {
    const userCount = await prisma.user.count()
    console.log("✅ Connection successful!")
    console.log("User count in database:", userCount)
  } catch (err) {
    console.error("❌ Database connection/query error:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
