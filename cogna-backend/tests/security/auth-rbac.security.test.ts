import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'
import prisma from '@/config/database'
import { generateTestJwt } from './helpers/security.helper'

// Mock services/repositories
vi.mock('@/repositories/product.repository', () => ({
  ProductRepository: {
    findAllAdmin: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findAll: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

vi.mock('@/repositories/order.repository', () => ({
  OrderRepository: {
    findAllAdmin: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

vi.mock('@/repositories/provider.repository', () => ({
  ProviderRepository: {
    findAll: vi.fn().mockResolvedValue([]),
  },
}))

let app: FastifyInstance
let customerToken: string
let adminToken: string

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  customerToken = generateTestJwt(app, { sub: 'cust-1', role: 'CUSTOMER' })
  adminToken = generateTestJwt(app, { sub: 'admin-1', role: 'ADMIN', adminRole: 'SUPER_ADMIN' })
})

afterAll(async () => {
  await app.close()
})

describe('Security Suite: Authentication & Role-Based Access Control (RBAC)', () => {

  describe('Administrative Boundary Protection', () => {
    it('rejects unauthenticated requests to administrative endpoints with 401', async () => {
      const res = await request(app.server).get('/api/v1/admin/products')
      expect(res.status).toBe(401)
    })

    it('rejects authenticated CUSTOMER role from accessing admin products with 403 Forbidden', async () => {
      const res = await request(app.server)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Admin access required')
    })

    it('rejects authenticated CUSTOMER role from accessing admin provider secrets with 403 Forbidden', async () => {
      const res = await request(app.server)
        .get('/api/v1/admin/providers')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })

    it('allows verified ADMIN role to access administrative endpoints', async () => {
      const res = await request(app.server)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('rejects low-tier SUPPORT admin from creating products or mutating provider secrets with 403 Forbidden', async () => {
      const supportToken = generateTestJwt(app, { sub: 'support-1', role: 'ADMIN', adminRole: 'SUPPORT' })

      const resProduct = await request(app.server)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${supportToken}`)
        .send({
          name: 'Unauthorized Product',
          slug: 'unauthorized-product',
          description: 'Desc',
          category: 'STREAMING',
          price: 1000,
          currency: 'NGN',
          billingCycle: 'MONTHLY',
          paymentGateway: 'PAYSTACK',
        })

      expect(resProduct.status).toBe(403)
      expect(resProduct.body.message).toContain('Insufficient admin privileges')

      const resProvider = await request(app.server)
        .post('/api/v1/admin/providers')
        .set('Authorization', `Bearer ${supportToken}`)
        .send({
          name: 'Malicious Provider',
          baseUrl: 'https://evil.com',
          apiKey: 'secret_key',
        })

      expect(resProvider.status).toBe(403)
      expect(resProvider.body.message).toContain('Insufficient admin privileges')
    })
  })

  describe('JWT Integrity & Token Boundary', () => {
    it('rejects forged JWT with invalid signature', async () => {
      const forgedToken = `${customerToken.substring(0, customerToken.lastIndexOf('.'))}.invalidSignatureHash`
      const res = await request(app.server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`)

      expect(res.status).toBe(401)
    })

    it('rejects malformed Authorization headers', async () => {
      const res = await request(app.server)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidHeaderStructure')

      expect(res.status).toBe(401)
    })
  })

  describe('API Key Authentication & Scope Verification', () => {
    it('rejects requests with missing X-API-Key when API Key auth is invoked', async () => {
      const res = await request(app.server)
        .post('/api/v1/orders')
        .send({ productId: 'prod-1', customerEmail: 'test@example.com' })

      expect(res.status).toBe(401)
    })

    it('rejects invalid or non-existent API keys', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce(null)

      const res = await request(app.server)
        .get('/api/v1/orders')
        .set('X-API-Key', 'invalid_cogna_api_key_123456789')

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('Invalid or inactive API key')
    })

    it('rejects inactive or suspended API keys', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        id: 'key-1',
        userId: 'user-1',
        apiKey: 'some-hash',
        status: 'REVOKED',
        environment: 'SANDBOX',
        scopes: '["read:orders"]',
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const res = await request(app.server)
        .get('/api/v1/orders')
        .set('X-API-Key', 'cogna_live_revoked_key')

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('Invalid or inactive API key')
    })

    it('rejects expired API keys', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60)
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        id: 'key-expired',
        userId: 'user-1',
        apiKey: 'hash',
        status: 'ACTIVE',
        environment: 'SANDBOX',
        scopes: '["read:orders"]',
        expiresAt: pastDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const res = await request(app.server)
        .get('/api/v1/orders')
        .set('X-API-Key', 'cogna_expired_key')

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('API key has expired')
    })

    it('rejects API key lacking write:orders scope from creating an order with 403 Forbidden', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValueOnce({
        id: 'key-readonly',
        userId: 'user-1',
        apiKey: 'hash',
        status: 'ACTIVE',
        environment: 'SANDBOX',
        scopes: '["read:orders"]',
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never)

      const res = await request(app.server)
        .post('/api/v1/orders')
        .set('X-API-Key', 'cogna_readonly_key')
        .send({ productId: 'prod-1' })

      expect(res.status).toBe(403)
      expect(res.body.message).toContain('API key lacks required scope: write:orders')
    })
  })
})
