import type { IProvider } from './provider.interface'
import type { FulfillOrderInput, FulfillOrderResult } from '@/types/provider.types'

interface AkundingConfig {
  apiKey: string
  baseUrl: string
}

type AkundingOrder = {
  id: string | number
  status: string
  created_at?: number
  delivered_at?: number | null
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Map Akunding's documented status values to Cogna's order lifecycle. */
function mapStatus(status: string): FulfillOrderResult['status'] {
  switch (status.toLowerCase()) {
    case 'delivered':
    case 'completed':
    case 'success':
      return 'COMPLETED'
    case 'cancelled':
    case 'canceled':
      return 'CANCELLED'
    case 'expired':
    case 'failed':
    case 'error':
      return 'FAILED'
    case 'draft':
    case 'pending':
    case 'processing':
    default:
      return 'PROCESSING'
  }
}

function getOrder(body: unknown): AkundingOrder {
  if (!isRecord(body)) throw new Error('Akunding response did not contain an order object')
  const candidate = isRecord(body.data) ? body.data : body
  if (typeof candidate.id !== 'string' && typeof candidate.id !== 'number') {
    throw new Error('Akunding response did not contain an order id')
  }
  if (typeof candidate.status !== 'string') {
    throw new Error('Akunding response did not contain an order status')
  }
  return candidate as AkundingOrder
}

/** Akunding reseller provider adapter. */
export class AkudingAdapter implements IProvider {
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(config: AkundingConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
  }

  async fulfillOrder(input: FulfillOrderInput): Promise<FulfillOrderResult> {
    if (!Number.isInteger(Number(input.providerProductId)) || Number(input.providerProductId) < 1) {
      throw new Error('Akunding provider product ID must be a positive integer')
    }
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 1000) {
      throw new Error('Akunding quantity must be an integer between 1 and 1000')
    }
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        // Akunding requires this header. The value is deterministically derived
        // from Cogna's persisted order ID, so retries can never create a second order.
        'X-Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        product_id: Number(input.providerProductId),
        quantity: input.quantity,
      }),
    })

    if (!res.ok) throw new Error(`Akunding fulfillOrder failed: HTTP ${res.status}`)

    const body: unknown = await res.json()
    if (isRecord(body) && body.success === false) {
      return { providerOrderId: null, status: 'FAILED', message: typeof body.message === 'string' ? body.message : undefined, rawResponse: body }
    }

    const order = getOrder(body)
    return {
      providerOrderId: String(order.id),
      status: mapStatus(order.status),
      rawResponse: isRecord(body) ? body : undefined,
    }
  }

  async checkOrderStatus(providerOrderId: string): Promise<FulfillOrderResult> {
    const res = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(providerOrderId)}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    })

    if (!res.ok) throw new Error(`Akunding checkOrderStatus failed: HTTP ${res.status}`)

    const body: unknown = await res.json()
    const order = getOrder(body)
    return {
      providerOrderId: String(order.id),
      status: mapStatus(order.status),
      rawResponse: isRecord(body) ? body : undefined,
    }
  }

  /**
   * Fetch bulk stock for all products from Akunding in a single call.
   */
  async getProductStocks(): Promise<Record<string, { stock: number; available: boolean }>> {
    try {
      const res = await fetch(`${this.baseUrl}/products`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      if (!res.ok) return {}
      const body: unknown = await res.json()
      if (!Array.isArray(body)) return {}
      const stocks: Record<string, { stock: number; available: boolean }> = {}
      for (const item of body) {
        if (isRecord(item) && item.id !== undefined) {
          const stock = typeof item.stock === 'number' ? item.stock : 0
          const available = typeof item.available === 'boolean' ? item.available : stock > 0
          stocks[String(item.id)] = { stock, available }
        }
      }
      return stocks
    } catch {
      return {}
    }
  }

  /**
   * Fetch stock for a specific Akunding product.
   */
  async getProductStock(providerProductId: string): Promise<{ stock: number; available: boolean } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/products/${encodeURIComponent(providerProductId)}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      if (!res.ok) return null
      const body: unknown = await res.json()
      if (!isRecord(body)) return null
      const stock = typeof body.stock === 'number' ? body.stock : 0
      const available = typeof body.available === 'boolean' ? body.available : stock > 0
      return { stock, available }
    } catch {
      return null
    }
  }
}