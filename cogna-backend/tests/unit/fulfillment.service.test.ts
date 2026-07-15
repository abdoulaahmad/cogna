import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: {
    findById: vi.fn(),
    setProviderResponse: vi.fn(),
    updateStatus: vi.fn(),
    setProviderOrderId: vi.fn(),
  },
}))
vi.mock('@/repositories/product.repository', () => ({ ProductRepository: { findById: vi.fn() } }))
vi.mock('@/providers/provider.factory', () => ({ getProvider: vi.fn() }))
vi.mock('@/config/database', () => ({
  default: {
    provider: {
      findUnique: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
  },
}))

import { FulfillmentService } from '@/services/fulfillment.service'
import { OrderRepository } from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { getProvider } from '@/providers/provider.factory'
import prisma from '@/config/database'

describe('FulfillmentService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('refreshes a processing order from its provider', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce({ id: 'order-1', status: 'PROCESSING', providerOrderId: 'provider-1', productId: 'product-1' } as never)
    vi.mocked(ProductRepository.findById).mockResolvedValueOnce({ providerId: 'provider-1' } as never)
    vi.mocked(getProvider).mockResolvedValueOnce({ checkOrderStatus: vi.fn().mockResolvedValue({ status: 'COMPLETED' }) } as never)
    vi.mocked(OrderRepository.updateStatus).mockResolvedValueOnce({ id: 'order-1', status: 'COMPLETED' } as never)

    const order = await FulfillmentService.refreshStatus('order-1')

    expect(order.status).toBe('COMPLETED')
    expect(OrderRepository.setProviderResponse).toHaveBeenCalledWith('order-1', { status: 'COMPLETED' })
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'COMPLETED')
  })

  it('does not query a provider for a non-processing order', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce({ id: 'order-1', status: 'FAILED' } as never)

    await expect(FulfillmentService.refreshStatus('order-1')).rejects.toThrow('Only processing orders')
    expect(getProvider).not.toHaveBeenCalled()
  })

  it('retries fulfillment for a failed or pending order', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce({ id: 'order-1', status: 'FAILED', productId: 'product-1', customerEmail: 'test@cogna.store', amount: 50, currency: 'NGN' } as never)
    vi.mocked(ProductRepository.findById).mockResolvedValueOnce({ providerId: 'provider-1', providerProductId: 'product-1' } as never)
    vi.mocked(getProvider).mockResolvedValueOnce({ fulfillOrder: vi.fn().mockResolvedValue({ providerOrderId: 'provider-order-2', status: 'PROCESSING' }) } as never)
    vi.mocked(OrderRepository.updateStatus).mockResolvedValueOnce({ id: 'order-1', status: 'PROCESSING' } as never)

    const order = await FulfillmentService.retryFulfillment('order-1')

    expect(order.status).toBe('PROCESSING')
    expect(OrderRepository.setProviderOrderId).toHaveBeenCalledWith('order-1', 'provider-order-2')
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'PROCESSING')
  })

  it('fails to retry an already completed order', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce({ id: 'order-1', status: 'COMPLETED' } as never)

    await expect(FulfillmentService.retryFulfillment('order-1')).rejects.toThrow('Cannot retry an already completed order')
  })

  it('cancels an order', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce({ id: 'order-1', status: 'PROCESSING' } as never)
    vi.mocked(OrderRepository.updateStatus).mockResolvedValueOnce({ id: 'order-1', status: 'CANCELLED' } as never)

    const order = await FulfillmentService.cancelOrder('order-1')

    expect(order.status).toBe('CANCELLED')
    expect(OrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'CANCELLED')
  })

  it('fails to cancel a completed order', async () => {
    vi.mocked(OrderRepository.findById).mockResolvedValueOnce({ id: 'order-1', status: 'COMPLETED' } as never)

    await expect(FulfillmentService.cancelOrder('order-1')).rejects.toThrow('Cannot cancel a completed order')
  })

  it('reports INACTIVE truthful health status for inactive providers', async () => {
    vi.mocked(prisma.provider.findUnique).mockResolvedValueOnce({ id: 'provider-1', name: 'Akunding', status: 'INACTIVE', baseUrl: 'http://test.com', apiKey: 'key' } as never)

    const health = await FulfillmentService.checkProviderHealth('provider-1')

    expect(health.status).toBe('INACTIVE')
    expect(health.healthy).toBe(false)
  })
})