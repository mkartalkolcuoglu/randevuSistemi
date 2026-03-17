import { PrismaClient } from '@prisma/client'

// Create a single instance for the admin app
const basePrisma = new PrismaClient({
  log: ['warn', 'error'],
})

// Extend with retry logic for cached plan errors (Neon pooler issue)
export const prisma = basePrisma.$extends({
  query: {
    $allOperations: async ({ args, query, operation, model }) => {
      try {
        return await query(args)
      } catch (error: any) {
        // Catch "cached plan must not change result type" error
        if (error?.message?.includes('cached plan must not change result type')) {
          console.warn(`⚠️ Cached plan error on ${model}.${operation}, flushing and retrying...`)
          try {
            await basePrisma.$executeRawUnsafe('DEALLOCATE ALL')
          } catch (deallocErr) {
            // DEALLOCATE might fail on some pooler configs, that's ok
            console.warn('⚠️ DEALLOCATE ALL failed (expected with some poolers):', deallocErr)
          }
          // Disconnect and reconnect to get a fresh connection
          await basePrisma.$disconnect()
          await basePrisma.$connect()
          // Retry the query
          return await query(args)
        }
        throw error
      }
    },
  },
})

// Connect to the database
basePrisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error)
})
