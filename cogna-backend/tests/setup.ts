// tests/setup.ts — Runs before every test suite
import { vi } from 'vitest'

// Set test environment variables
process.env.NODE_ENV            = 'test'
process.env.APP_ENV             = 'test'
process.env.JWT_SECRET          = 'test-jwt-secret-minimum-32-characters-long'
process.env.JWT_REFRESH_SECRET  = 'test-refresh-secret-minimum-32-chars-long'
process.env.DATABASE_URL        = 'postgresql://user:password@localhost:5432/cogna_test'
process.env.DATABASE_TEST_URL   = 'postgresql://user:password@localhost:5432/cogna_test'
process.env.PROVIDER_ENCRYPTION_KEY = 'test-provider-encryption-key-at-least-32'
process.env.PAYSTACK_SECRET_KEY = 'sk_test_test-suite-key'

// ── Mock the entire Prisma database module for unit tests ─────────────────
// Unit tests mock at the repository layer, so the DB should never be touched.
vi.mock('@/queue/fulfillment.queue', () => ({
  fulfillmentQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
  }
}))

vi.mock('@/config/database', () => ({
  default: {
    user:          { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    refreshToken:  { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    apiKey:        { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    order:         { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    payment:       { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    paymentGatewayConfiguration: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    product:       { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    provider:      { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    category:      { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    auditLog:      { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    setting:       { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    userCapability:{ findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    apiRequestLog: { create: vi.fn(), findMany: vi.fn() },
    developerWebhookEndpoint: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    developerWebhookDelivery: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    providerWebhookEvent: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    wallet:        { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), aggregate: vi.fn() },
    walletFunding: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    walletTransaction: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    walletAdjustmentRequest: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    verificationToken: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    orderStatusEvent: { create: vi.fn(), findMany: vi.fn() },
    supportTicket: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    supportMessage: { create: vi.fn(), findMany: vi.fn() },
    notification: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    notificationPreference: { findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn(), update: vi.fn() },
    receipt: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    $transaction:  vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
      wallet: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'wallet-1',
          userId: 'user-customer',
          availableBalance: {
            add: () => ({ lessThan: () => false }),
            sub: () => ({ lessThan: () => false }),
            lessThan: () => false,
          },
          pendingBalance: 0,
          lifetimeFunded: { add: () => {} },
          lifetimeSpent: { sub: () => ({ add: () => {} }), add: () => {} },
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      walletTransaction: { create: vi.fn().mockResolvedValue({}) },
      walletAdjustmentRequest: {
        update: vi.fn().mockResolvedValue({
          id: 'request-123',
          walletId: 'wallet-1',
          makerId: 'user-finance',
          amount: 50,
          direction: 'CREDIT',
          status: 'APPROVED',
        }),
      },
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'order-1',
          userId: 'user-customer',
          productId: 'prod-1',
          amount: 100,
          status: 'PENDING',
          createdAt: new Date(),
          product: { name: 'Netflix Premium' },
          payment: null,
          walletTransactions: [{ direction: 'DEBIT', type: 'PURCHASE' }]
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      orderStatusEvent: { create: vi.fn().mockResolvedValue({}) },
      receipt: { create: vi.fn().mockResolvedValue({}) },
      notification: { create: vi.fn().mockResolvedValue({}) },
      supportTicket: { create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => Promise.resolve({ id: 'ticket-1', ...args.data })) },
      supportMessage: { create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) => Promise.resolve({ id: 'msg-1', ...args.data })) },
    })),
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
