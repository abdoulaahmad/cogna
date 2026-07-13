import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'

// ── Mock repositories used directly by admin.routes.ts ─────────────────────
vi.mock('@/repositories/product.repository', () => ({
  ProductRepository: {
    findAll:    vi.fn(),
    findById:   vi.fn(),
    create:     vi.fn(),
    update:     vi.fn(),
    softDelete: vi.fn(),
  },
}))

vi.mock('@/repositories/category.repository', () => ({
  CategoryRepository: {
    findAll:  vi.fn(),
    findById: vi.fn(),
    create:   vi.fn(),
    update:   vi.fn(),
    delete:   vi.fn(),
  },
}))

vi.mock('@/repositories/provider.repository', () => ({
  ProviderRepository: {
    findAll:  vi.fn(),
    findById: vi.fn(),
    create:   vi.fn(),
    update:   vi.fn(),
    delete:   vi.fn(),
  },
}))

import { ProductRepository }  from '@/repositories/product.repository'
import { CategoryRepository } from '@/repositories/category.repository'
import { ProviderRepository } from '@/repositories/provider.repository'

// ── App lifecycle ──────────────────────────────────────────────────────────
let app: FastifyInstance
let adminToken: string
let userToken: string

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  adminToken = app.jwt.sign({ sub: 'admin-1', role: 'ADMIN' })
  userToken  = app.jwt.sign({ sub: 'user-1',  role: 'USER' })
})

afterAll(async () => {
  await app.close()
})

// ── Shared fixtures ────────────────────────────────────────────────────────
const mockProduct = {
  id: 'prod-1', name: 'Netflix', slug: 'netflix', description: 'Streaming',
  category: 'STREAMING', price: 5000, currency: 'NGN', billingCycle: 'MONTHLY',
  isActive: true, paymentGateway: 'PAYSTACK', providerId: 'prov-1',
  providerProductId: 'ext-1', metadata: {}, providerApiOverride: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

const mockCategory = {
  id: 'cat-1', name: 'Streaming', slug: 'streaming', description: null,
  iconUrl: null, isActive: true, createdAt: new Date().toISOString(),
}

const mockProvider = {
  id: 'prov-1', name: 'Akunding', slug: 'akunding', baseUrl: 'https://api.akunding.com',
  isActive: true, apiKey: 'secret-key', apiSecret: 'secret-val',
  createdAt: new Date().toISOString(),
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('Admin API Integration', () => {

  describe('RBAC guard', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app.server).get('/api/v1/admin/products')
      expect(res.status).toBe(401)
    })

    it('should return 403 for non-admin users', async () => {
      // NOTE: no mock needed — the requireAdmin hook fires before the handler
      const res = await request(app.server)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
      expect(res.status).toBe(403)
    })
  })

  // ── Products ────────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/products', () => {
    it('should return product list for admin', async () => {
      vi.mocked(ProductRepository.findAll).mockResolvedValueOnce({ items: [mockProduct], total: 1 })

      const res = await request(app.server)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.items).toHaveLength(1)
    })
  })

  describe('POST /api/v1/admin/products', () => {
    it('should create a new product', async () => {
      vi.mocked(ProductRepository.create).mockResolvedValueOnce(mockProduct)

      const CAT_UUID  = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
      const PROV_UUID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'

      const res = await request(app.server)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId:        CAT_UUID,
          providerId:        PROV_UUID,
          providerProductId: 'ext-1',
          name:              'Netflix',
          slug:              'netflix',
          description:       'Streaming service',
          price:             5000,
          currency:          'NGN',
          billingCycle:      'MONTHLY',
          paymentGateway:    'PAYSTACK',
        })

      expect(res.status).toBe(201)
      expect(res.body.data.name).toBe('Netflix')
    })

    it('should return 400 for invalid body', async () => {
      const res = await request(app.server)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Missing required fields' })

      expect(res.status).toBe(400)
    })
  })

  describe('PATCH /api/v1/admin/products/:id', () => {
    it('should update an existing product', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValueOnce(mockProduct)
      vi.mocked(ProductRepository.update).mockResolvedValueOnce({ ...mockProduct, name: 'Netflix Updated' })

      const res = await request(app.server)
        .patch('/api/v1/admin/products/prod-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Netflix Updated' })

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Netflix Updated')
    })

    it('should return 404 if product not found', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValueOnce(null)
      const res = await request(app.server)
        .patch('/api/v1/admin/products/bad-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/admin/products/:id', () => {
    it('should soft-delete a product', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValueOnce(mockProduct)
      vi.mocked(ProductRepository.softDelete).mockResolvedValueOnce({ ...mockProduct, isActive: false })

      const res = await request(app.server)
        .delete('/api/v1/admin/products/prod-1')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.isActive).toBe(false)
    })
  })

  // ── Categories ──────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/categories', () => {
    it('should return all categories', async () => {
      vi.mocked(CategoryRepository.findAll).mockResolvedValueOnce([mockCategory])

      const res = await request(app.server)
        .get('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
    })
  })

  describe('POST /api/v1/admin/categories', () => {
    it('should create a category', async () => {
      vi.mocked(CategoryRepository.create).mockResolvedValueOnce(mockCategory)

      const res = await request(app.server)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Streaming', slug: 'streaming' })

      expect(res.status).toBe(201)
      expect(res.body.data.name).toBe('Streaming')
    })
  })

  describe('PATCH /api/v1/admin/categories/:id', () => {
    it('should update a category', async () => {
      vi.mocked(CategoryRepository.findById).mockResolvedValueOnce(mockCategory)
      vi.mocked(CategoryRepository.update).mockResolvedValueOnce({ ...mockCategory, name: 'Updated' })

      const res = await request(app.server)
        .patch('/api/v1/admin/categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })

      expect(res.status).toBe(200)
    })

    it('should return 404 if category not found', async () => {
      vi.mocked(CategoryRepository.findById).mockResolvedValueOnce(null)
      const res = await request(app.server)
        .patch('/api/v1/admin/categories/bad-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/admin/categories/:id', () => {
    it('should delete a category', async () => {
      vi.mocked(CategoryRepository.findById).mockResolvedValueOnce(mockCategory)
      vi.mocked(CategoryRepository.delete).mockResolvedValueOnce(undefined)

      const res = await request(app.server)
        .delete('/api/v1/admin/categories/cat-1')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
    })
  })

  // ── Providers ───────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/providers', () => {
    it('should return providers with apiKey/apiSecret stripped', async () => {
      vi.mocked(ProviderRepository.findAll).mockResolvedValueOnce([mockProvider])

      const res = await request(app.server)
        .get('/api/v1/admin/providers')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data[0].apiKey).toBeUndefined()
      expect(res.body.data[0].apiSecret).toBeUndefined()
      expect(res.body.data[0].name).toBe('Akunding')
    })
  })

  describe('POST /api/v1/admin/providers', () => {
    it('should create a provider (strips credentials from response)', async () => {
      vi.mocked(ProviderRepository.create).mockResolvedValueOnce(mockProvider)

      const res = await request(app.server)
        .post('/api/v1/admin/providers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Akunding', baseUrl: 'https://api.akunding.com', apiKey: 'secret-key' })

      expect(res.status).toBe(201)
      expect(res.body.data.apiKey).toBeUndefined()
    })
  })

  describe('PATCH /api/v1/admin/providers/:id', () => {
    it('should update a provider', async () => {
      vi.mocked(ProviderRepository.findById).mockResolvedValueOnce(mockProvider)
      vi.mocked(ProviderRepository.update).mockResolvedValueOnce({ ...mockProvider, name: 'Updated' })

      const res = await request(app.server)
        .patch('/api/v1/admin/providers/prov-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })

      expect(res.status).toBe(200)
    })

    it('should return 404 if provider not found', async () => {
      vi.mocked(ProviderRepository.findById).mockResolvedValueOnce(null)
      const res = await request(app.server)
        .patch('/api/v1/admin/providers/bad-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/admin/providers/:id', () => {
    it('should delete a provider', async () => {
      vi.mocked(ProviderRepository.findById).mockResolvedValueOnce(mockProvider)
      vi.mocked(ProviderRepository.delete).mockResolvedValueOnce(undefined)

      const res = await request(app.server)
        .delete('/api/v1/admin/providers/prov-1')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
    })
  })
})
