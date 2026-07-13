import type { IProvider }           from './provider.interface'
import type { FulfillOrderInput, FulfillOrderResult } from '@/types/provider.types'

interface AkudingConfig {
  apiKey:  string
  baseUrl: string
}

/** Map Akunding status strings to Cogna's standard statuses */
function mapStatus(status: string): FulfillOrderResult['status'] {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'COMPLETED'
    case 'failed':
    case 'error':
      return 'FAILED'
    default:
      return 'PROCESSING'
  }
}

/**
 * AkudingAdapter — implements IProvider for the Akunding fulfillment platform.
 *
 * Credentials are injected at construction time (loaded from DB by ProviderFactory).
 * Never hardcode API keys — they come from the providers table at runtime.
 */
export class AkudingAdapter implements IProvider {
  private readonly apiKey:  string
  private readonly baseUrl: string

  constructor(config: AkudingConfig) {
    this.apiKey  = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // strip trailing slash
  }

  /**
   * Submit a product order to Akunding for fulfillment.
   */
  async fulfillOrder(input: FulfillOrderInput): Promise<FulfillOrderResult> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        product_id:     input.providerProductId,
        customer_email: input.customerEmail,
        amount:         input.amount,
        currency:       input.currency,
        reference:      input.orderId,
        metadata:       input.metadata ?? {},
      }),
    })

    if (!res.ok) {
      throw new Error(`Akunding fulfillOrder failed: HTTP ${res.status}`)
    }

    const body = await res.json() as {
      success: boolean
      message?: string
      data:     { orderId: string; status: string }
    }

    return {
      providerOrderId: body.data.orderId,
      status:          body.success ? mapStatus(body.data.status) : 'FAILED',
      message:         body.message,
      rawResponse:     body as unknown as Record<string, unknown>,
    }
  }

  /**
   * Poll Akunding for the current status of a previously submitted order.
   */
  async checkOrderStatus(providerOrderId: string): Promise<FulfillOrderResult> {
    const res = await fetch(`${this.baseUrl}/orders/${providerOrderId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      throw new Error(`Akunding checkOrderStatus failed: HTTP ${res.status}`)
    }

    const body = await res.json() as {
      success: boolean
      data:    { orderId: string; status: string }
    }

    return {
      providerOrderId: body.data.orderId,
      status:          mapStatus(body.data.status),
      rawResponse:     body as unknown as Record<string, unknown>,
    }
  }
}
