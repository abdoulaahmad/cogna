import prisma from '@/config/database'
import type { Order } from '@prisma/client'

const orderDetailsInclude = { product: true, payment: true } as const

export const OrderRepository = {

  /** Create a new order record */
  async create(data: {
    userId: string
    productId: string
    providerId: string
    amount: number
    currency: string
    customerEmail: string
  }): Promise<Order> {
    return prisma.order.create({ data })
  },

  /** Find a single order by ID */
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({ where: { id }, include: orderDetailsInclude })
  },

  /** Find an order by provider reference */
  async findByProviderOrderId(providerId: string, providerOrderId: string): Promise<Order | null> {
    return prisma.order.findFirst({
      where:   { providerId, providerOrderId },
      include: orderDetailsInclude,
    })
  },

  /** Find all orders belonging to a user */
  async findByUserId(userId: string, page = 1, limit = 20): Promise<{ items: Order[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        include: orderDetailsInclude,
      }),
      prisma.order.count({ where: { userId } }),
    ])
    return { items, total }
  },

  /** Update order status */
  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    return prisma.order.update({ where: { id }, data: { status } })
  },

  /** Set the provider order ID once fulfillment is initiated */
  async setProviderOrderId(id: string, providerOrderId: string): Promise<Order> {
    return prisma.order.update({ where: { id }, data: { providerOrderId } })
  },

  /** Store the raw provider response on the order */
  async setProviderResponse(id: string, providerResponse: object): Promise<Order> {
    return prisma.order.update({ where: { id }, data: { providerResponse } })
  },
}
