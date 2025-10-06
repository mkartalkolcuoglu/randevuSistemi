import { PrismaClient } from '@prisma/client'

// Create a single instance for the project-admin app
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Connect to the database
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error)
})
