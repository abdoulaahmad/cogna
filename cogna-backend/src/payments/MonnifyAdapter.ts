import axios from 'axios'
import crypto from 'crypto'
import type { IPaymentGateway }    from './IPaymentGateway'
import type { InitPaymentOptions } from '@/types/init-payment-options.types'
import type { PaymentInitResult }  from '@/types/payment-init-result.types'
import type { PaymentVerifyResult } from '@/types/payment-verify-result.types'
import { env } from '@/config/env'

/**
 * MonnifyAdapter — implements IPaymentGateway using the Monnify API.
 *
 * Constructor accepts per-product API credentials, enabling different
 * Monnify contract codes per product without touching global config.
 */
export class MonnifyAdapter implements IPaymentGateway {
  private readonly apiKey:       string
  private readonly secretKey:    string
  private readonly baseUrl:      string
  private readonly contractCode: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config?: {
    apiKey?:       string
    secretKey?:    string
    contractCode?: string
    baseUrl?:      string
  }) {
    this.apiKey       = config?.apiKey       ?? env.MONNIFY_API_KEY       ?? ''
    this.secretKey    = config?.secretKey    ?? env.MONNIFY_SECRET_KEY    ?? ''
    this.contractCode = config?.contractCode ?? env.MONNIFY_CONTRACT_CODE ?? ''
    this.baseUrl      = config?.baseUrl      ?? env.MONNIFY_BASE_URL
  }

  /** Get or refresh the Monnify OAuth2 access token */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const credentials = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64')
    const response = await axios.post(
      `${this.baseUrl}/api/v1/auth/login`,
      {},
      { headers: { Authorization: `Basic ${credentials}` } }
    )

    const { responseBody } = response.data as {
      responseBody: { accessToken: string; expiresIn: number }
    }

    this.accessToken = responseBody.accessToken
    this.tokenExpiry = Date.now() + responseBody.expiresIn * 1000 - 60000
    return this.accessToken
  }

  /** Initialize a Monnify payment and return the checkout URL */
  async initializePayment(options: InitPaymentOptions): Promise<PaymentInitResult> {
    const token = await this.getAccessToken()

    const response = await axios.post(
      `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        amount:              options.amount / 100, // Monnify uses full units, not kobo
        customerName:        options.email,
        customerEmail:       options.email,
        paymentReference:    options.reference,
        paymentDescription:  `Cogna Order ${options.orderId}`,
        currencyCode:        options.currency,
        contractCode:        this.contractCode,
        redirectUrl:         options.callbackUrl,
        paymentMethods:      ['CARD', 'ACCOUNT_TRANSFER'],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const { responseBody } = response.data as {
      responseBody: { checkoutUrl: string; transactionReference: string; paymentReference: string }
    }

    return {
      authorizationUrl: responseBody.checkoutUrl,
      reference:        options.reference,
      gatewayReference: responseBody.transactionReference,
    }
  }

  /** Verify a Monnify transaction by Cogna reference */
  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    const token = await this.getAccessToken()

    const response = await axios.get(
      `${this.baseUrl}/api/v2/transactions/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const { responseBody } = response.data as {
      responseBody: {
        paymentStatus:      string
        amountPaid:         number
        currencyCode:       string
        transactionReference: string
        completedOn:        string | null
      }
    }

    return {
      status:           responseBody.paymentStatus === 'PAID' ? 'success'
                      : responseBody.paymentStatus === 'FAILED' ? 'failed'
                      : 'pending',
      amount:           Math.round(responseBody.amountPaid * 100), // convert back to kobo
      currency:         responseBody.currencyCode,
      gatewayReference: responseBody.transactionReference,
      paidAt:           responseBody.completedOn ? new Date(responseBody.completedOn) : null,
      metadata:         {},
    }
  }

  /**
   * Validate Monnify webhook using HMAC-SHA512.
   * Monnify sends monnify-signature in request headers.
   */
  validateWebhook(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex')
    return hash === signature
  }
}
