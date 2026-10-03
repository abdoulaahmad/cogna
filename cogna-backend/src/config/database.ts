import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { env } from './env'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const isProd = env.APP_ENV === 'production'
  const isTest = env.APP_ENV === 'test'

  // Safety guardrail for Heroku: never allow ephemeral local files in production
  if (isProd && (!env.TURSO_DATABASE_URL || env.TURSO_DATABASE_URL.startsWith('file:'))) {
    throw new Error(
      'FATAL: TURSO_DATABASE_URL with a remote libsql:// endpoint is mandatory in production to prevent data loss on ephemeral Heroku dynos.'
    )
  }

  const url = isTest
    ? (env.DATABASE_TEST_URL ?? 'file:./test.db')
    : (env.TURSO_DATABASE_URL ?? env.DATABASE_URL ?? 'file:./dev.db')

  const adapter = new PrismaLibSql({
    url,
    authToken: env.TURSO_AUTH_TOKEN,
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

