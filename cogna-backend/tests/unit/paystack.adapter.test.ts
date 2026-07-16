import { beforeEach, describe, expect, it, vi } from 'vitest'

const sdk = vi.hoisted(() => ({ initialize: vi.fn(), verify: vi.fn() }))
vi.mock('@paystack/paystack-sdk', () => ({
  default: class MockPaystack {
    transaction = { initialize: sdk.initialize, verify: sdk.verify }
  },
}))

import { PaystackAdapter } from '@/payments/PaystackAdapter'

const adapter = new PaystackAdapter('sk_test_fake_secret_key')

beforeEach(() => vi.clearAllMocks())

describe('PaystackAdapter', () => {
  describe('initializePayment', () => {
    it('uses the official SDK and returns checkout references', async () => {
      sdk.initialize.mockResolvedValue({ status: true, data: { authorization_url: 'https://checkout.paystack.com/abc123', access_code: 'abc123', reference: 'cogna_ref_001' } })

      const result = await adapter.initializePayment({ amount: 99.99, currency: 'NGN', email: 'customer@test.com', reference: 'cogna_ref_001', orderId: 'order-uuid-1', callbackUrl: 'https://cogna.store/verify' })

      expect(sdk.initialize).toHaveBeenCalledWith({
        email: 'customer@test.com', amount: 9999, currency: 'NGN', reference: 'cogna_ref_001',
        callback_url: 'https://cogna.store/verify', metadata: JSON.stringify({ orderId: 'order-uuid-1' }),
      })
      expect(result).toEqual({ authorizationUrl: 'https://checkout.paystack.com/abc123', reference: 'cogna_ref_001', gatewayReference: 'abc123' })
    })

    it('rejects unsuccessful SDK responses', async () => {
      sdk.initialize.mockResolvedValue({ status: false, message: 'Invalid key' })
      await expect(adapter.initializePayment({ amount: 50, currency: 'NGN', email: 'x@x.com', reference: 'ref', orderId: 'o-1' })).rejects.toThrow('Paystack initialization failed: Invalid key')
    })
  })

  describe('verifyPayment', () => {
    it('normalizes successful verification amounts from minor units', async () => {
      sdk.verify.mockResolvedValue({ status: true, data: { status: 'success', amount: 9999, currency: 'NGN', reference: 'cogna_ref_001', paid_at: '2026-01-01T12:00:00.000Z', metadata: { orderId: 'order-1' } } })

      const result = await adapter.verifyPayment('cogna_ref_001')

      expect(sdk.verify).toHaveBeenCalledWith({ reference: 'cogna_ref_001' })
      expect(result).toMatchObject({ status: 'success', amount: 99.99, currency: 'NGN', gatewayReference: 'cogna_ref_001', metadata: { orderId: 'order-1' } })
      expect(result.paidAt).toBeInstanceOf(Date)
    })

    it.each([['abandoned', 'failed'], ['failed', 'failed'], ['pending', 'pending']] as const)('maps %s to %s', async (gatewayStatus, expectedStatus) => {
      sdk.verify.mockResolvedValue({ status: true, data: { status: gatewayStatus, amount: 5000, currency: 'NGN', reference: 'ref', paid_at: null, metadata: {} } })
      await expect(adapter.verifyPayment('ref')).resolves.toMatchObject({ status: expectedStatus, paidAt: null })
    })

    it('rejects malformed successful responses', async () => {
      sdk.verify.mockResolvedValue({ status: true, data: { status: 'success', currency: 'NGN', reference: 'ref' } })
      await expect(adapter.verifyPayment('ref')).rejects.toThrow('Paystack response is missing amount')
    })
  })

  describe('validateWebhook', () => {
    it('accepts only a matching HMAC-SHA512 signature', () => {
      const crypto = require('crypto') as typeof import('crypto')
      const payload = JSON.stringify({ event: 'charge.success' })
      const signature = crypto.createHmac('sha512', 'sk_test_fake_secret_key').update(payload).digest('hex')
      expect(adapter.validateWebhook(payload, signature)).toBe(true)
      expect(adapter.validateWebhook(payload, 'wrong-signature')).toBe(false)
    })
  })
})
