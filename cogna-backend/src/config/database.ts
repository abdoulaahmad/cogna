import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from './env'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString:
      env.APP_ENV === 'test'
        ? (env.DATABASE_TEST_URL ?? env.DATABASE_URL)
        : env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter,
    log: env.APP_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (env.APP_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
