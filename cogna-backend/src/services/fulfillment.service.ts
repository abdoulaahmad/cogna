import type { Order } from '@prisma/client'
import { getErrorMessage } from '@/utils/error-message';
import { getProvider } from '@/providers/provider.factory'
import { OrderRepository } from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { ConflictError, NotFoundError } from '@/utils/errors'
import prisma from '@/config/database'
import { decryptCredential } from '@/utils/credential-crypto'

export const FulfillmentService = {
  /**
   * Refreshes the status of an active processing order from the provider.
   */
  async refreshStatus(orderId: string): Promise<Order> {
    const order = await OrderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order')
    if (order.status !== 'PROCESSING') throw new ConflictError('Only processing orders can be refreshed')
    if (!order.providerOrderId) throw new ConflictError('Order does not have a provider reference yet')

    const product = await ProductRepository.findById(order.productId)
    if (!product) throw new NotFoundError('Product')

    const provider = await getProvider(product.providerId)
    const result = await provider.checkOrderStatus(order.providerOrderId)

    await OrderRepository.setProviderResponse(order.id, result)
    return OrderRepository.updateStatus(order.id, result.status)
  },

  /**
   * Manually retries fulfillment of a failed/pending order.
   */
  async retryFulfillment(orderId: string): Promise<Order> {
    const order = await OrderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order')
    if (order.status === 'COMPLETED') {
      throw new ConflictError('Cannot retry an already completed order')
    }

    const product = await ProductRepository.findById(order.productId)
    if (!product) throw new NotFoundError('Product')

    const provider = await getProvider(product.providerId)
    const result = await provider.fulfillOrder({
      orderId: order.id,
      providerProductId: product.providerProductId,
      customerEmail: order.customerEmail,
      amount: Number(order.amount),
      currency: order.currency,
    })

    if (result.providerOrderId) {
      await OrderRepository.setProviderOrderId(order.id, result.providerOrderId)
    }
    await OrderRepository.setProviderResponse(order.id, result)
    return OrderRepository.updateStatus(order.id, result.status)
  },

  /**
   * Manually cancels an order.
   */
  async cancelOrder(orderId: string): Promise<Order> {
    const order = await OrderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order')
    if (order.status === 'COMPLETED') {
      throw new ConflictError('Cannot cancel a completed order')
    }
    return OrderRepository.updateStatus(order.id, 'CANCELLED')
  },

  /**
   * Periodically polls all active orders in PROCESSING state.
   */
  async pollProcessingOrders(): Promise<void> {
    const orders = await prisma.order.findMany({
      where: {
        status: 'PROCESSING',
        providerOrderId: { not: null },
      },
    })

    for (const order of orders) {
      try {
        await this.refreshStatus(order.id)
      } catch (err: unknown) {
        console.error(`[poll-processing] Failed to refresh order ${order.id}:`, getErrorMessage(err))
      }
    }
  },

  /**
   * Diagnostics: Connection probe for provider health.
   */
  async checkProviderHealth(providerId: string) {
    const providerRecord = await prisma.provider.findUnique({ where: { id: providerId } })
    if (!providerRecord) throw new NotFoundError('Provider')

    if (providerRecord.status === 'INACTIVE') {
      return {
        status: 'INACTIVE',
        healthy: false,
        latencyMs: 0,
        lastCheck: new Date(),
        message: 'Provider is configured as INACTIVE',
      }
    }

    const apiKeyDecrypted = (() => {
      try { return decryptCredential(providerRecord.apiKey) }
      catch { return providerRecord.apiKey }
    })()

    const start = Date.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000) // 4s timeout

      const res = await fetch(`${providerRecord.baseUrl.replace(/\/$/, '')}/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKeyDecrypted}`,
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const latencyMs = Date.now() - start
      // If we reach the server (even with 401 Unauthorized or 404 Not Found), connection is alive.
      // 5xx errors mean server failure (unhealthy).
      const isHealthy = res.status < 500

      return {
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        healthy: isHealthy,
        statusCode: res.status,
        latencyMs,
        lastCheck: new Date(),
        message: isHealthy ? 'Provider connection is alive' : `Provider returned server error: ${res.status}`,
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - start
      return {
        status: 'UNHEALTHY',
        healthy: false,
        latencyMs,
        lastCheck: new Date(),
        message: `Health probe connection failed: ${getErrorMessage(err)}`,
      }
    }
  },
}
