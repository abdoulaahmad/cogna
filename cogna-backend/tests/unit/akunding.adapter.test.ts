import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AkudingAdapter } from '@/providers/akunding.adapter'

const CONFIG = {
  apiKey:  'test-akunding-key',
  baseUrl: 'https://api.akunding.com',
}

// Shared mock — reassigned in each test
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AkudingAdapter', () => {

  const adapter = new AkudingAdapter(CONFIG)

  // ─── fulfillOrder ──────────────────────────────────────────────────────────
  describe('fulfillOrder', () => {
    it('should fulfill an order and return PROCESSING status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok:   true,
        json: async () => ({
          success: true,
          data:    { orderId: 'akunding-order-1', status: 'processing' },
        }),
      })

      const result = await adapter.fulfillOrder({
        orderId:           'cogna-order-1',
        providerProductId: 'prod-123',
        customerEmail:     'customer@test.com',
        amount:            5000,
        currency:          'NGN',
      })

      expect(result.providerOrderId).toBe('akunding-order-1')
      expect(result.status).toBe('PROCESSING')
    })

    it('should return FAILED status when provider responds with success: false', async () => {
      fetchMock.mockResolvedValueOnce({
        ok:   true,
        json: async () => ({
          success: false,
          message: 'Insufficient stock',
          data:    { orderId: 'akunding-order-err', status: 'failed' },
        }),
      })

      const result = await adapter.fulfillOrder({
        orderId:           'cogna-order-2',
        providerProductId: 'prod-456',
        customerEmail:     'customer@test.com',
        amount:            5000,
        currency:          'NGN',
      })

      expect(result.status).toBe('FAILED')
      expect(result.message).toBe('Insufficient stock')
    })

    it('should throw when HTTP response is not OK', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })

      await expect(
        adapter.fulfillOrder({
          orderId:           'cogna-order-3',
          providerProductId: 'prod-789',
          customerEmail:     'customer@test.com',
          amount:            5000,
          currency:          'NGN',
        })
      ).rejects.toThrow('Akunding fulfillOrder failed')
    })
  })

  // ─── checkOrderStatus ──────────────────────────────────────────────────────
  describe('checkOrderStatus', () => {
    it('should return COMPLETED when provider reports success', async () => {
      fetchMock.mockResolvedValueOnce({
        ok:   true,
        json: async () => ({
          success: true,
          data:    { orderId: 'akunding-order-1', status: 'completed' },
        }),
      })

      const result = await adapter.checkOrderStatus('akunding-order-1')

      expect(result.status).toBe('COMPLETED')
      expect(result.providerOrderId).toBe('akunding-order-1')
    })

    it('should return PROCESSING when provider reports pending', async () => {
      fetchMock.mockResolvedValueOnce({
        ok:   true,
        json: async () => ({
          success: true,
          data:    { orderId: 'akunding-order-2', status: 'processing' },
        }),
      })

      const result = await adapter.checkOrderStatus('akunding-order-2')

      expect(result.status).toBe('PROCESSING')
    })

    it('should throw when HTTP response is not OK', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 })

      await expect(
        adapter.checkOrderStatus('bad-order-id')
      ).rejects.toThrow('Akunding checkOrderStatus failed')
    })
  })
})
