import { OrderRepository } from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { NotFoundError, ForbiddenError } from '@/utils/errors'
import type { CreateOrderInput } from '@/validators/order.validator'

export const OrderService = {

  /**
   * Create a new order for a product.
   * Validates the product exists, resolves price and provider, then persists.
   */
  async createOrder(userId: string, input: CreateOrderInput) {
    const product = await ProductRepository.findById(input.productId)
    if (!product) throw new NotFoundError('Product')
    if (!product.active) throw new NotFoundError('Product')

    const order = await OrderRepository.create({
      userId,
      productId:     product.id,
      providerId:    product.providerId,
      amount:        Number(product.price),
      currency:      product.currency,
      customerEmail: input.customerEmail,
    })

    return order
  },

  /**
   * Get a single order by ID.
   * Customers can only view their own orders.
   */
  async getOrder(orderId: string, userId: string, isAdmin = false) {
    const order = await OrderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order')
    if (!isAdmin && order.userId !== userId) throw new ForbiddenError('Access denied')
    return order
  },

  /**
   * List all orders for the authenticated user with pagination.
   */
  async listOrders(userId: string, page = 1, limit = 20) {
    return OrderRepository.findByUserId(userId, page, limit)
  },

  /**
   * Update an order's status.
   * Used internally by payment and provider webhooks.
   */
  async updateOrderStatus(orderId: string, status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED') {
    const order = await OrderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order')
    return OrderRepository.updateStatus(orderId, status)
  },
}
