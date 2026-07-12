import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrderRepository } from '@/repositories/order.repository'
import { buildOrder } from '../fixtures/factories'

vi.mock('@/config/database', () => ({
  default: {
    order: {
      create:    vi.fn(),
      findUnique: vi.fn(),
      findMany:  vi.fn(),
      count:     vi.fn(),
      update:    vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import prisma from '@/config/database'
const mockOrder = buildOrder()
beforeEach(() => { vi.clearAllMocks() })

describe('OrderRepository', () => {

  describe('create', () => {
    it('should create and return a new order', async () => {
      vi.mocked(prisma.order.create).mockResolvedValue(mockOrder)

      const result = await OrderRepository.create({
        userId: mockOrder.userId, productId: mockOrder.productId,
        providerId: mockOrder.providerId, amount: 9999,
        currency: 'NGN', customerEmail: 'test@example.com',
      })

      expect(result.id).toBe(mockOrder.id)
      expect(prisma.order.create).toHaveBeenCalledOnce()
    })
  })

  describe('findById', () => {
    it('should return order when found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder)
      const result = await OrderRepository.findById(mockOrder.id)
      expect(result?.id).toBe(mockOrder.id)
    })

    it('should return null when order does not exist', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null)
      const result = await OrderRepository.findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should return paginated orders and total count', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[mockOrder], 1])

      const result = await OrderRepository.findByUserId(mockOrder.userId)

      expect(result.items).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should return empty array when user has no orders', async () => {
      vi.mocked(prisma.$transaction).mockResolvedValue([[], 0])

      const result = await OrderRepository.findByUserId('user-with-no-orders')

      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updated = { ...mockOrder, status: 'PROCESSING' as const }
      vi.mocked(prisma.order.update).mockResolvedValue(updated)

      const result = await OrderRepository.updateStatus(mockOrder.id, 'PROCESSING')

      expect(result.status).toBe('PROCESSING')
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id }, data: { status: 'PROCESSING' },
      })
    })
  })
})
