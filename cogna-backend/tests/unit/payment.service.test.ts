import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentService } from '@/services/payment.service'
import { PaymentRepository } from '@/repositories/payment.repository'
import { OrderRepository }   from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { NotFoundError, ConflictError, ForbiddenError } from '@/utils/errors'
import { buildOrder, buildPayment, buildProduct } from '../fixtures/factories'

vi.mock('@/repositories/payment.repository')
vi.mock('@/repositories/order.repository')
vi.mock('@/repositories/product.repository')
vi.mock('@/queue/fulfillment.queue', () => ({
  fulfillmentQueue: { add: vi.fn().mockResolvedValue({ id: 'job-1' }) },
}))
vi.mock('@/payments/GatewayFactory', () => ({
  getPaymentGateway: vi.fn(() => ({
    initializePayment: vi.fn().mockResolvedValue({
      authorizationUrl: 'https://checkout.paystack.com/abc',
      reference:        'cogna_ref_test',
      gatewayReference: 'PSK_ref_test',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status:           'success',
      amount:           9999,
      currency:         'NGN',
      paidAt:           new Date('2026-01-01'),
      gatewayReference: 'PSK_ref_test',
      metadata:         {},
    }),
    validateWebhook: vi.fn().mockReturnValue(true),
  })),
}))

const mockProduct = buildProduct({ paymentGateway: 'PAYSTACK' })
const mockOrder   = buildOrder({ userId: 'user-1', productId: mockProduct.id, status: 'PENDING' })
const mockPayment = buildPayment({ orderId: mockOrder.id, userId: 'user-1', status: 'PENDING' })

beforeEach(() => { vi.clearAllMocks() })

describe('PaymentService', () => {

  // ─── initializePayment ───────────────────────────────────────────────────
  describe('initializePayment', () => {
    it('should initialize payment and return authorizationUrl', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)
      vi.mocked(PaymentRepository.findByOrderId).mockResolvedValue(null)
      vi.mocked(PaymentRepository.create).mockResolvedValue(mockPayment)

      const result = await PaymentService.initializePayment(
        mockOrder.id,
        'user-1',
        'user@test.com'
      )

      expect(result.authorizationUrl).toBe('https://checkout.paystack.com/abc')
      expect(result.accessCode).toBe('PSK_ref_test')
      expect(PaymentRepository.create).toHaveBeenCalledOnce()
    })

    it('should throw NotFoundError when order does not exist', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(null)

      await expect(
        PaymentService.initializePayment('bad-order-id', 'user-1', 'user@test.com')
      ).rejects.toThrow(NotFoundError)
    })

    it('should reject initializing payment for another customer’s order', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue({ ...mockOrder, userId: 'another-user' })

      await expect(
        PaymentService.initializePayment(mockOrder.id, 'user-1', 'user@test.com')
      ).rejects.toThrow(ForbiddenError)
    })
    it('should throw ConflictError when payment already exists for the order', async () => {
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)
      vi.mocked(PaymentRepository.findByOrderId).mockResolvedValue(mockPayment)

      await expect(
        PaymentService.initializePayment(mockOrder.id, 'user-1', 'user@test.com')
      ).rejects.toThrow(ConflictError)
    })
  })

  // ─── verifyPayment ────────────────────────────────────────────────────────
  describe('verifyPayment', () => {
    it('should verify a payment and update status to PAID on success', async () => {
      const paidPayment = { ...mockPayment, status: 'PAID' as const }
      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(mockPayment)
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)
      vi.mocked(PaymentRepository.updateStatus).mockResolvedValue(paidPayment)

      const result = await PaymentService.verifyPayment(mockPayment.reference)

      expect(result.status).toBe('PAID')
      expect(PaymentRepository.updateStatus).toHaveBeenCalledWith(
        mockPayment.id,
        'PAID',
        expect.objectContaining({ gatewayReference: expect.any(String) })
      )
    })

    it('should reject verification by another customer', async () => {
      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(mockPayment)

      await expect(PaymentService.verifyPayment(mockPayment.reference, 'another-user')).rejects.toThrow(ForbiddenError)
      expect(OrderRepository.findById).not.toHaveBeenCalled()
    })

    it('should keep a pending gateway payment pending without fulfillment', async () => {
      const { getPaymentGateway } = await import('@/payments/GatewayFactory')
      vi.mocked(getPaymentGateway).mockImplementationOnce(() => ({
        verifyPayment: vi.fn().mockResolvedValue({
          status: 'pending', amount: 9999, currency: 'NGN', gatewayReference: 'PSK_ref_test', paidAt: null, metadata: {},
        }),
      } as never))
      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(mockPayment)
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(PaymentRepository.updateStatus).mockResolvedValue({ ...mockPayment, status: 'PENDING' as const })

      const result = await PaymentService.verifyPayment(mockPayment.reference, mockPayment.userId)

      expect(result.status).toBe('PENDING')
      expect(PaymentRepository.updateStatus).toHaveBeenCalledWith(mockPayment.id, 'PENDING', expect.any(Object))
      const { fulfillmentQueue } = await import('@/queue/fulfillment.queue')
      expect(fulfillmentQueue.add).not.toHaveBeenCalled()
    })
    it('should throw NotFoundError when reference does not exist', async () => {
      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(null)

      await expect(
        PaymentService.verifyPayment('nonexistent-ref')
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ─── handleWebhook ────────────────────────────────────────────────────────
  describe('handleWebhook', () => {
    it('should return true when webhook signature is valid', async () => {
      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(mockPayment)
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)
      vi.mocked(PaymentRepository.updateStatus).mockResolvedValue({ ...mockPayment, status: 'PAID' as const })

      const result = await PaymentService.handleWebhook(
        'PAYSTACK',
        JSON.stringify({ data: { reference: mockPayment.reference } }),
        'valid-sig'
      )

      expect(result).toBe(true)
    })
  })
})
