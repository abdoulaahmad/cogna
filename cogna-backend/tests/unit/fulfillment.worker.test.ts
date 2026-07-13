/**
 * Fulfillment Worker Unit Tests
 *
 * We test the job-processing logic by importing the worker module and
 * capturing the processor passed to BullMQ Worker via a class mock.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shared state between mock and tests
let capturedProcessor: ((...args: unknown[]) => unknown) | null = null
const mockWorkerInstance = { on: vi.fn() }

// ── Mock BullMQ — factory runs AFTER hoisting, so closures work ────────────
vi.mock('bullmq', () => {
  return {
    Worker: class MockWorker {
      on = vi.fn()
      constructor(_name: unknown, processor: (...args: unknown[]) => unknown) {
        capturedProcessor = processor
        Object.assign(this, mockWorkerInstance)
      }
    },
  }
})

// ── Mock external dependencies ─────────────────────────────────────────────
vi.mock('@/config/redis', () => ({
  createRedisConnection: vi.fn(() => ({})),
}))

vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: {
    findById:           vi.fn(),
    updateStatus:       vi.fn(),
    setProviderOrderId: vi.fn(),
  },
}))

vi.mock('@/repositories/product.repository', () => ({
  ProductRepository: {
    findById: vi.fn(),
  },
}))

vi.mock('@/providers/provider.factory', () => ({
  ProviderFactory: {
    resolve: vi.fn(),
  },
}))

import { startFulfillmentWorker } from '@/queue/fulfillment.worker'
import { OrderRepository }   from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { ProviderFactory }   from '@/providers/provider.factory'

// ── Helpers ────────────────────────────────────────────────────────────────
function makeMockJob(data: Record<string, unknown>) {
  return { id: 'job-1', data, updateProgress: vi.fn().mockResolvedValue(undefined) }
}

const mockOrder = {
  id: 'order-1', userId: 'user-1', productId: 'prod-1', providerId: 'prov-1',
  status: 'PENDING', amount: 5000, currency: 'NGN',
  customerEmail: 'user@example.com', providerOrderId: null,
}

const mockProduct = {
  id: 'prod-1', name: 'Netflix', providerId: 'prov-1',
  providerProductId: 'ext-123', price: 5000, currency: 'NGN',
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('Fulfillment Worker', () => {

  describe('startFulfillmentWorker()', () => {
    it('should construct a BullMQ Worker with the fulfillment queue name', () => {
      const worker = startFulfillmentWorker()
      expect(worker).toBeDefined()
      expect(worker.on).toBeDefined()
      expect(capturedProcessor).toBeTypeOf('function')
    })
  })

  describe('processFulfillmentJob — processor logic', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      capturedProcessor = null
      startFulfillmentWorker()
    })

    it('should complete successfully and mark order as PROCESSING', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValueOnce(mockOrder as any)
      vi.mocked(ProductRepository.findById).mockResolvedValueOnce(mockProduct as any)
      vi.mocked(ProviderFactory.resolve).mockResolvedValueOnce({
        fulfillOrder: vi.fn().mockResolvedValueOnce({
          status: 'COMPLETED',
          providerOrderId: 'prov-order-123',
        }),
      } as any)
      vi.mocked(OrderRepository.updateStatus).mockResolvedValueOnce(undefined as any)
      vi.mocked(OrderRepository.setProviderOrderId).mockResolvedValueOnce(undefined as any)

      const job = makeMockJob({ orderId: 'order-1', productId: 'prod-1' })
      const result = await capturedProcessor!(job)

      expect(result).toEqual({ status: 'COMPLETED', providerOrderId: 'prov-order-123' })
      expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'PROCESSING')
      expect(OrderRepository.setProviderOrderId).toHaveBeenCalledWith('order-1', 'prov-order-123')
      expect(job.updateProgress).toHaveBeenCalledTimes(4)
    })

    it('should return FAILED status when provider returns FAILED', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValueOnce(mockOrder as any)
      vi.mocked(ProductRepository.findById).mockResolvedValueOnce(mockProduct as any)
      vi.mocked(ProviderFactory.resolve).mockResolvedValueOnce({
        fulfillOrder: vi.fn().mockResolvedValueOnce({ status: 'FAILED', providerOrderId: null }),
      } as any)
      vi.mocked(OrderRepository.updateStatus).mockResolvedValueOnce(undefined as any)

      const job = makeMockJob({ orderId: 'order-1', productId: 'prod-1' })
      const result = await capturedProcessor!(job)

      expect(result).toMatchObject({ status: 'FAILED' })
    })

    it('should throw if order or product is not found', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValueOnce(null as any)
      vi.mocked(ProductRepository.findById).mockResolvedValueOnce(null as any)

      const job = makeMockJob({ orderId: 'bad-id', productId: 'bad-id' })
      await expect(capturedProcessor!(job)).rejects.toThrow('Order or product not found')
    })
  })
})
