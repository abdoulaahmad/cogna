import { defineConfig } from 'prisma/config'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const connectionUrl =
  process.env.NODE_ENV === 'test'
    ? (process.env.DATABASE_TEST_URL ?? process.env.DATABASE_URL ?? '')
    : (process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? '')

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: connectionUrl,
  },
  migrations: {
    seed: 'ts-node -r tsconfig-paths/register prisma/seed.ts',
  },
})
