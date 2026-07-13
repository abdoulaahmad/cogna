import { prisma } from '@/config/database'
import type { Payment } from '@prisma/client'
import type { PaymentCreateInput } from '@/types/payment.types'

export const PaymentRepository = {

  /**
   * Persist a new payment record with PENDING status.
   */
  async create(input: PaymentCreateInput): Promise<Payment> {
    return prisma.payment.create({
      data: {
        orderId:   input.orderId,
        userId:    input.userId,
        gateway:   input.gateway,
        reference: input.reference,
        amount:    input.amount,
        currency:  input.currency,
      },
    })
  },

  /**
   * Look up a payment by its internal Cogna reference.
   */
  async findByReference(reference: string): Promise<Payment | null> {
    return prisma.payment.findFirst({ where: { reference } })
  },

  /**
   * Look up the payment associated with an order.
   */
  async findByOrderId(orderId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({ where: { orderId } })
  },

  /**
   * Update a payment's status and optional gateway fields after verification.
   */
  async updateStatus(
    paymentId: string,
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
    extras: { gatewayReference?: string; paidAt?: Date; metadata?: Record<string, unknown> } = {}
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { id: paymentId },
      data:  {
        status,
        ...(extras.gatewayReference !== undefined && { gatewayReference: extras.gatewayReference }),
        ...(extras.paidAt            !== undefined && { paidAt:            extras.paidAt }),
        ...(extras.metadata          !== undefined && { metadata:          extras.metadata }),
      },
    })
  },
}
