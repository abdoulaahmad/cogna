import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'

vi.mock('@/services/product.service', () => ({
  ProductService: {
    listProducts:         vi.fn(),
    getProductById:       vi.fn(),
    getProductBySlug:     vi.fn(),
    searchProducts:       vi.fn(),
    getProductsByCategory: vi.fn(),
  },
}))

import { ProductService } from '@/services/product.service'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

const mockProduct = {
  id:             'prod-1',
  name:           'Netflix Premium',
  slug:           'netflix-premium',
  description:    'Netflix 4K subscription',
  category:       'STREAMING',
  price:          5000,
  currency:       'NGN',
  billingCycle:   'MONTHLY',
  isActive:       true,
  paymentGateway: 'PAYSTACK',
  providerId:     'prov-1',
  providerProductId: 'ext-123',
  metadata:       {},
  createdAt:      new Date('2026-01-01').toISOString(),
  updatedAt:      new Date('2026-01-01').toISOString(),
}

describe('Products API Integration', () => {

  describe('GET /api/v1/products', () => {
    it('should return paginated list of products', async () => {
      vi.mocked(ProductService.listProducts).mockResolvedValueOnce({
        items: [mockProduct],
        total: 1,
        page:  1,
        limit: 20,
      })

      const response = await request(app.server).get('/api/v1/products')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.meta.total).toBe(1)
    })

    it('should pass page and limit query params to the service', async () => {
      vi.mocked(ProductService.listProducts).mockResolvedValueOnce({
        items: [], total: 0, page: 2, limit: 5,
      })

      const response = await request(app.server)
        .get('/api/v1/products?page=2&limit=5')

      expect(response.status).toBe(200)
      expect(vi.mocked(ProductService.listProducts)).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 5 })
      )
    })
  })

  describe('GET /api/v1/products/slug/:slug', () => {
    it('should return a single product by slug', async () => {
      vi.mocked(ProductService.getProductBySlug).mockResolvedValueOnce(mockProduct)

      const response = await request(app.server).get('/api/v1/products/slug/netflix-premium')

      expect(response.status).toBe(200)
      expect(response.body.data.slug).toBe('netflix-premium')
      expect(vi.mocked(ProductService.getProductBySlug)).toHaveBeenCalledWith('netflix-premium')
    })
  })
  describe('GET /api/v1/products/:id', () => {
    it('should return a single product by ID', async () => {
      vi.mocked(ProductService.getProductById).mockResolvedValueOnce(mockProduct)

      const response = await request(app.server).get('/api/v1/products/prod-1')

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe('prod-1')
      expect(response.body.data.name).toBe('Netflix Premium')
    })

    it('should return 404 for a non-existent product', async () => {
      const { NotFoundError } = await import('@/utils/errors')
      vi.mocked(ProductService.getProductById).mockRejectedValueOnce(
        new NotFoundError('Product')
      )

      const response = await request(app.server).get('/api/v1/products/bad-id')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/products/search', () => {
    it('should search products by query string', async () => {
      vi.mocked(ProductService.searchProducts).mockResolvedValueOnce([mockProduct])

      const response = await request(app.server)
        .get('/api/v1/products/search?q=netflix')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
    })
  })
})
