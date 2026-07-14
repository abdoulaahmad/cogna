import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'

vi.mock('@/services/payment.service', () => ({
  PaymentService: {
    initializePayment: vi.fn(),
    verifyPayment:     vi.fn(),
    handleWebhook:     vi.fn(),
  },
}))

import { PaymentService } from '@/services/payment.service'

let app: FastifyInstance
let authToken: string

const ORDER_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  // Payment route reads email from JWT payload
  authToken = app.jwt.sign({ sub: 'user-1', role: 'USER', email: 'user@example.com' })
})

afterAll(async () => {
  await app.close()
})

describe('Payments API Integration', () => {

  describe('POST /api/v1/payments/initialize', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app.server)
        .post('/api/v1/payments/initialize')
        .send({ orderId: 'order-1', customerEmail: 'user@example.com' })

      expect(response.status).toBe(401)
    })

    it('should initialize a payment and return authorizationUrl', async () => {
      vi.mocked(PaymentService.initializePayment).mockResolvedValueOnce({
        authorizationUrl: 'https://checkout.paystack.com/abc123',
        reference:        'cogna_ref_1',
      })

      const response = await request(app.server)
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orderId: ORDER_UUID })

      expect(response.status).toBe(201)   // route returns 201
      expect(response.body.data.authorizationUrl).toBe('https://checkout.paystack.com/abc123')
    })

    it('should return 400 if orderId is not a valid UUID', async () => {
      const response = await request(app.server)
        .post('/api/v1/payments/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orderId: 'not-a-uuid' })   // invalid UUID → Zod 400

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/v1/payments/verify/:reference', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app.server)
        .get('/api/v1/payments/verify/some-ref')

      expect(response.status).toBe(401)
    })

    it('should verify a payment', async () => {
      vi.mocked(PaymentService.verifyPayment).mockResolvedValueOnce({
        id:              'payment-1',
        orderId:         'order-1',
        userId:          'user-1',
        gateway:         'PAYSTACK',
        reference:       'cogna_ref_1',
        gatewayReference: 'PSK_ref_1',
        amount:          5000,
        currency:        'NGN',
        status:          'PAID',
        paidAt:          new Date('2026-01-01'),
        metadata:        {},
        createdAt:       new Date('2026-01-01'),
        updatedAt:       new Date('2026-01-01'),
      })

      const response = await request(app.server)
        .get('/api/v1/payments/verify/cogna_ref_1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.status).toBe('PAID')
      expect(vi.mocked(PaymentService.verifyPayment)).toHaveBeenCalledWith('cogna_ref_1', 'user-1')
    })
  })

  describe('POST /api/v1/payments/webhook/:gateway', () => {
    it('should return 200 for a valid webhook signature', async () => {
      vi.mocked(PaymentService.handleWebhook).mockResolvedValueOnce(true)

      // Send as JSON (not pre-stringified)
      const response = await request(app.server)
        .post('/api/v1/payments/webhook/paystack')
        .set('x-paystack-signature', 'valid-sig')
        .set('Content-Type', 'application/json')
        .send({ event: 'charge.success', data: { reference: 'ref_1' } })

      expect(response.status).toBe(200)
      expect(vi.mocked(PaymentService.handleWebhook)).toHaveBeenCalledWith(
        'PAYSTACK', expect.stringContaining('charge.success'), 'valid-sig'
      )
    })

    it('should return 400 for invalid webhook signature', async () => {
      vi.mocked(PaymentService.handleWebhook).mockResolvedValueOnce(false)

      const response = await request(app.server)
        .post('/api/v1/payments/webhook/paystack')
        .set('x-paystack-signature', 'bad-sig')
        .set('Content-Type', 'application/json')
        .send({ event: 'charge.success', data: { reference: 'ref_1' } })

      expect(response.status).toBe(400)
    })
  })
})
