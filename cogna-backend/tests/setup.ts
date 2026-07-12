// tests/setup.ts — Runs before every test suite
import { vi } from 'vitest'

// Set test environment variables
process.env.NODE_ENV            = 'test'
process.env.APP_ENV             = 'test'
process.env.JWT_SECRET          = 'test-jwt-secret-minimum-32-characters-long'
process.env.JWT_REFRESH_SECRET  = 'test-refresh-secret-minimum-32-chars-long'
process.env.DATABASE_URL        = 'postgresql://user:password@localhost:5432/cogna_test'
process.env.DATABASE_TEST_URL   = 'postgresql://user:password@localhost:5432/cogna_test'

// ── Mock the entire Prisma database module for unit tests ─────────────────
// Unit tests mock at the repository layer, so the DB should never be touched.
vi.mock('@/config/database', () => ({
  default: {
    user:          { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    refreshToken:  { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    apiKey:        { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    order:         { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    payment:       { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    product:       { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    provider:      { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditLog:      { create: vi.fn() },
    setting:       { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    $transaction:  vi.fn((fn: (tx: unknown) => unknown) => fn({})),
    $disconnect:   vi.fn(),
  },
  prisma: {
    user:          { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    refreshToken:  { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  },
}))

// Global mock resets before each test
beforeEach(() => {
  vi.clearAllMocks()
})
