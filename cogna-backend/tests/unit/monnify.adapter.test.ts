import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MonnifyAdapter } from '@/payments/MonnifyAdapter'
import axios from 'axios'

vi.mock('axios')

const adapter = new MonnifyAdapter({
  apiKey: 'test_api_key',
  secretKey: 'test_secret_key',
  contractCode: 'test_contract_code',
  baseUrl: 'https://sandbox.monnify.com',
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MonnifyAdapter', () => {
  describe('getAccessToken', () => {
    it('should fetch and cache a token', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          responseBody: {
            accessToken: 'mocked_token_1',
            expiresIn: 3600,
          },
        },
      })

      // We call initializePayment to trigger getAccessToken internally
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          responseBody: {
            checkoutUrl: 'https://checkout.monnify.com/123',
            transactionReference: 'MNFY_123',
            paymentReference: 'ref_123',
          },
        },
      })

      const result = await adapter.initializePayment({
        amount: 50000, // 500 NGN
        currency: 'NGN',
        email: 'test@customer.com',
        reference: 'ref_123',
        orderId: 'order_123',
      })

      expect(result.authorizationUrl).toBe('https://checkout.monnify.com/123')
      expect(axios.post).toHaveBeenCalledTimes(2)
    })
  })

  describe('verifyPayment', () => {
    it('should return normalized success verify result when status is PAID', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          responseBody: {
            accessToken: 'mocked_token',
            expiresIn: 3600,
          },
        },
      })

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          responseBody: {
            paymentStatus: 'PAID',
            amountPaid: 500.00,
            currencyCode: 'NGN',
            transactionReference: 'MNFY_123',
            completedOn: '2026-07-12T22:00:00.000Z',
          },
        },
      })

      const result = await adapter.verifyPayment('ref_123')

      expect(result.status).toBe('success')
      expect(result.amount).toBe(50000) // converted to kobo
      expect(result.paidAt).toBeInstanceOf(Date)
    })

    it('should return failed status when status is FAILED', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          responseBody: {
            accessToken: 'mocked_token',
            expiresIn: 3600,
          },
        },
      })

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          responseBody: {
            paymentStatus: 'FAILED',
            amountPaid: 0,
            currencyCode: 'NGN',
            transactionReference: 'MNFY_123',
            completedOn: null,
          },
        },
      })

      const result = await adapter.verifyPayment('ref_123')

      expect(result.status).toBe('failed')
      expect(result.paidAt).toBeNull()
    })
  })

  describe('validateWebhook', () => {
    it('should return true when signature matches payload', () => {
      const crypto = require('crypto')
      const payload = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' })
      const signature = crypto.createHmac('sha512', 'test_secret_key').update(payload).digest('hex')

      expect(adapter.validateWebhook(payload, signature)).toBe(true)
    })

    it('should return false when signature does not match', () => {
      expect(adapter.validateWebhook('payload', 'wrong_signature')).toBe(false)
    })
  })
})
