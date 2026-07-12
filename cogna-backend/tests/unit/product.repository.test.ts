import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductRepository } from '@/repositories/product.repository'
import { buildProduct } from '../fixtures/factories'

vi.mock('@/config/database', () => ({
  default: {
    product: {
      findMany:  vi.fn(),
      findUnique: vi.fn(),
      count:     vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import prisma from '@/config/database'

const mockProduct = buildProduct()

beforeEach(() => { vi.clearAllMocks() })

describe('ProductRepository', () => {

  describe('findAll', () => {
    it('should return paginated products and total count', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[mockProduct], 1])

      const result = await ProductRepository.findAll({ page: 1, limit: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })
})
