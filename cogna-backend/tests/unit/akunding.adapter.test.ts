import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AkudingAdapter } from '@/providers/akunding.adapter'

const CONFIG = { apiKey: 'test-akunding-key', baseUrl: 'https://akunding.shop/api/v1' }
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock) })
afterEach(() => { vi.unstubAllGlobals() })

describe('AkudingAdapter', () => {
  const adapter = new AkudingAdapter(CONFIG)
  const input = {
    orderId: 'cogna-order-1', providerProductId: '27', customerEmail: 'customer@test.com',
    amount: 5000, currency: 'NGN', quantity: 1, idempotencyKey: 'cogna-order-cogna-order-1',
  }

  it('creates an order with Akunding documented payload and idempotency header', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 11014, status: 'draft' }) })

    const result = await adapter.fulfillOrder(input)

    expect(fetchMock).toHaveBeenCalledWith('https://akunding.shop/api/v1/orders', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-akunding-key',
        'X-Idempotency-Key': 'cogna-order-cogna-order-1',
      }),
      body: JSON.stringify({ product_id: 27, quantity: 1 }),
    }))
    expect(result).toMatchObject({ providerOrderId: '11014', status: 'PROCESSING' })
  })

  it.each([
    ['delivered', 'COMPLETED'],
    ['cancelled', 'CANCELLED'],
    ['expired', 'FAILED'],
  ] as const)('maps %s provider orders to %s', async (providerStatus, cognaStatus) => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 11014, status: providerStatus }) })
    await expect(adapter.checkOrderStatus('11014')).resolves.toMatchObject({ providerOrderId: '11014', status: cognaStatus })
  })

  it('preserves delivered items in the order response for owner-only delivery handling', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 11014, status: 'delivered', items: ['delivery-item'] }) })
    const result = await adapter.checkOrderStatus('11014')
    expect(result.rawResponse).toMatchObject({ items: ['delivery-item'] })
  })

  it('rejects invalid provider product IDs without making a request', async () => {
    await expect(adapter.fulfillOrder({ ...input, providerProductId: 'not-a-number' })).rejects.toThrow('positive integer')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws on non-successful provider responses', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 422 })
    await expect(adapter.fulfillOrder(input)).rejects.toThrow('Akunding fulfillOrder failed: HTTP 422')
  })
})