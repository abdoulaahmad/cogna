import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductService } from '@/services/product.service'
import { ProductRepository } from '@/repositories/product.repository'
import { NotFoundError } from '@/utils/errors'
import { buildProduct } from '../fixtures/factories'

vi.mock('@/repositories/product.repository')

const mockProduct = buildProduct()

beforeEach(() => { vi.clearAllMocks() })

describe('ProductService', () => {

  // ── listProducts ──────────────────────────────────────────────────────
  describe('listProducts', () => {

    it('should return paginated products with total count', async () => {
      vi.mocked(ProductRepository.findAll).mockResolvedValue({
        items: [mockProduct], total: 1,
      })

      const result = await ProductService.listProducts({ page: 1, limit: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
    })

    it('should pass active:true filter by default', async () => {
      vi.mocked(ProductRepository.findAll).mockResolvedValue({ items: [], total: 0 })

      await ProductService.listProducts({ page: 1, limit: 20 })

      expect(ProductRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ active: true })
      )
    })

    it('should pass category filter when provided', async () => {
      vi.mocked(ProductRepository.findAll).mockResolvedValue({ items: [], total: 0 })

      await ProductService.listProducts({ page: 1, limit: 20, category: 'ai-chat' })

      expect(ProductRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ categorySlug: 'ai-chat' })
      )
    })

    it('should pass search term when provided', async () => {
      vi.mocked(ProductRepository.findAll).mockResolvedValue({ items: [], total: 0 })

      await ProductService.listProducts({ page: 1, limit: 20, search: 'chatgpt' })

      expect(ProductRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'chatgpt' })
      )
    })
  })

  // ── getProductById ────────────────────────────────────────────────────
  describe('getProductById', () => {

    it('should return the product when found', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)

      const result = await ProductService.getProductById(mockProduct.id)

      expect(result.id).toBe(mockProduct.id)
    })

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValue(null)

      await expect(
        ProductService.getProductById('nonexistent-id')
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ── getProductBySlug ──────────────────────────────────────────────────
  describe('getProductBySlug', () => {

    it('should return the product when slug matches', async () => {
      vi.mocked(ProductRepository.findBySlug).mockResolvedValue(mockProduct)

      const result = await ProductService.getProductBySlug(mockProduct.slug)

      expect(result.slug).toBe(mockProduct.slug)
    })

    it('should throw NotFoundError when slug does not exist', async () => {
      vi.mocked(ProductRepository.findBySlug).mockResolvedValue(null)

      await expect(
        ProductService.getProductBySlug('invalid-slug')
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ── searchProducts ────────────────────────────────────────────────────
  describe('searchProducts', () => {

    it('should return empty array when query is less than 2 characters', async () => {
      const result = await ProductService.searchProducts('a')
      expect(result).toEqual([])
      expect(ProductRepository.search).not.toHaveBeenCalled()
    })

    it('should return empty array when query is empty string', async () => {
      const result = await ProductService.searchProducts('')
      expect(result).toEqual([])
    })

    it('should call ProductRepository.search with trimmed query', async () => {
      vi.mocked(ProductRepository.search).mockResolvedValue([mockProduct])

      await ProductService.searchProducts('  chatgpt  ')

      expect(ProductRepository.search).toHaveBeenCalledWith('chatgpt')
    })
  })
})
