import crypto from 'crypto'
import Paystack, { type PaystackSdkResponse } from '@paystack/paystack-sdk'
import type { IPaymentGateway } from './IPaymentGateway'
import type { InitPaymentOptions } from '@/types/init-payment-options.types'
import type { PaymentInitResult } from '@/types/payment-init-result.types'
import type { PaymentVerifyResult } from '@/types/payment-verify-result.types'
import { env } from '@/config/env'

const PAYSTACK_MINOR_UNIT_FACTOR = 100

function toPaystackMinorUnits(amount: number): number {
  return Math.round(amount * PAYSTACK_MINOR_UNIT_FACTOR)
}

function fromPaystackMinorUnits(amount: number): number {
  return amount / PAYSTACK_MINOR_UNIT_FACTOR
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function responseData(response: PaystackSdkResponse, operation: string): Record<string, unknown> {
  if (response.status !== true || !isRecord(response.data)) {
    throw new Error(`Paystack ${operation} failed: ${response.message ?? 'invalid gateway response'}`)
  }
  return response.data
}

function requiredString(data: Record<string, unknown>, field: string): string {
  const value = data[field]
  if (typeof value !== 'string' || value.length === 0) throw new Error(`Paystack response is missing ${field}`)
  return value
}

function requiredNumber(data: Record<string, unknown>, field: string): number {
  const value = data[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Paystack response is missing ${field}`)
  return value
}

/** Paystack gateway implementation backed by Paystack's official Node SDK. */
export class PaystackAdapter implements IPaymentGateway {
  private readonly secretKey: string
  private readonly client: Paystack

  constructor(secretKey?: string) {
    this.secretKey = secretKey ?? env.PAYSTACK_SECRET_KEY ?? ''
    this.client = new Paystack(this.secretKey)
  }

  async initializePayment(options: InitPaymentOptions): Promise<PaymentInitResult> {
    if (!this.secretKey) throw new Error('PAYSTACK_SECRET_KEY is required')

    const response = await this.client.transaction.initialize({
      email: options.email,
      amount: toPaystackMinorUnits(options.amount),
      currency: options.currency,
      reference: options.reference,
      ...(options.callbackUrl && { callback_url: options.callbackUrl }),
      metadata: JSON.stringify({ orderId: options.orderId, ...(options.metadata ?? {}) }),
    })
    const data = responseData(response, 'initialization')

    return {
      authorizationUrl: requiredString(data, 'authorization_url'),
      reference: options.reference,
      gatewayReference: requiredString(data, 'access_code'),
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    if (!this.secretKey) throw new Error('PAYSTACK_SECRET_KEY is required')

    const response = await this.client.transaction.verify({ reference })
    const data = responseData(response, 'verification')
    const gatewayStatus = requiredString(data, 'status')
    const paidAt = data.paid_at
    const metadata = isRecord(data.metadata) ? data.metadata : {}

    return {
      status: gatewayStatus === 'success' ? 'success' : gatewayStatus === 'abandoned' || gatewayStatus === 'failed' ? 'failed' : 'pending',
      amount: fromPaystackMinorUnits(requiredNumber(data, 'amount')),
      currency: requiredString(data, 'currency'),
      gatewayReference: requiredString(data, 'reference'),
      paidAt: typeof paidAt === 'string' && paidAt.length > 0 ? new Date(paidAt) : null,
      metadata,
    }
  }

  validateWebhook(payload: string, signature: string): boolean {
    if (!this.secretKey || !/^[a-f0-9]{128}$/i.test(signature)) return false
    const expected = crypto.createHmac('sha512', this.secretKey).update(payload).digest()
    const provided = Buffer.from(signature, 'hex')
    return expected.length === provided.length && crypto.timingSafeEqual(expected, provided)
  }
}
