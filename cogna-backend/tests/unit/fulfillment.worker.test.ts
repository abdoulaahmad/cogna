import { describe, it, expect, vi, beforeEach } from 'vitest'

type CapturedProcessor = (job: unknown) => Promise<unknown>
let capturedProcessor: CapturedProcessor | null = null
const mockWorkerInstance = { on: vi.fn() }

vi.mock('bullmq', () => ({
  Worker: class MockWorker {
    on = vi.fn()
    constructor(_name: unknown, processor: CapturedProcessor) {
      capturedProcessor = processor
      Object.assign(this, mockWorkerInstance)
    }
  },
}))
vi.mock('@/config/redis', () => ({ createRedisConnection: vi.fn(() => ({})) }))
vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: {
    findById: vi.fn(), updateStatus: vi.fn(), setProviderOrderId: vi.fn(), setProviderResponse: vi.fn(),
  },
}))
vi.mock('@/repositories/product.repository', () => ({ ProductRepository: { findById: vi.fn() } }))
vi.mock('@/providers/provider.factory', () => ({ getProvider: vi.fn() }))

import { startFulfillmentWorker } from '@/queue/fulfillment.worker'
import { OrderRepository } from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { getProvider } from '@/providers/provider.factory'

function makeMockJob(data: Record<string, unknown>) {
  return { id: 'job-1', data, updateProgress: vi.fn().mockResolvedValue(undefined) }
}

const mockOrder = {
  id: 'order-1', userId: 'user-1', productId: 'prod-1', providerId: 'prov-1', status: 'PENDING',
  amount: 5000, currency: 'NGN', customerEmail: 'user@example.com', providerOrderId: null,
}
const mockProduct = {
  id: 'prod-1', name: 'Netflix', providerId: 'prov-1', providerProductId: 'ext-123', price: 5000, currency: 'NGN',
}

describe('Fulfillment Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedProcessor = null
    startFulfillmentWorker()
  })

  it('resolves the provider by ID and records a completed fulfillment', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce(mockOrder as never)
    vi.mocked(ProductRepository.findById).mockResolvedValueOnce(mockProduct as never)
    vi.mocked(getProvider).mockResolvedValueOnce({
      fulfillOrder: vi.fn().mockResolvedValueOnce({ status: 'COMPLETED', providerOrderId: 'prov-order-123' }),
    } as never)

    const job = makeMockJob({ orderId: 'order-1', productId: 'prod-1' })
    const result = await capturedProcessor!(job)

    expect(result).toEqual({ status: 'COMPLETED', providerOrderId: 'prov-order-123' })
    expect(getProvider).toHaveBeenCalledWith('prov-1')
    expect(OrderRepository.setProviderOrderId).toHaveBeenCalledWith('order-1', 'prov-order-123')
    expect(OrderRepository.setProviderResponse).toHaveBeenCalledWith('order-1', expect.objectContaining({ status: 'COMPLETED' }))
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'COMPLETED')
  })

  it('records a provider failure as a failed order', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce(mockOrder as never)
    vi.mocked(ProductRepository.findById).mockResolvedValueOnce(mockProduct as never)
    vi.mocked(getProvider).mockResolvedValueOnce({
      fulfillOrder: vi.fn().mockResolvedValueOnce({ status: 'FAILED', providerOrderId: null }),
    } as never)

    const result = await capturedProcessor!(makeMockJob({ orderId: 'order-1', productId: 'prod-1' }))

    expect(result).toMatchObject({ status: 'FAILED' })
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'FAILED')
  })

  it('throws when the order or product does not exist', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce(null)
    vi.mocked(ProductRepository.findById).mockResolvedValueOnce(null)

    await expect(capturedProcessor!(makeMockJob({ orderId: 'bad-id', productId: 'bad-id' }))).rejects.toThrow('Order or product not found')
  })
})