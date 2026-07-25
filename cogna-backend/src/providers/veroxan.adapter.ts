import type { IProvider } from './provider.interface'
import type { FulfillOrderInput, FulfillOrderResult } from '@/types/provider.types'

interface VeroxanConfig {
  apiKey: string
  baseUrl: string
}

export type VeroxanOrderResponse = {
  status: string
  order_id: string
  data?: string
  amount?: number
  idempotent_replay?: boolean
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mapStatus(status: string): FulfillOrderResult['status'] {
  switch (status.toLowerCase()) {
    case 'delivered':
    case 'completed':
    case 'success':
      return 'COMPLETED'
    case 'cancelled':
    case 'canceled':
    case 'failed':
    case 'error':
      return 'FAILED'
    case 'pending':
    case 'processing':
    default:
      return 'PROCESSING'
  }
}

/**
 * Veroxan reseller provider adapter.
 * Uses query parameter ?action=order for POST
 */
export class VeroxanAdapter implements IProvider {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(config: VeroxanConfig) {
    this.apiKey = config.apiKey
    // Remove trailing slash if present
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
  }

  async fulfillOrder(input: FulfillOrderInput): Promise<FulfillOrderResult> {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) {
      throw new Error('Veroxan quantity must be a positive integer')
    }

    const url = new URL(this.baseUrl)
    url.searchParams.set('action', 'order')

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        product_id: input.providerProductId, // Veroxan uses UUIDs usually
        quantity: input.quantity,
        external_order_id: input.idempotencyKey,
      }),
    })

    // Handle standard Veroxan error codes
    if (!res.ok) {
      if (res.status === 402 || res.status === 409 || res.status === 401) {
        // Deterministic failure (insufficient balance, out of stock, invalid key)
        return {
          providerOrderId: null,
          status: 'FAILED',
          message: `Veroxan failed with HTTP ${res.status}`,
        }
      }
      if (res.status === 429) {
        // Rate limit - we should retry later, so return PROCESSING or throw Error so BullMQ retries
        throw new Error('Veroxan rate limit exceeded (HTTP 429)')
      }
      throw new Error(`Veroxan fulfillOrder failed: HTTP ${res.status}`)
    }

    const body: unknown = await res.json()
    if (!isRecord(body) || typeof body.order_id !== 'string') {
      throw new Error('Veroxan response did not contain an order_id')
    }

    return {
      providerOrderId: body.order_id,
      status: typeof body.status === 'string' ? mapStatus(body.status) : 'PROCESSING',
      rawResponse: body,
    }
  }

  async checkOrderStatus(providerOrderId: string): Promise<FulfillOrderResult> {
    // Veroxan's documented API only lists ?action=orders for order history.
    // For a specific order, we'd need to paginate and search, but most reseller
    // deliveries are instant. We will scan the first page of history as a fallback.
    const url = new URL(this.baseUrl)
    url.searchParams.set('action', 'orders')
    url.searchParams.set('limit', '50')

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!res.ok) throw new Error(`Veroxan checkOrderStatus failed: HTTP ${res.status}`)

    const body: unknown = await res.json()
    if (Array.isArray(body)) {
      const order = body.find((o: any) => o.order_id === providerOrderId)
      if (order) {
        return {
          providerOrderId: order.order_id,
          status: typeof order.status === 'string' ? mapStatus(order.status) : 'PROCESSING',
          rawResponse: order,
        }
      }
    } else if (isRecord(body) && Array.isArray(body.orders)) {
      const order = body.orders.find((o: any) => o.order_id === providerOrderId)
      if (order) {
        return {
          providerOrderId: order.order_id,
          status: typeof order.status === 'string' ? mapStatus(order.status) : 'PROCESSING',
          rawResponse: order,
        }
      }
    }

    // If we can't find it on the first page, we assume it's still processing 
    // or we can't determine status without expensive pagination.
    return {
      providerOrderId,
      status: 'PROCESSING',
      message: 'Order not found in first page of Veroxan history',
    }
  }
}
