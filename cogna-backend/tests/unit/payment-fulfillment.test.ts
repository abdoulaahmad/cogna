import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fulfillmentQueue } from '@/queue/fulfillment.queue'
import { PaymentService }   from '@/services/payment.service'
import { PaymentRepository } from '@/repositories/payment.repository'
import { OrderRepository }   from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { NotFoundError }     from '@/utils/errors'
import { buildOrder, buildPayment, buildProduct } from '../fixtures/factories'

// Mock BullMQ queue
vi.mock('@/queue/fulfillment.queue', () => ({
  fulfillmentQueue: { add: vi.fn().mockResolvedValue({ id: 'job-1' }) },
}))

vi.mock('@/repositories/payment.repository')
vi.mock('@/repositories/order.repository')
vi.mock('@/repositories/product.repository')
vi.mock('@/payments/GatewayFactory', () => ({
  getPaymentGateway: vi.fn(() => ({
    initializePayment: vi.fn().mockResolvedValue({
      authorizationUrl: 'https://pay.test/abc',
      reference:        'cogna_ref_1',
      gatewayReference: 'PSK_ref_1',
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status:           'success',
      amount:           9999,
      currency:         'NGN',
      paidAt:           new Date('2026-01-01'),
      gatewayReference: 'PSK_ref_1',
      metadata:         {},
    }),
    validateWebhook: vi.fn().mockReturnValue(true),
  })),
}))

const mockProduct = buildProduct({ paymentGateway: 'PAYSTACK' })
const mockOrder   = buildOrder({ userId: 'user-1', productId: mockProduct.id, status: 'PENDING' })
const mockPayment = buildPayment({ orderId: mockOrder.id, userId: 'user-1', status: 'PENDING' })
const paidPayment = { ...mockPayment, status: 'PAID' as const }

beforeEach(() => { vi.clearAllMocks() })

describe('PaymentService + FulfillmentQueue integration', () => {

  describe('verifyPayment', () => {
    it('should enqueue a fulfillment job when payment is PAID', async () => {
      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(mockPayment)
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)
      vi.mocked(PaymentRepository.updateStatus).mockResolvedValue(paidPayment)

      await PaymentService.verifyPayment(mockPayment.reference)

      expect(fulfillmentQueue.add).toHaveBeenCalledOnce()
      expect(fulfillmentQueue.add).toHaveBeenCalledWith(
        'fulfill-order',
        {
          orderId:   mockOrder.id,
          productId: mockOrder.productId,
          userId:    mockOrder.userId,
        },
        { jobId: `fulfill:${mockOrder.id}` }
      )
    })

    it('should NOT enqueue a fulfillment job when payment is FAILED', async () => {
      const failedGateway = { verifyPayment: vi.fn().mockResolvedValue({
        status: 'failed', amount: 5000, paidAt: null, gatewayReference: '',
      }) }
      const { getPaymentGateway } = await import('@/payments/GatewayFactory')
      vi.mocked(getPaymentGateway).mockImplementationOnce(() => failedGateway as never)

      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(mockPayment)
      vi.mocked(OrderRepository.findById).mockResolvedValue(mockOrder)
      vi.mocked(ProductRepository.findById).mockResolvedValue(mockProduct)
      vi.mocked(PaymentRepository.updateStatus).mockResolvedValue({ ...mockPayment, status: 'FAILED' as const })

      await PaymentService.verifyPayment(mockPayment.reference)

      expect(fulfillmentQueue.add).not.toHaveBeenCalled()
    })

    it('should throw NotFoundError when payment reference does not exist', async () => {
      vi.mocked(PaymentRepository.findByReference).mockResolvedValue(null)

      await expect(PaymentService.verifyPayment('bad-ref')).rejects.toThrow(NotFoundError)
      expect(fulfillmentQueue.add).not.toHaveBeenCalled()
    })
  })
})
