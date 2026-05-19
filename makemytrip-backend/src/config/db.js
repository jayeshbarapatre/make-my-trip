// MongoDB/Mongoose code removed — application uses PostgreSQL with Prisma ORM exclusively.
// This file is kept for backward compatibility with existing imports.

export const connectDB = async () => {
  // No-op: Prisma handles database connection automatically via PrismaClient
}

export const getMongoConnectionStatus = () => false
