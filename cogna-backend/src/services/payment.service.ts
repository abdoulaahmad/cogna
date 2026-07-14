import { randomUUID } from 'crypto'
import { PaymentRepository } from '@/repositories/payment.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { getPaymentGateway } from '@/payments/GatewayFactory'
import { fulfillmentQueue } from '@/queue/fulfillment.queue'
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'
import type { PaymentVerifyResult } from '@/types/payment-verify-result.types'

function generateReference(): string {
  return `cogna_${Date.now()}_${randomUUID().slice(0, 6)}`
}

function toPaymentStatus(status: PaymentVerifyResult['status']): 'PENDING' | 'PAID' | 'FAILED' {
  if (status === 'success') return 'PAID'
  if (status === 'failed') return 'FAILED'
  return 'PENDING'
}

function assertGatewayAmountMatchesPayment(
  payment: { amount: unknown; currency: string },
  result: PaymentVerifyResult
): void {
  if (Number(payment.amount) !== result.amount || payment.currency !== result.currency) {
    throw new ConflictError('Gateway payment amount or currency does not match the order')
  }
}

export const PaymentService = {
  async initializePayment(
    orderId: string,
    userId: string,
    customerEmail: string,
    callbackUrl?: string
  ) {
    const order = await OrderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order')
    if (order.userId !== userId) throw new ForbiddenError('Access denied')
    if (order.status !== 'PENDING') throw new ConflictError('Payment can only be initiated for a pending order')

    const product = await ProductRepository.findById(order.productId)
    if (!product) throw new NotFoundError('Product')

    const existing = await PaymentRepository.findByOrderId(orderId)
    if (existing) throw new ConflictError('A payment has already been initiated for this order')

    const gateway = getPaymentGateway(product.paymentGateway)
    const reference = generateReference()
    const initResult = await gateway.initializePayment({
      amount: Number(order.amount),
      currency: order.currency,
      email: customerEmail,
      reference,
      orderId,
      callbackUrl,
    })

    await PaymentRepository.create({
      orderId,
      userId,
      gateway: product.paymentGateway,
      reference: initResult.reference,
      amount: Number(order.amount),
      currency: order.currency,
    })

    return {
      authorizationUrl: initResult.authorizationUrl,
      reference: initResult.reference,
    }
  },

  async verifyPayment(reference: string, userId?: string) {
    const payment = await PaymentRepository.findByReference(reference)
    if (!payment) throw new NotFoundError('Payment')
    if (userId && payment.userId !== userId) throw new ForbiddenError('Access denied')

    // Terminal payments are immutable. Returning the stored state makes customer
    // callbacks and repeated gateway webhooks safe to retry.
    if (payment.status === 'PAID' || payment.status === 'FAILED' || payment.status === 'REFUNDED') {
      return payment
    }

    const order = await OrderRepository.findById(payment.orderId)
    if (!order) throw new NotFoundError('Order')

    const gateway = getPaymentGateway(payment.gateway)
    const verifyResult = await gateway.verifyPayment(reference)
    const newStatus = toPaymentStatus(verifyResult.status)

    if (newStatus === 'PAID') {
      assertGatewayAmountMatchesPayment(payment, verifyResult)
    }

    const updatedPayment = await PaymentRepository.updateStatus(payment.id, newStatus, {
      gatewayReference: verifyResult.gatewayReference,
      paidAt: verifyResult.paidAt ?? undefined,
      metadata: verifyResult.metadata,
    })

    if (newStatus === 'PAID') {
      await fulfillmentQueue.add(
        'fulfill-order',
        { orderId: order.id, productId: order.productId, userId: order.userId },
        { jobId: `fulfill:${order.id}` }
      )
    }

    return updatedPayment
  },

  async handleWebhook(
    gatewayType: PaymentGatewayType,
    rawBody: string,
    signature: string
  ): Promise<boolean> {
    const gateway = getPaymentGateway(gatewayType)
    if (!gateway.validateWebhook(rawBody, signature)) return false

    let reference: string
    try {
      const parsed = JSON.parse(rawBody) as { data?: { reference?: string } }
      reference = parsed.data?.reference ?? ''
    } catch {
      return false
    }

    if (!reference) return false

    const payment = await PaymentRepository.findByReference(reference)
    if (!payment || payment.gateway !== gatewayType) return false

    await this.verifyPayment(reference)
    return true
  },
}