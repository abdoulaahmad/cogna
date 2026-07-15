import axios from 'axios'
import crypto from 'crypto'
import type { IPaymentGateway }    from './IPaymentGateway'
import type { InitPaymentOptions } from '@/types/init-payment-options.types'
import type { PaymentInitResult }  from '@/types/payment-init-result.types'
import type { PaymentVerifyResult } from '@/types/payment-verify-result.types'
import { env } from '@/config/env'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'
const PAYSTACK_MINOR_UNIT_FACTOR = 100

function toPaystackMinorUnits(amount: number): number {
  return Math.round(amount * PAYSTACK_MINOR_UNIT_FACTOR)
}

function fromPaystackMinorUnits(amount: number): number {
  return amount / PAYSTACK_MINOR_UNIT_FACTOR
}

/**
 * PaystackAdapter — implements IPaymentGateway using the Paystack API.
 *
 * Config is injected at construction time, enabling per-product keys
 * by passing different secretKey values from the product/provider settings.
 */
export class PaystackAdapter implements IPaymentGateway {
  private readonly secretKey: string

  constructor(secretKey?: string) {
    this.secretKey = secretKey ?? env.PAYSTACK_SECRET_KEY ?? ''
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Initialize a Paystack payment session.
   * Returns the authorization URL to redirect the customer.
   */
  async initializePayment(options: InitPaymentOptions): Promise<PaymentInitResult> {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email:        options.email,
        amount:       toPaystackMinorUnits(options.amount),
        currency:     options.currency,
        reference:    options.reference,
        callback_url: options.callbackUrl,
        metadata:     { orderId: options.orderId, ...(options.metadata ?? {}) },
      },
      { headers: this.headers }
    )

    const { data } = response.data as {
      data: { authorization_url: string; access_code: string; reference: string }
    }

    return {
      authorizationUrl: data.authorization_url,
      reference:        options.reference,
      gatewayReference: data.access_code,
    }
  }

  /**
   * Verify a Paystack transaction by reference.
   * Returns normalized PaymentVerifyResult.
   */
  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      { headers: this.headers }
    )

    const { data } = response.data as {
      data: {
        status: string
        amount: number
        currency: string
        reference: string
        paid_at: string | null
        metadata: Record<string, unknown>
      }
    }

    return {
      status:           data.status === 'success' ? 'success' : data.status === 'abandoned' ? 'failed' : 'pending',
      amount:           fromPaystackMinorUnits(data.amount),
      currency:         data.currency,
      gatewayReference: data.reference,
      paidAt:           data.paid_at ? new Date(data.paid_at) : null,
      metadata:         data.metadata ?? {},
    }
  }

  /**
   * Validate a Paystack webhook signature using HMAC-SHA512.
   * Paystack sends X-Paystack-Signature in the request headers.
   */
  validateWebhook(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex')
    return hash === signature
  }
}
