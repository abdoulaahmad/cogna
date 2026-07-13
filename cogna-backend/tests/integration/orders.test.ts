import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'

vi.mock('@/services/order.service', () => ({
  OrderService: {
    createOrder: vi.fn(),
    listOrders:  vi.fn(),
    getOrder:    vi.fn(),
  },
}))

import { OrderService } from '@/services/order.service'

let app: FastifyInstance
let authToken: string

const PROD_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  authToken = app.jwt.sign({ sub: 'user-1', role: 'USER' })
})

afterAll(async () => {
  await app.close()
})

const mockOrder = {
  id:            'order-1',
  userId:        'user-1',
  productId:     'prod-1',
  providerId:    'prov-1',
  status:        'PENDING',
  amount:        5000,
  currency:      'NGN',
  customerEmail: 'user@example.com',
  providerOrderId: null,
  createdAt:     new Date('2026-01-01').toISOString(),
  updatedAt:     new Date('2026-01-01').toISOString(),
}

describe('Orders API Integration', () => {

  describe('POST /api/v1/orders', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app.server)
        .post('/api/v1/orders')
        .send({ productId: 'prod-1', customerEmail: 'user@example.com' })

      expect(response.status).toBe(401)
    })

    it('should create an order when authenticated', async () => {
      vi.mocked(OrderService.createOrder).mockResolvedValueOnce(mockOrder)

      const response = await request(app.server)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: PROD_UUID, customerEmail: 'user@example.com' })

      if (response.status !== 201) console.error('BODY:', JSON.stringify(response.body))
      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('order-1')
    })

    it('should return 400 if productId is missing', async () => {
      const response = await request(app.server)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ customerEmail: 'user@example.com' })  // productId missing → 400

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/v1/orders', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app.server).get('/api/v1/orders')
      expect(response.status).toBe(401)
    })

    it('should list orders for the authenticated user', async () => {
      vi.mocked(OrderService.listOrders).mockResolvedValueOnce({
        items: [mockOrder],
        total: 1,
      })

      const response = await request(app.server)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.meta.total).toBe(1)
    })
  })

  describe('GET /api/v1/orders/:id', () => {
    it('should return a specific order', async () => {
      vi.mocked(OrderService.getOrder).mockResolvedValueOnce(mockOrder)

      const response = await request(app.server)
        .get('/api/v1/orders/order-1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe('order-1')
    })

    it('should return 404 for a non-existent order', async () => {
      const { NotFoundError } = await import('@/utils/errors')
      vi.mocked(OrderService.getOrder).mockRejectedValueOnce(new NotFoundError('Order'))

      const response = await request(app.server)
        .get('/api/v1/orders/bad-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })
})
