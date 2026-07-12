import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderService } from '@/services/order.service'
import { OrderRepository } from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { NotFoundError, ForbiddenError } from '@/utils/errors'
import { buildOrder, buildProduct } from '../fixtures/factories'

vi.mock('@/repositories/order.repository')
vi.mock('@/repositories/product.repository')

const mockProduct = buildProduct({ active: true })
const mockOrder   = buildOrder({ userId: 'user-1', productId: mockProduct.id })

beforeEach(() => { vi.clearAllMocks() })

describe('OrderService', () => {

  // ── createOrder ───────────────────────────────────────────────────────
  describe('createOrder', () => {
    it('should create order with correct product price and providerId', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)
      vi.mocked(OrderRepository.create).mockResolvedValue(mockOrder)

      const result = await OrderService.createOrder('user-1', {
        productId: mockProduct.id, customerEmail: 'user@test.com',
      })

      expect(OrderRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId:     'user-1',
        productId:  mockProduct.id,
        providerId: mockProduct.providerId,
        amount:     Number(mockProduct.price),
      }))
      expect(result.id).toBe(mockOrder.id)
    })

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValue(null)

      await expect(
        OrderService.createOrder('user-1', { productId: 'bad-id', customerEmail: 'x@x.com' })
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when product is inactive', async () => {
      vi.mocked(ProductRepository.findById).mockResolvedValue({ ...mockProduct, active: false })

      await expect(
        OrderService.createOrder('user-1', { productId: mockProduct.id, customerEmail: 'x@x.com' })
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ── getOrder ──────────────────────────────────────────────────────────
  describe('getOrder', () => {
    it('should return order when user is the owner', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)

      const result = await OrderService.getOrder(mockOrder.id, 'user-1')

      expect(result.id).toBe(mockOrder.id)
    })

    it('should throw ForbiddenError when user is not the owner', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)

      await expect(
        OrderService.getOrder(mockOrder.id, 'different-user')
      ).rejects.toThrow(ForbiddenError)
    })

    it('should allow admin to view any order', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)

      const result = await OrderService.getOrder(mockOrder.id, 'admin-id', true)

      expect(result.id).toBe(mockOrder.id)
    })

    it('should throw NotFoundError when order does not exist', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(null)

      await expect(
        OrderService.getOrder('nonexistent', 'user-1')
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ── listOrders ────────────────────────────────────────────────────────
  describe('listOrders', () => {
    it('should return paginated orders for a user', async () => {
      vi.mocked(OrderRepository.findByUserId).mockResolvedValue({ items: [mockOrder], total: 1 })

      const result = await OrderService.listOrders('user-1')

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should pass page and limit to repository', async () => {
      vi.mocked(OrderRepository.findByUserId).mockResolvedValue({ items: [], total: 0 })

      await OrderService.listOrders('user-1', 2, 10)

      expect(OrderRepository.findByUserId).toHaveBeenCalledWith('user-1', 2, 10)
    })
  })

  // ── updateOrderStatus ─────────────────────────────────────────────────
  describe('updateOrderStatus', () => {
    it('should update status when order exists', async () => {
      const updated = { ...mockOrder, status: 'COMPLETED' as const }
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(OrderRepository.updateStatus).mockResolvedValue(updated)

      const result = await OrderService.updateOrderStatus(mockOrder.id, 'COMPLETED')

      expect(result.status).toBe('COMPLETED')
    })

    it('should throw NotFoundError when order does not exist', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(null)

      await expect(
        OrderService.updateOrderStatus('bad-id', 'COMPLETED')
      ).rejects.toThrow(NotFoundError)
    })
  })
})
