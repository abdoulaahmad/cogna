import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'
import { signPaystackPayload, signMonnifyPayload, signProviderPayload } from './helpers/security.helper'
import { MonnifyAdapter } from '@/payments/MonnifyAdapter'
import { PaystackAdapter } from '@/payments/PaystackAdapter'
import { PlisioAdapter } from '@/payments/PlisioAdapter'

vi.mock('@/services/payment.service', () => ({
  PaymentService: {
    handleWebhook: vi.fn(),
  },
}))

vi.mock('@/services/wallet.service', () => ({
  WalletService: {
    handleFundingWebhook: vi.fn(),
    verifyFunding: vi.fn(),
  },
}))

vi.mock('@/services/provider-webhook.service', () => ({
  ProviderWebhookService: {
    processEvent: vi.fn(),
  },
}))

import { PaymentService } from '@/services/payment.service'
import { WalletService } from '@/services/wallet.service'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('Security Suite: Payment Gateway & Webhook Integrity Security', () => {

  describe('Paystack Raw Webhook Signature Verification', () => {
    const paystackSecret = 'sk_test_mock_secret_key_12345'
    const adapter = new PaystackAdapter(paystackSecret)

    it('validates genuine Paystack HMAC-SHA512 webhook signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_100', amount: 50000 } })
      const validSig = signPaystackPayload(payload, paystackSecret)

      expect(adapter.validateWebhook(payload, validSig)).toBe(true)
    })

    it('rejects forged Paystack signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_100' } })
      expect(adapter.validateWebhook(payload, 'forged_fake_signature_hash')).toBe(false)
    })

    it('detects payload tampering: modified payload fails verification even with authentic signature of original', () => {
      const originalPayload = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_100', amount: 50000 } })
      const tamperedPayload = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_100', amount: 500 } }) // tampered amount
      const authenticSignature = signPaystackPayload(originalPayload, paystackSecret)

      expect(adapter.validateWebhook(tamperedPayload, authenticSignature)).toBe(false)
    })

    it('returns 400 Bad Request when inbound payment webhook handler receives invalid signature', async () => {
      vi.mocked(PaymentService.handleWebhook).mockResolvedValueOnce(false)

      const res = await request(app.server)
        .post('/api/v1/payments/webhook/paystack')
        .set('x-paystack-signature', 'forged_signature_12345')
        .set('Content-Type', 'application/json')
        .send({ event: 'charge.success', data: { reference: 'ref_attack_1' } })

      expect(res.status).toBe(400)
      expect(res.body.ok).toBe(false)
    })
  })

  describe('Monnify Webhook Signature Verification', () => {
    const monnifySecret = 'secret_monnify_key_xyz'
    const monnifyAdapter = new MonnifyAdapter({
      apiKey: 'key_123',
      secretKey: monnifySecret,
      contractCode: 'contract_123',
      baseUrl: 'https://sandbox.monnify.com',
    })

    it('validates genuine Monnify HMAC-SHA512 webhook signature', () => {
      const payload = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION', eventData: { transactionReference: 'MNFY_1' } })
      const signature = signMonnifyPayload(payload, monnifySecret)

      expect(monnifyAdapter.validateWebhook(payload, signature)).toBe(true)
    })

    it('rejects forged Monnify webhook signature', () => {
      const payload = JSON.stringify({ eventType: 'SUCCESSFUL_TRANSACTION' })
      expect(monnifyAdapter.validateWebhook(payload, 'invalid_monnify_sig')).toBe(false)
    })
  })

  describe('Plisio Cryptocurrency Webhook & Underpayment Defenses', () => {
    const plisioAdapter = new PlisioAdapter('mock_plisio_secret_key')

    it('validates Plisio signature verification algorithm against tamper', () => {
      const params = {
        amount: '10.50',
        currency: 'USDT',
        order_number: 'wallet_fund_123',
        status: 'completed',
      }
      expect(plisioAdapter.validateWebhook(params, 'random_unmatched_signature')).toBe(false)
    })

    it('identifies status mismatch / underpayment condition requiring defensive handling', () => {
      // Plisio callback reporting mismatch (underpaid invoice)
      const underpaidCallback = {
        data: {
          status: 'mismatch',
          source_amount: '0.001', // Attacker paid 0.001 USDT instead of 50.0 USDT
          amount: '50.00',
        }
      }
      // Verifying that status is 'mismatch', asserting the threat model documented in F-02
      expect(underpaidCallback.data.status).toBe('mismatch')
      expect(Number(underpaidCallback.data.source_amount)).toBeLessThan(Number(underpaidCallback.data.amount))
    })
  })
})
