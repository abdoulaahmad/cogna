import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaystackAdapter } from '@/payments/PaystackAdapter'
import axios from 'axios'

vi.mock('axios')

const adapter = new PaystackAdapter('sk_test_fake_secret_key')

beforeEach(() => { vi.clearAllMocks() })

describe('PaystackAdapter', () => {

  describe('initializePayment', () => {
    it('should return authorizationUrl and references on success', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/abc123',
            access_code:       'abc123',
            reference:         'cogna_ref_001',
          },
        },
      })

      const result = await adapter.initializePayment({
        amount:    9999,
        currency:  'NGN',
        email:     'customer@test.com',
        reference: 'cogna_ref_001',
        orderId:   'order-uuid-1',
      })

      expect(result.authorizationUrl).toBe('https://checkout.paystack.com/abc123')
      expect(result.reference).toBe('cogna_ref_001')
      expect(result.gatewayReference).toBe('abc123')
    })

    it('should call Paystack API with correct payload', async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { data: { authorization_url: 'url', access_code: 'code', reference: 'ref' } },
      })

      await adapter.initializePayment({
        amount: 5000, currency: 'NGN', email: 'x@x.com', reference: 'ref', orderId: 'o-1',
      })

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/transaction/initialize'),
        expect.objectContaining({ amount: 5000, email: 'x@x.com', reference: 'ref' }),
        expect.any(Object)
      )
    })
  })

  describe('verifyPayment', () => {
    it('should return success status when Paystack reports success', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          data: {
            status:    'success',
            amount:    9999,
            currency:  'NGN',
            reference: 'cogna_ref_001',
            paid_at:   '2026-01-01T12:00:00.000Z',
            metadata:  {},
          },
        },
      })

      const result = await adapter.verifyPayment('cogna_ref_001')

      expect(result.status).toBe('success')
      expect(result.amount).toBe(9999)
      expect(result.paidAt).toBeInstanceOf(Date)
    })

    it('should return failed status when Paystack reports abandoned', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          data: { status: 'abandoned', amount: 0, currency: 'NGN', reference: 'ref', paid_at: null, metadata: {} },
        },
      })

      const result = await adapter.verifyPayment('ref')

      expect(result.status).toBe('failed')
      expect(result.paidAt).toBeNull()
    })
  })

  describe('validateWebhook', () => {
    it('should return true when HMAC signature matches payload', () => {
      const crypto = require('crypto')
      const payload   = JSON.stringify({ event: 'charge.success' })
      const signature = crypto.createHmac('sha512', 'sk_test_fake_secret_key').update(payload).digest('hex')

      expect(adapter.validateWebhook(payload, signature)).toBe(true)
    })

    it('should return false when signature does not match', () => {
      expect(adapter.validateWebhook('payload', 'wrong-signature')).toBe(false)
    })
  })
})
