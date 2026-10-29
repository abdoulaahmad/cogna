import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentRepository } from '@/repositories/payment.repository'
import { buildPayment } from '../fixtures/factories'

// Mock Prisma client
vi.mock('@/config/database', () => ({
  prisma: {
    $transaction: vi.fn(),
    payment: {
      create:    vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  },
}))

import { prisma } from '@/config/database'

const mockPayment = buildPayment()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
    return (callback as unknown as (tx: typeof prisma) => Promise<unknown>)(prisma)
  })
})

describe('PaymentRepository', () => {

  // ─── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return a payment record', async () => {
      vi.mocked(prisma.payment.create).mockResolvedValue(mockPayment)

      const result = await PaymentRepository.create({
        orderId:   mockPayment.orderId,
        userId:    mockPayment.userId,
        gateway:   'PAYSTACK',
        reference: mockPayment.reference,
        amount:    9999,
        currency:  'NGN',
      })

      expect(prisma.payment.create).toHaveBeenCalledOnce()
      expect(result.reference).toBe(mockPayment.reference)
    })
  })

  // ─── findByReference ───────────────────────────────────────────────────────
  describe('findByReference', () => {
    it('should return payment when reference exists', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment)

      const result = await PaymentRepository.findByReference(mockPayment.reference)

      expect(prisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { reference: mockPayment.reference } })
      )
      expect(result?.id).toBe(mockPayment.id)
    })

    it('should return null when reference does not exist', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const result = await PaymentRepository.findByReference('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ─── findByOrderId ─────────────────────────────────────────────────────────
  describe('findByOrderId', () => {
    it('should return payment for an order', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(mockPayment)

      const result = await PaymentRepository.findByOrderId(mockPayment.orderId)

      expect(result?.orderId).toBe(mockPayment.orderId)
    })

    it('should return null when no payment exists for order', async () => {
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null)

      const result = await PaymentRepository.findByOrderId('no-order')

      expect(result).toBeNull()
    })
  })

  // ─── updateStatus ──────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('should update payment status and gatewayReference', async () => {
      const updated = { ...mockPayment, status: 'PAID' as const, gatewayReference: 'GW_123' }
      vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 1 })
      vi.mocked(prisma.payment.findUniqueOrThrow).mockResolvedValue(updated)

      const result = await PaymentRepository.updateStatus(
        mockPayment.id,
        'PAID',
        { gatewayReference: 'GW_123', paidAt: new Date() }
      )

      expect(prisma.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockPayment.id, status: 'PENDING' },
      }))
      expect(result.status).toBe('PAID')
    })

    it('returns the committed paid state when a stale pending response loses the race', async () => {
      const paid = { ...mockPayment, status: 'PAID' as const }
      vi.mocked(prisma.payment.updateMany).mockResolvedValue({ count: 0 })
      vi.mocked(prisma.payment.findUniqueOrThrow).mockResolvedValue(paid)
      expect(await PaymentRepository.updateStatus(mockPayment.id, 'PENDING')).toEqual(paid)
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockPayment.id, status: 'PENDING' },
        data: { status: 'PENDING' },
      }))
    })
  })
})
